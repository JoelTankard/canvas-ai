import { call_function_calling } from "src-rust"; // Adjust the import path as necessary
import { useUserPersistedStore } from "@store/user";
import { fileSystemPrompt } from "./PromptBuilder";
import { PropType } from "vue";

type dataTypes = "boolean" | "object";
type jsonSchema = {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: {
            [key: string]: {
                type: string;
                enum?: string[];
                description?: string;
            };
        };
        required: string[];
        additionalProperties?: boolean;
    };
    strict?: boolean;
};

type toolSchema = {
    type: "function";
    function: jsonSchema;
};

const schemaTypes = {
    boolean: {
        tools: [
            {
                type: "function",
                function: {
                    name: "yes_no_function",
                    description: "A function that returns yes or no",
                    parameters: {
                        type: "object",
                        properties: {
                            is_true: {
                                type: "string",
                                enum: ["yes", "no"],
                                description: "Set to true if the answer is yes, false if the answer is no.",
                            },
                        },
                        required: ["is_true"],
                        additionalProperties: false,
                    },
                    strict: true,
                },
            },
        ],

        outputFunction: (response: any) => {
            return response?.is_true === "yes";
        },
    },

    object: {
        tools: [
            {
                type: "function",
                function: {
                    name: "object_function",
                    description: "A function that returns an object",
                    parameters: {
                        type: "object",
                        properties: {},
                        required: [],
                    },
                    strict: true,
                },
            },
        ],

        outputFunction: (response: string) => {
            return JSON.parse(response);
        },
    },
} as {
    [key in dataTypes]: {
        tools: toolSchema[];
        outputFunction: (response: string) => any;
    };
};

export class FunctionCallingAgent {
    private apiKey: string;
    private sessionId: string;
    private model: string;
    private systemPrompt: string;
    private includeFileContent: boolean;
    private tools: toolSchema[];
    private outputFunction: (response: string) => any;
    constructor({ sessionId, model, systemPrompt, type, toolsSchema, includeFileContent }: { sessionId: string; model?: string; systemPrompt: string; type: dataTypes; toolsSchema?: toolSchema[]; includeFileContent?: boolean }) {
        const userPersistedStore = useUserPersistedStore();

        this.apiKey = userPersistedStore.openaiApiKey;
        this.model = model ?? "gpt-4o-mini";
        this.systemPrompt = systemPrompt;
        this.sessionId = sessionId;
        this.includeFileContent = includeFileContent ?? false;
        this.tools = toolsSchema ?? schemaTypes[type].tools;
        this.outputFunction = schemaTypes[type].outputFunction;
    }

    public async execute(userInput: string): Promise<ReturnType<typeof this.outputFunction>> {
        const systemPrompt = this.includeFileContent ? `${fileSystemPrompt(this.sessionId)}\n${this.systemPrompt}` : this.systemPrompt;
        const messages = [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: userInput,
            },
        ];

        const tools = JSON.stringify(this.tools);

        try {
            const response = await call_function_calling(this.apiKey, JSON.stringify(messages), this.model, tools, 300);
            const functionResponse = JSON.parse(response);

            if (!functionResponse) {
                throw new Error("No function response returned");
            }

            // Assuming the response is a string "yes" or "no"
            const answer = functionResponse.choices[0].message.tool_calls[0].function.arguments;

            return this.outputFunction(answer);
        } catch (error) {
            console.error("Error calling function:", error);
            throw error;
        }
    }
}

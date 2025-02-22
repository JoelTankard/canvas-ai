import { call_function_calling } from "src-rust"; // Adjust the import path as necessary
import { useUserPersistedStore } from "@store/user";
import { fileSystemPrompt } from "./PromptBuilder";
import { PropType } from "vue";

type DataTypes = "boolean" | "object" | "string";

type JsonSchemaProperty =
    | {
          type: DataTypes;
          enum?: string[];
          description?: string;
      }
    | {
          type: "array";
          items: {
              type: DataTypes;
              enum?: string[];
              description?: string;
          };
          enum?: string[];
          description?: string;
      };

type JsonSchema = {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: {
            [key: string]: JsonSchemaProperty;
        };
        required: string[];
        additionalProperties?: boolean;
    };
    strict?: boolean;
};

type ToolSchema = {
    type: "function";
    function: JsonSchema;
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
        ] as ToolSchema[],

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
        ] as ToolSchema[],

        outputFunction: (response: string) => {
            return JSON.parse(response);
        },
    },
} as const;

type SchemaTypes = typeof schemaTypes;

export class FunctionCallingAgent {
    private apiKey: string;
    private sessionId: string;
    private model: string;
    private systemPrompt: string;
    private includeFileContent: boolean;
    private tools: ToolSchema[];
    private outputFunction: (response: string) => any;
    constructor({ sessionId, model, systemPrompt, type, toolsSchema, includeFileContent }: { sessionId: string; model?: string; systemPrompt: string; type: keyof SchemaTypes; toolsSchema?: ToolSchema[]; includeFileContent?: boolean }) {
        const userPersistedStore = useUserPersistedStore();

        this.apiKey = userPersistedStore.openaiApiKey;
        this.model = model ?? "gpt-4o-mini";
        this.systemPrompt = `${systemPrompt}\nYou exist in a canvas-like UI environment where you can move around. On this canvas, there might be documents, notes, and images uploaded by the user that you can interact with.`;
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

            console.log("Function response:", functionResponse);

            // Check if we got a function call response
            if (functionResponse.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
                const answer = functionResponse.choices[0].message.tool_calls[0].function.arguments;
                return this.outputFunction(answer);
            }

            // If we got a regular chat completion, try to parse it as our expected type
            if (functionResponse.choices?.[0]?.message?.content) {
                try {
                    // Try to parse the content as JSON
                    const parsedContent = JSON.parse(functionResponse.choices[0].message.content);
                    return this.outputFunction(JSON.stringify(parsedContent));
                } catch (parseError) {
                    // If it's not JSON, try to convert the message to our expected format
                    if (this.tools[0]?.function?.name === "yes_no_function") {
                        // For boolean type, look for yes/no in the content
                        const content = functionResponse.choices[0].message.content.toLowerCase();
                        const isTrue = content.includes("yes") || content.includes("can") || content.includes("possible");
                        return this.outputFunction(JSON.stringify({ is_true: isTrue ? "yes" : "no" }));
                    }

                    // For object type, wrap the content in an object
                    return this.outputFunction(JSON.stringify({ content: functionResponse.choices[0].message.content }));
                }
            }

            console.error("Invalid function response structure:", functionResponse);
            throw new Error("Invalid function response structure");
        } catch (error) {
            console.error("Error calling function:", error);
            throw error;
        }
    }
}

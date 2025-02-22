import { FunctionCallingAgent } from "../lib/FunctionCallingAgent";

export const canGetIntent = (sessionId: string) => {
    return new FunctionCallingAgent({
        sessionId,
        systemPrompt: "Can you determine if the user can get an intent from the message & files?",
        includeFileContent: true,
        type: "boolean",
    });
};

export const getIntent = (sessionId: string) => {
    return new FunctionCallingAgent({
        sessionId,
        systemPrompt: "Can you determine if the user can get an intent from the message & files? If so what is the user's goal?",
        includeFileContent: true,
        type: "object",
        toolsSchema: {
            name: "get_intent",
            description: "Get the user's intent from the message & files",
            parameters: {
                type: "object",
                properties: {
                    can_get_intent: { type: "string", enum: ["yes", "no"], description: "Set to yes if the user can get an intent from the message & files, no if they cannot." },
                    intent: { type: "string", description: "The user's goal if can_get_intent is yes, otherwise an empty string." },
                },
                required: ["can_get_intent", "intent"],
                additionalProperties: false,
            },
        },
    });
};

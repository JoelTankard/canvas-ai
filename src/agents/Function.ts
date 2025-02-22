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
        toolsSchema: [
            {
                type: "function",
                function: {
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
            },
        ],
    });
};

export const selectMacros = (sessionId: string, availableMacros: string[]) => {
    const hasMacros = availableMacros.length > 0;

    const systemPrompt = hasMacros ? `Process these steps using existing macros where possible, create new ones where needed. Available macros: ${availableMacros.join(", ")}` : "Create new macros for the steps in this plan";

    const parameters = {
        type: "object",
        properties: {
            new_macros: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        step: { type: "number", description: "Step number in sequence" },
                        macro: { type: "string", description: "Name of the new macro (must be snake_case and follow verb_noun pattern)" },
                        description: { type: "string", description: "Clear description of what this macro does" },
                        expected_output: { type: "string", description: "Clear description of what the macro will output" },
                    },
                    required: ["step", "macro", "description", "expected_output"],
                    additionalProperties: false,
                },
            },
        },
        required: ["new_macros"],
        additionalProperties: false,
    };

    if (hasMacros) {
        parameters.properties["selected_macros"] = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    step: { type: "number", description: "Step number in sequence" },
                    macro: { type: "string", description: "Name of the selected existing macro" },
                },
                required: ["step", "macro"],
                additionalProperties: false,
            },
        };
        parameters.required.push("selected_macros");
    }
    return new FunctionCallingAgent({
        sessionId,
        systemPrompt,
        type: "object",
        toolsSchema: [
            {
                type: "function",
                function: {
                    name: "process_macros",
                    description: "Process steps using existing macros where possible, create new ones where needed",
                    parameters,
                    strict: true,
                },
            },
        ],
    });
};

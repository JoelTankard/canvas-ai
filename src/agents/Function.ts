import { FunctionCallingAgent } from "../lib/FunctionCallingAgent";
import { primitives } from "../lib/primitives";

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

    type ParameterType = {
        type: "object";
        properties: {
            [key: string]: {
                type: string;
                items?: {
                    type: string;
                    properties: {
                        [key: string]: { type: string; description: string };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
            };
        };
        required: string[];
        additionalProperties: boolean;
    };

    const parameters: ParameterType = {
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
        parameters.properties.selected_macros = {
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

export interface MacroDesignRequest {
    name: string;
    description: string;
}

export interface MacroDesign {
    name: string;
    description: string;
    sequence: {
        primitive: keyof typeof primitives;
        params: {
            message?: string;
            code?: string;
            condition?: string;
            branches?: Array<MacroDesign["sequence"]>;
        };
        description: string;
    }[];
}

export interface MacroDesignResponse {
    macros: MacroDesign[];
}

export const designMacros = (sessionId: string, macroRequests: MacroDesignRequest[]) => {
    const systemPrompt = `Design macros that will work together as a cohesive system. Each macro should be composed of primitive operations.`;

    const parameters = {
        type: "object" as const,
        properties: {
            macros: {
                type: "array" as const,
                description: "List of macro designs",
                items: {
                    type: "object" as const,
                    properties: {
                        name: { type: "string", description: "Name of the macro", enum: macroRequests.map((r) => r.name) },
                        description: { type: "string", description: "Description of what the macro does" },
                        sequence: {
                            type: "array" as const,
                            description: "Sequence of primitive operations",
                            items: {
                                type: "object" as const,
                                properties: {
                                    primitive: {
                                        type: "string",
                                        description: "Name of the primitive operation to use",
                                        enum: Object.keys(primitives),
                                    },
                                    params: {
                                        type: "object" as const,
                                        description: "Parameters for the primitive",
                                        properties: {
                                            message: { type: "string", description: "Message to send (for send_message)" },
                                            code: { type: "string", description: "Code to execute (for execute_code)" },
                                            condition: { type: "string", description: "Condition to evaluate (for if_condition, if_else_condition)" },
                                            branches: {
                                                type: "array" as const,
                                                description: "Branches for control flow primitives",
                                                items: {
                                                    type: "array" as const,
                                                    items: {
                                                        type: "object" as const,
                                                        properties: {
                                                            primitive: { type: "string", enum: Object.keys(primitives) },
                                                            params: { type: "object" },
                                                            description: { type: "string" },
                                                        },
                                                        required: ["primitive", "params", "description"],
                                                    },
                                                },
                                            },
                                        },
                                        additionalProperties: false,
                                    },
                                    description: { type: "string", description: "Description of what this step does" },
                                },
                                required: ["primitive", "params", "description"],
                            },
                        },
                    },
                    required: ["name", "description", "sequence"],
                    additionalProperties: false, // <-- This fixes the error
                },
            },
        },
        required: ["macros"],
        additionalProperties: false,
    };

    return new FunctionCallingAgent({
        sessionId,
        systemPrompt,
        type: "object",
        toolsSchema: [
            {
                type: "function",
                function: {
                    name: "design_macros",
                    description: `Design ${macroRequests.length} macros: ${macroRequests.map((r) => r.name).join(", ")}`,
                    parameters,
                    strict: true,
                },
            },
        ],
    });
};

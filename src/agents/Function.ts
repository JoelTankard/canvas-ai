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

export interface MacroSelectionResult {
    selected_macros: Array<{
        step: number;
        macro: string;
        description?: string;
    }>;
    new_macros: Array<{
        step: number;
        macro: string;
        description: string;
    }>;
}

export const selectMacros = (sessionId: string, availableMacros: string[]) => {
    const hasMacros = availableMacros.length > 0;

    const systemPrompt = hasMacros ? `Process these steps using existing macros where possible, create new ones where needed. Available macros: ${availableMacros.join(", ")}` : "Create new macros for the steps in this plan";

    const parameters = {
        type: "object" as const,
        properties: {
            selected_macros: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        step: { type: "number", description: "Step number in sequence" },
                        macro: { type: "string", description: "Name of the selected existing macro" },
                        description: { type: "string", description: "Description of what this macro does" },
                    },
                    required: ["step", "macro", "description"],
                    additionalProperties: false,
                },
            },
            new_macros: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        step: { type: "number", description: "Step number in sequence" },
                        macro: { type: "string", description: "Name of the new macro (must be snake_case and follow verb_noun pattern)" },
                        description: { type: "string", description: "Clear description of what this macro does" },
                    },
                    required: ["step", "macro", "description"],
                    additionalProperties: false,
                },
            },
        },
        required: ["new_macros", "selected_macros"],
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
        message?: string;
        code?: string;
        condition?: string;
        move_to_x?: number;
        move_to_y?: number;
        document_path?: string;
        document_target?: string;
        description: string;
        status?: "success" | "failed";
    }[];
}

export interface MacroDesignResponse {
    macros: MacroDesign[];
}

export interface MacroFeasibilityResult {
    is_feasible: boolean;
    suggested_primitives: string[];
    reason?: string;
}

export const analyzeMacroFeasibility = (sessionId: string, macroDescription: string) => {
    return new FunctionCallingAgent({
        sessionId,
        systemPrompt: "Analyze if a macro can be built from available primitives and suggest which ones would be useful. Consider: 1) If the macro's goal can be achieved with available primitives 2) Which primitives would be most appropriate 3) If the primitives can be meaningfully chained together for this purpose",
        type: "object",
        toolsSchema: [
            {
                type: "function",
                function: {
                    name: "analyze_macro_feasibility",
                    description: "Analyze if a macro can be built from available primitives and suggest which ones to use",
                    parameters: {
                        type: "object",
                        properties: {
                            is_feasible: {
                                type: "boolean",
                                description: "Whether the macro can be feasibly built with available primitives",
                            },
                            suggested_primitives: {
                                type: "array",
                                description: "List of primitive names that would be useful for this macro",
                                items: {
                                    type: "string",
                                    enum: Object.keys(primitives),
                                },
                            },
                            reason: {
                                type: "string",
                                description: "Explanation of why the macro is or isn't feasible",
                            },
                        },
                        required: ["is_feasible", "suggested_primitives", "reason"],
                        additionalProperties: false,
                    },
                },
            },
        ],
    });
};

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
                        name: {
                            type: "string",
                            description: "Name of the macro",
                            enum: macroRequests.map((r) => r.name),
                        },
                        description: {
                            type: "string",
                            description: "Description of what the macro does",
                        },
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
                                    message: {
                                        type: "string",
                                        description: "Message to send (for send_message)",
                                    },
                                    code: {
                                        type: "string",
                                        description: "Code to execute (for execute_code)",
                                    },
                                    condition: {
                                        type: "string",
                                        description: "Condition to evaluate (for if_condition)",
                                    },
                                    move_to_x: {
                                        type: "number",
                                        description: "X coordinate for document movement",
                                    },
                                    move_to_y: {
                                        type: "number",
                                        description: "Y coordinate for document movement",
                                    },
                                    document_path: {
                                        type: "string",
                                        description: "Path of document to move",
                                    },
                                    document_target: {
                                        type: "string",
                                        description: "Target location for document",
                                    },
                                    description: {
                                        type: "string",
                                        description: "Description of what this step does",
                                    },
                                },
                                required: ["primitive", "description"],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ["name", "description", "sequence"],
                    additionalProperties: false,
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

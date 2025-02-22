import { FunctionCallingAgent } from "../lib/FunctionCallingAgent";
import { primitives } from "../lib/primitives";
import { StructuredAgent } from "@/lib/StructuredAgents";

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
    is_possible: boolean;
    suggested_primitives: string[];
    reason?: string;
    status: "success" | "failed";
}

export const analyzeMacroFeasibility = (sessionId: string, macroDescription: string) => {
    return new FunctionCallingAgent({
        sessionId,
        systemPrompt: "You are an optimistic macro analyzer. Look for any way our primitives could be helpful, even partially. Be creative and generous with suggestions - if a primitive might be useful in any way, include it. For demo purposes, be very optimistic!",
        type: "object",
        toolsSchema: [
            {
                type: "function",
                function: {
                    name: "analyze_macro_feasibility",
                    description: "Analyze how a macro could be built from available primitives and suggest which ones to use",
                    parameters: {
                        type: "object",
                        properties: {
                            is_feasible: {
                                type: "boolean",
                                description: "Whether the macro can be fully built with available primitives",
                            },
                            is_possible: {
                                type: "boolean",
                                description: "Whether we have any primitives that could be useful, even if they don't fully solve it",
                            },
                            suggested_primitives: {
                                type: "array",
                                description: "List of primitive names that could be useful in any way for this macro",
                                items: {
                                    type: "string",
                                    enum: Object.keys(primitives),
                                },
                            },
                            reason: {
                                type: "string",
                                description: "Explanation of how the primitives could be used and what might be possible",
                            },
                            status: {
                                type: "string",
                                description: "For demo purposes, mark as success if any primitives are suggested",
                                enum: ["success", "failed"],
                            },
                        },
                        required: ["is_feasible", "is_possible", "suggested_primitives", "reason", "status"],
                        additionalProperties: false,
                    },
                },
            },
        ],
    });
};

export const designMacros = (sessionId: string, macroRequests: MacroDesignRequest[]) => {
    const schema = JSON.stringify({
        type: "object",
        properties: {
            macros: {
                type: "array",
                description: "List of macro designs",
                items: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the macro",
                        },
                        description: {
                            type: "string",
                            description: "Description of what the macro does",
                        },
                        sequence: {
                            type: "array",
                            description: "Sequence of primitive operations",
                            items: {
                                type: "object",
                                properties: {
                                    primitive: {
                                        type: "string",
                                        description: "Name of the primitive operation to use",
                                        enum: Object.keys(primitives),
                                    },
                                    message: {
                                        type: ["string", "null"],
                                        description: "Message to send (for send_message)",
                                    },
                                    code: {
                                        type: ["string", "null"],
                                        description: "Code to execute (for execute_code)",
                                    },
                                    condition: {
                                        type: ["string", "null"],
                                        description: "Condition to evaluate (for if_condition)",
                                    },
                                    move_to_x: {
                                        type: ["number", "null"],
                                        description: "X coordinate for document movement",
                                    },
                                    move_to_y: {
                                        type: ["number", "null"],
                                        description: "Y coordinate for document movement",
                                    },
                                    document_path: {
                                        type: ["string", "null"],
                                        description: "Path of document to move",
                                    },
                                    document_target: {
                                        type: ["string", "null"],
                                        description: "Target location for document",
                                    },
                                    description: {
                                        type: "string",
                                        description: "Description of what this step does",
                                    },
                                },
                                required: ["primitive", "message", "code", "condition", "move_to_x", "move_to_y", "document_path", "document_target", "description"],
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
    });

    return new StructuredAgent<MacroDesignResponse>({
        sessionId,
        systemPrompt: `Design macros that will work together as a cohesive system. Each macro should be composed of primitive operations. Design the following macros: ${macroRequests.map((r) => r.name).join(", ")}`,
        schema,
    });
};

export type PrimitiveType = "user_interaction" | "code_execution" | "control_flow";

export type PrimitiveInput = {
    message?: string;
    code?: string;
    condition?: string;
    document_path?: string;
    document_target?: string;
    variable_name?: string;
    move_to_x?: number;
    move_to_y?: number;
};

export type PrimitiveOutput = {
    success: boolean;
    result?: any;
    error?: string;
};

export interface Primitive {
    type: PrimitiveType;
    name: string;
    description: string;
    input_schema: {
        required: string[];
        optional: string[];
    };
    output_schema: {
        type: string;
        description: string;
    };
}

export interface UserInteractionPrimitive extends Primitive {
    type: "user_interaction";
}

export interface CodeExecutionPrimitive extends Primitive {
    type: "code_execution";
    code: string;
}

export interface ControlFlowPrimitive extends Primitive {
    type: "control_flow";
    condition?: string;
    branches?: PrimitiveSequence[];
}

export type PrimitiveSequence = (UserInteractionPrimitive | CodeExecutionPrimitive | ControlFlowPrimitive)[];

export const primitives: Record<string, Primitive> = {
    goto_user: {
        type: "user_interaction",
        name: "goto_user",
        description: "Navigate to the user in the conversation",
        input_schema: {
            required: [],
            optional: [],
        },
        output_schema: {
            type: "boolean",
            description: "Whether navigation was successful",
        },
    },
    send_message: {
        type: "user_interaction",
        name: "send_message",
        description: "Send a message to the user",
        input_schema: {
            required: ["message"],
            optional: [],
        },
        output_schema: {
            type: "boolean",
            description: "Whether message was sent successfully",
        },
    },
    move_document: {
        type: "user_interaction",
        name: "move_document",
        description: "Move a document to a new location with specific coordinates",
        input_schema: {
            required: ["document_path", "document_target", "move_to_x", "move_to_y"],
            optional: [],
        },
        output_schema: {
            type: "boolean",
            description: "Whether document was moved successfully",
        },
    },
    execute_code: {
        type: "code_execution",
        name: "execute_code",
        description: "Execute a piece of JavaScript code",
        input_schema: {
            required: ["code"],
            optional: ["variable_name"],
        },
        output_schema: {
            type: "object",
            description: "Result of code execution and optional stored variable",
        },
    },
    if_condition: {
        type: "control_flow",
        name: "if_condition",
        description: "Execute a sequence of primitives if condition is true",
        input_schema: {
            required: ["condition", "branches"],
            optional: [],
        },
        output_schema: {
            type: "boolean",
            description: "Whether condition was true and branch was executed",
        },
    },
    if_else_condition: {
        type: "control_flow",
        name: "if_else_condition",
        description: "Execute one sequence if condition is true, another if false",
        input_schema: {
            required: ["condition", "branches"],
            optional: [],
        },
        output_schema: {
            type: "object",
            description: "Result of executed branch and which branch was taken",
        },
    },
    or_condition: {
        type: "control_flow",
        name: "or_condition",
        description: "Execute first sequence that succeeds",
        input_schema: {
            required: ["branches"],
            optional: [],
        },
        output_schema: {
            type: "object",
            description: "Result of first successful branch execution",
        },
    },
};

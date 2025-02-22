export type PrimitiveType = "user_interaction" | "code_execution" | "control_flow";

export interface Primitive {
    type: PrimitiveType;
    name: string;
    description: string;
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
    },
    send_message: {
        type: "user_interaction",
        name: "send_message",
        description: "Send a message to the user",
    },
    execute_code: {
        type: "code_execution",
        name: "execute_code",
        description: "Execute a piece of JavaScript code",
    },
    if_condition: {
        type: "control_flow",
        name: "if_condition",
        description: "Execute a sequence of primitives if condition is true",
    },
    if_else_condition: {
        type: "control_flow",
        name: "if_else_condition",
        description: "Execute one sequence if condition is true, another if false",
    },
    or_condition: {
        type: "control_flow",
        name: "or_condition",
        description: "Execute first sequence that succeeds",
    },
};

import { FunctionAgent } from "@/lib/FunctionAgent";
import { MacroStep } from "@/stores/PlanInteraction";

const MACRO_FUNCTION = {
    name: "create_macro_sequence",
    description: "Convert a plan into a sequence of executable macros",
    parameters: {
        type: "object",
        properties: {
            macroSequence: {
                type: "array",
                description: "Sequence of macros to execute",
                items: {
                    type: "object",
                    properties: {
                        step: {
                            type: "number",
                            description: "Step number in the sequence",
                        },
                        macro: {
                            type: "string",
                            description: "Name of the macro to execute",
                        },
                        description: {
                            type: "string",
                            description: "Description of what the macro does (only for new macros)",
                        },
                    },
                    required: ["step", "macro"],
                    additionalProperties: false,
                },
                minItems: 1,
            },
        },
        required: ["macroSequence"],
        additionalProperties: false,
    },
};

export function macroConverter(sessionId: string, availableMacros: string[]): FunctionAgent {
    return new FunctionAgent({
        sessionId,
        systemPrompt: `You are a macro planning AI that converts plans into executable sequences.
Available macros: ${availableMacros.join(", ")}

Rules:
1. Prefer existing macros when possible
2. For new macros, provide clear descriptions
3. Each step must correspond to exactly one macro
4. Maintain the original sequence order
5. Use snake_case for all macro names
6. New macros should follow the pattern: verb_noun`,
        functions: [MACRO_FUNCTION],
        functionCall: "create_macro_sequence",
    });
}

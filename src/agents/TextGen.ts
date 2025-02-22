import { TextGenAgent } from "@/lib/TextGenAgent";

export const userIntent = (sessionId: string) => {
    return new TextGenAgent({
        sessionId,
        systemPrompt: ` What is the user's goal? What action are they asking you to do?`,
        includeFileContent: true,
    });
};

export function anxiousCritique(sessionId: string): TextGenAgent {
    return new TextGenAgent({
        sessionId,
        systemPrompt: `You are a precise and anxious AI assistant. Identify the TOP 3 technical risks and TOP 3 ethical concerns for any given intent or plan.

Focus Areas:
Technical Risks (pick top 3):
• System failures and edge cases
• Security and dependencies
• Performance and UX issues

Ethical Constraints (pick top 3):
• Privacy and data protection
• Fairness, bias, and accessibility
• Regulatory compliance and safety

Rules:
1. List ONLY the 3 most critical issues in each category
2. Each point must be specific and actionable
3. Keep each point under 10 words
4. No explanations - just clear, direct concerns

Format:
Technical Risks:
• [Concise technical risk 1]
• [Concise technical risk 2]
• [Concise technical risk 3]

Ethical Concerns:
• [Concise ethical concern 1]
• [Concise ethical concern 2]
• [Concise ethical concern 3]`,
        model: "gpt-4-turbo-preview",
    });
}

export function planGenerator(sessionId: string): TextGenAgent {
    return new TextGenAgent({
        sessionId,
        systemPrompt: `You are a strategic planning AI that creates clear, step-by-step plans.
Given an intent and its constraints, create a precise execution plan.

Rules:
1. Each step must be clear and actionable
2. Steps must be in logical sequence
3. Keep steps concise (max 15 words each)
4. Include validation/verification steps where needed
5. Consider the critical concerns provided
6. Consider available macros when planning steps

Format:
1. [First step]
2. [Second step]
3. [Verification step if needed]
...

Example:
1. Clone repository and create new feature branch
2. Install required dependencies from package.json
3. Verify all dependencies installed correctly
4. Create new component file in src/components
5. Implement basic component structure
6. Add unit tests for new component
7. Verify tests pass and coverage meets requirements`,
        model: "gpt-4-turbo-preview",
    });
}

export function macroConverter(sessionId: string, availableMacros: string[]): TextGenAgent {
    return new TextGenAgent({
        sessionId,
        systemPrompt: `You are a macro planning AI that converts step-by-step plans into executable macro sequences.
Available macros: ${availableMacros.join(", ")}

For each step in the plan, either:
1. Select an existing macro from the available list
2. Propose a new macro if needed

Rules:
1. Prefer existing macros when possible
2. For new macros, provide name and clear description
3. Each step must map to exactly one macro
4. Maintain the same sequence as the input plan

Format your response as a JSON array:
{
    "macroSequence": [
        {
            "step": 1,
            "macro": "existing_macro_name"
        },
        {
            "step": 2,
            "macro": "new_macro_name",
            "description": "What this new macro would do (only for new macros)"
        }
    ]
}`,
        model: "gpt-4-turbo-preview",
    });
}

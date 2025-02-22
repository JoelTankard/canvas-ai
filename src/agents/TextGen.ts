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

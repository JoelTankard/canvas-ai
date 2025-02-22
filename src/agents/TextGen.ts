import { TextGenAgent } from "@/lib/TextGenAgent";

export const userIntent = (sessionId: string) => {
    return new TextGenAgent({
        sessionId,
        systemPrompt: ` What is the user's goal? What action are they asking you to do?`,
        includeFileContent: true,
    });
};

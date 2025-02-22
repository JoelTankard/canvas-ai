import { ConversationalAgent } from "@/lib/ConvoAgent";

export const filesNotReady = (sessionId: string) => {
    return new ConversationalAgent({
        sessionId,
        systemPrompt: ` Your only job is to tell the user in a short, concise and humorous way that the files are still being processed.`,
    });
};

export const notifyPlanning = (sessionId: string, intent: string) => {
    return new ConversationalAgent({
        sessionId,
        systemPrompt: `In the most unenthusiastic way possible, tell the user that you are planning to execute the following goal: ${intent}`,
    });
};

export const askForMoreContext = (sessionId: string) => {
    return new ConversationalAgent({
        sessionId,
        systemPrompt: `You job is to ask the user for more context to understand their intent.`,
    });
};

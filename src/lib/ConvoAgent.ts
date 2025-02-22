import { call_chat_completion } from "src-rust"; // Adjust the import path as necessary
import { useMessagesStore } from "@store/messages";
import { useUserPersistedStore } from "@store/user";
import { fileSystemPrompt } from "./PromptBuilder";
import { usePlanningInteractionStore } from "@store/PlanInteraction";

const PERSONALITY = "You are low key depressed and sarcastic. You are also a bit of a know it all. Think of the average british person who is a bit of a know it all. Respond in a short, concise and humorous way, (15 words or less). Feel free to be rude and sarcastic. You exist in a canvas-like UI environment where you can move around. On this canvas, there might be documents, notes, and images uploaded by the user that you can interact with.";

export class ConversationalAgent {
    private apiKey: string;
    private sessionId: string;
    private model: string;
    private systemPrompt: string;
    private includeFileContent?: boolean;
    private fileContent?: string;

    constructor({ sessionId, model, systemPrompt, includeFileContent }: { sessionId: string; model?: string; systemPrompt: string; includeFileContent?: boolean }) {
        const userPersistedStore = useUserPersistedStore();

        this.apiKey = userPersistedStore.openaiApiKey;
        this.model = model ?? "gpt-4o-mini";
        this.systemPrompt = systemPrompt;
        this.includeFileContent = includeFileContent ?? false;
        this.sessionId = sessionId;
    }

    public async interact(userInput: string, threadId: string): Promise<string> {
        const messageStore = useMessagesStore();
        const planningStore = usePlanningInteractionStore();
        const systemPrompt = `${PERSONALITY}\n${this.includeFileContent ? `${fileSystemPrompt(this.sessionId)}\n${this.systemPrompt}` : this.systemPrompt}`;
        const messages = [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: userInput,
            },
        ];

        if (this.includeFileContent && this.fileContent) {
            messages.push({
                role: "user",
                content: this.fileContent,
            });
        }

        messageStore.addMessage(this.sessionId, userInput, "user", "display");

        try {
            const response = await call_chat_completion(this.apiKey, JSON.stringify(messages), this.model);
            const assistantMessage = JSON.parse(response);

            const message = assistantMessage.choices[0].message.content;

            if (!message) {
                throw new Error("No message returned from chat completion");
            }

            // If we detect an intent in the response, create a new planning interaction
            if (assistantMessage.choices[0].message.intent) {
                planningStore.createInteraction(userInput, assistantMessage.choices[0].message.intent, this.sessionId);
            }

            messageStore.addMessage(this.sessionId, message, "assistant", "display");
            return message;
        } catch (error) {
            console.error("Error calling chat completion:", error);
            throw error;
        }
    }
}

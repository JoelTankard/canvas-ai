import { call_chat_completion } from "src-rust"; // Adjust the import path as necessary
import { useUserPersistedStore } from "@store/user";
import { fileSystemPrompt } from "./PromptBuilder";

export class TextGenAgent {
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
        this.systemPrompt = `${systemPrompt}\nYou exist in a canvas-like UI environment where you can move around. On this canvas, there might be documents, notes, and images uploaded by the user that you can interact with.`;
        this.includeFileContent = includeFileContent ?? false;
        this.sessionId = sessionId;
    }

    public async generate(userInput: string): Promise<string> {
        const systemPrompt = `${this.includeFileContent ? `${fileSystemPrompt(this.sessionId)}\n${this.systemPrompt}` : this.systemPrompt}`;
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

        try {
            const response = await call_chat_completion(this.apiKey, JSON.stringify(messages), this.model);
            const assistantMessage = JSON.parse(response);

            const message = assistantMessage.choices[0].message.content;

            if (!message) {
                throw new Error("No message returned from chat completion");
            }

            return message;
        } catch (error) {
            console.error("Error calling chat completion:", error);
            throw error;
        }
    }
}

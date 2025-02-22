import { call_structured_output } from "src-rust"; // Adjust the import path as necessary
import { useUserPersistedStore } from "@store/user";

export class StructuredAgent {
    private apiKey: string;
    private sessionId: string;
    private model: string;
    private systemPrompt: string;
    private schema: string;

    constructor({ sessionId, model, systemPrompt, schema }: { sessionId: string; model?: string; systemPrompt: string; schema: string }) {
        const userPersistedStore = useUserPersistedStore();

        this.apiKey = userPersistedStore.openaiApiKey;
        this.model = model ?? "gpt-4o-mini-2024-07-18";
        this.systemPrompt = systemPrompt;
        this.schema = schema;
        this.sessionId = sessionId;
    }

    public async interact(userInput: string): Promise<string> {
        const prompt = `${this.systemPrompt}\n${userInput}`;

        try {
            const response = await call_structured_output(this.apiKey, prompt, this.model, this.schema, 300);
            const structuredResponse = JSON.parse(response);

            if (!structuredResponse) {
                throw new Error("No structured response returned");
            }

            return structuredResponse;
        } catch (error) {
            console.error("Error calling structured output:", error);
            throw error;
        }
    }
}

import { call_structured_output } from "src-rust"; // Adjust the import path as necessary
import { useUserPersistedStore } from "@store/user";

export class StructuredAgent<T extends Record<string, unknown> = Record<string, unknown>> {
    private apiKey: string;
    private sessionId: string;
    private model: string;
    private systemPrompt: string;
    private schema: string;

    constructor({ sessionId, model, systemPrompt, schema }: { sessionId: string; model?: string; systemPrompt: string; schema: string }) {
        const userPersistedStore = useUserPersistedStore();

        this.apiKey = userPersistedStore.openaiApiKey;
        this.model = model ?? "gpt-4o-mini-2024-07-18";
        this.systemPrompt = `${systemPrompt}\nYou exist in a canvas-like UI environment where you can move around. On this canvas, there might be documents, notes, and images uploaded by the user that you can interact with.`;
        this.schema = schema;
        this.sessionId = sessionId;
    }

    private tryParsePartialJson(content: string): any {
        try {
            // Try to parse as is first
            return JSON.parse(content);
        } catch (e) {
            try {
                // Try to complete the JSON by adding missing closing brackets
                let fixedContent = content;
                const openBraces = (content.match(/\{/g) || []).length;
                const closeBraces = (content.match(/\}/g) || []).length;
                const openBrackets = (content.match(/\[/g) || []).length;
                const closeBrackets = (content.match(/\]/g) || []).length;

                // Add missing closing braces and brackets
                fixedContent += "}".repeat(openBraces - closeBraces);
                fixedContent += "]".repeat(openBrackets - closeBrackets);

                return JSON.parse(fixedContent);
            } catch (e2) {
                console.error("Failed to parse partial JSON:", e2);
                throw new Error("Failed to parse response as JSON");
            }
        }
    }

    public async interact(userInput: string): Promise<T> {
        const prompt = `${this.systemPrompt}\n${userInput}`;

        try {
            const response = await call_structured_output(this.apiKey, prompt, this.model, this.schema, 2000);
            console.log("Raw structured response:", response);

            const functionResponse = JSON.parse(response);
            if (!functionResponse) {
                throw new Error("No structured response returned");
            }

            let structuredResponse: T;
            try {
                const content = functionResponse.choices[0].message.content;
                structuredResponse = this.tryParsePartialJson(content);
            } catch (parseError) {
                console.error("Failed to parse structured response:", parseError);
                throw new Error("Invalid JSON response from structured output");
            }

            // Basic schema validation
            const schema = JSON.parse(this.schema);
            if (schema.required && Array.isArray(schema.required)) {
                for (const requiredField of schema.required) {
                    if (!(requiredField in structuredResponse)) {
                        throw new Error(`Missing required field: ${requiredField}`);
                    }
                }
            }

            return structuredResponse;
        } catch (error) {
            console.error("Error calling structured output:", error);
            throw error;
        }
    }
}

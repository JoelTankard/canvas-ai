import { defineStore } from "pinia";
import { useUserPersistedStore } from "./user";
import { create_assistant, create_thread_with_assistant_id } from "src-rust";
import { useThread } from "./thread";

export interface AssistantConfig {
    name: string;
    description: string;
    model: string;
    tools: string[];
}

export interface Assistant {
    id: string;
    name: string;
    description: string;
    model: string;
    tools: string[];
}

export const assistantsConfig: AssistantConfig[] = [
    {
        name: "Parser",
        description: "Analyze documents and provide descriptions include key details.",
        model: "gpt-4o-mini",
        tools: ["file_search"],
    },
    // Add more assistant configurations here
];

export const useAssistantStore = defineStore("assistant", {
    state: () => ({
        assistants: [] as Assistant[],
    }),
    actions: {
        getAssistantByName(name: string) {
            return this.assistants.find((assistant) => assistant.name === name);
        },
        setAssistants(assistants: Assistant[]) {
            this.assistants = assistants;
        },
        addAssistant(assistant: Assistant) {
            if (!this.assistants.includes(assistant)) {
                this.assistants.push(assistant);
            }
        },
        async initializeAssistants() {
            const userStore = useUserPersistedStore();
            const apiKey = userStore.openaiApiKey;

            if (!apiKey) {
                throw new Error("API key is not set");
            }

            const existingConfigs = new Set<string>();
            const threadStore = useThread();

            for (const config of assistantsConfig) {
                const configKey = JSON.stringify(config);
                if (existingConfigs.has(configKey)) {
                    continue; // Skip creating duplicate assistant
                }

                const assistant_id = await create_assistant(apiKey, config.name, config.description, config.model, JSON.stringify(config.tools));
                const thread_id = await create_thread_with_assistant_id(apiKey, assistant_id);
                const assistant = { id: assistant_id, ...config };
                this.addAssistant(assistant);
                threadStore.addThread({ id: thread_id, assistantId: assistant_id });
                existingConfigs.add(configKey);
            }
        },
    },
});

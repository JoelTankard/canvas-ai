import { defineStore } from "pinia";
import { useUserPersistedStore } from "@store/user";
import { create_assistant } from "src-rust";

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
            if (!this.assistants.find((a) => a.id === assistant.id)) {
                this.assistants.push(assistant);
            }
        },
        async initializeAssistants() {
            const userStore = useUserPersistedStore();
            const apiKey = userStore.openaiApiKey;

            if (!apiKey) {
                throw new Error("API key is not set");
            }

            for (const config of assistantsConfig) {
                const assistant = this.getAssistantByName(config.name);
                if (!assistant) {
                    const assistant_id = await create_assistant(apiKey, config.name, config.description, config.model, JSON.stringify(config.tools));
                    console.log("assistant_id response", assistant_id);
                    const assistant = { id: assistant_id, ...config };
                    this.addAssistant(assistant);
                }
            }
        },
    },
    persist: true,
});

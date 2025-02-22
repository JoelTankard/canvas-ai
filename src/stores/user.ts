import { defineStore } from "pinia";
import { create_assistant } from "src-rust";
import { useAssistantStore } from "./assistant.ts";

export const useUserStore = defineStore("user", {
    state: () => ({
        count: 0,
    }),
});

export const useUserPersistedStore = defineStore("userPersist", {
    state: () => ({
        count: 0,
        apiKey: "",
    }),
    getters: {
        openaiApiKey: (state) => state.apiKey || "",
    },
    actions: {
        async setApiKey(key: string) {
            this.apiKey = key;
            await this.createAssistant();
        },
        async createAssistant() {
            if (!this.apiKey) {
                throw new Error("API key is not set");
            }

            const assistantStore = useAssistantStore();
            await assistantStore.initializeAssistants();
        },
    },
    persist: true,
});

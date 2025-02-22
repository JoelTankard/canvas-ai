import { defineStore } from "pinia";

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
        setApiKey(key: string) {
            this.apiKey = key;
        },
    },
    persist: true,
});

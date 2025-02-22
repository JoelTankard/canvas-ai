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
    actions: {
        setApiKey(key: string) {
            this.apiKey = key;
        },
    },
    persist: true,
});

import { defineStore } from "pinia";

export const useExampleStore = defineStore("example", {
    state: () => ({
        count: 0,
    }),
});

export const useExamplePersistedStore = defineStore("example2", {
    state: () => ({
        count: 0,
    }),
    persist: true,
});

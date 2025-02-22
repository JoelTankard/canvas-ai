import { defineStore } from "pinia";

export interface Thread {
    id: string;
    assistantId: string;
}

export const useThread = defineStore("thread", {
    state: () => ({
        threads: [] as Thread[],
    }),
    actions: {
        addThread(thread: Thread) {
            if (!this.threads.find((t) => t.id === thread.id)) {
                this.threads.push(thread);
            }
        },
        getThreadByAssistantId(assistantId: string) {
            return this.threads.find((thread) => thread.assistantId === assistantId);
        },
    },
});

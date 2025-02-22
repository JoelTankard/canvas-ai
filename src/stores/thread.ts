import { defineStore } from "pinia";
import { create_thread } from "src-rust"; // Import the function to create threads
import { useUserPersistedStore } from "@store/user";

export interface Thread {
    id: string;
    name: string;
    sessionId: string;
}

// Define a configuration for threads
const threadConfig = [
    {
        name: "parser-thread", // Placeholder ID, replace with actual logic to generate or retrieve thread IDs
    },
    // Add more threads as needed
];

export const useThread = defineStore("thread", {
    state: () => ({
        threads: [] as Thread[],
    }),
    actions: {
        async initializeThreads(sessionId: string) {
            const userStore = useUserPersistedStore();
            const apiKey = userStore.openaiApiKey;
            console.log("Initializing threads with API key:", apiKey);
            try {
                // Create user thread
                for (const thread of threadConfig) {
                    const existingThread = this.getThreadByNameAndSessionId(thread.name, sessionId);
                    if (!existingThread) {
                        const threadId = await create_thread(apiKey);
                        this.addThread({ id: threadId, ...thread, sessionId });
                    }
                }

                console.log("Threads initialized successfully");
            } catch (error) {
                console.error("Failed to initialize threads:", error);
            }
        },

        addThread(thread: Thread) {
            this.threads.push(thread);
        },

        getThreadByNameAndSessionId(name: string, sessionId: string) {
            return this.threads.find((thread) => thread.name === name && thread.sessionId === sessionId);
        },

        clearThreads(sessionId: string) {
            this.threads = this.threads.filter((thread) => thread.sessionId !== sessionId);
        },
    },
    persist: true,
});

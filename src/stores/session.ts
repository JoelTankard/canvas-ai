import { computed } from "vue";
import { defineStore } from "pinia";
import { useThread } from "@store/thread";
import { useRoute } from "vue-router";
import { useMessagesStore } from "@store/messages";
export interface SessionState {
    id: string;
    isAgentTyping: boolean;
    isInputLocked: boolean;
    currentRunId: string | null;
}

export const useSessionStore = defineStore("session", {
    state: () => ({
        sessions: {} as Record<string, SessionState>,
    }),
    getters: {},
    actions: {
        getSessionById(id: string) {
            return this.sessions[id];
        },
        async createSession() {
            const sessionId = crypto.randomUUID();
            const threadStore = useThread();

            threadStore.initializeThreads(sessionId);

            this.sessions[sessionId] = {
                id: sessionId,
                isAgentTyping: false,
                isInputLocked: false,
                currentRunId: null,
            };

            return sessionId;
        },

        setAgentTyping(sessionId: string, typing: boolean) {
            if (this.sessions[sessionId]) {
                this.sessions[sessionId].isAgentTyping = typing;
                this.sessions[sessionId].isInputLocked = typing;
            }
        },

        setCurrentRunId(sessionId: string, runId: string | null) {
            if (this.sessions[sessionId]) {
                this.sessions[sessionId].currentRunId = runId;
            }
        },

        addMessage(sessionId: string, message: string) {
            const messageStore = useMessagesStore();
            messageStore.addMessage(sessionId, message, "user");
        },

        async initializeSession() {
            const route = useRoute();
            if (!this.sessions[route.params.id as string]) {
                await this.createSession();
            }
            return this.sessions[route.params.id as string];
        },
    },
    persist: true,
});

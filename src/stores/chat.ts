import { defineStore } from "pinia";

export interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: number;
}

export interface AgentStep {
    id: string;
    tool: string;
    status: "running" | "completed" | "error";
    timestamp: number;
}

export const useChatStore = defineStore("chat", {
    state: () => ({
        messages: [] as Message[],
        steps: [] as AgentStep[],
        isAgentTyping: false,
        isInputLocked: false,
    }),

    actions: {
        addMessage(content: string, role: "user" | "assistant") {
            const message: Message = {
                id: crypto.randomUUID(),
                content,
                role,
                timestamp: Date.now(),
            };
            this.messages.push(message);
        },

        addStep(tool: string) {
            const step: AgentStep = {
                id: crypto.randomUUID(),
                tool,
                status: "running",
                timestamp: Date.now(),
            };
            this.steps.push(step);
            return step.id;
        },

        updateStepStatus(stepId: string, status: "completed" | "error") {
            const step = this.steps.find((s) => s.id === stepId);
            if (step) {
                step.status = status;
            }
        },

        setAgentTyping(typing: boolean) {
            this.isAgentTyping = typing;
            this.isInputLocked = typing;
        },

        clearChat() {
            this.messages = [];
            this.steps = [];
            this.isAgentTyping = false;
            this.isInputLocked = false;
        },
    },
});

import { defineStore, storeToRefs } from "pinia";
import { useUserPersistedStore } from "@store/user";
import { create_message, run_assistant, list_messages } from "src-rust";
import { useAssistantStore } from "@store/assistant";
import { useSessionStore } from "@store/session";
import { useThread } from "@store/thread";
import { useFilesStore } from "@store/files";
import { useRoute } from "vue-router";
export type MessageRole = "user" | "assistant";
export type StepStatus = "running" | "completed" | "error";

export interface Step {
    id: string;
    tool: string;
    status: StepStatus;
    timestamp: number;
}

export interface Message {
    id: string;
    sessionId: string;
    content: string;
    role: MessageRole;
    timestamp: number;
    fileIds: string[];
    threadId: string;
    step?: Step;
}

interface AssistantMessage {
    role: string;
    content: Array<{ text: { value: string } }>;
    file_ids: string[];
    run_id: string;
}

export const useMessagesStore = defineStore("messages", {
    state: () => ({
        messages: [] as Message[],
    }),

    getters: {
        getMessagesBySession: (state) => {
            return (sessionId: string) => state.messages.filter((m) => m.sessionId === sessionId);
        },
    },

    actions: {
        addMessage(sessionId: string, content: string, role: MessageRole, threadId: string, step?: Step) {
            const message: Message = {
                id: crypto.randomUUID(),
                sessionId,
                content,
                role,
                timestamp: Date.now(),
                fileIds: [],
                threadId,
                step,
            };
            this.messages.push(message);
        },
        // async addMessage(sessionId: string, content: string, role: MessageRole, step?: Step) {
        //     const sessionStore = useSessionStore();
        //     const threadStore = useThread();
        //     const filesStore = useFilesStore();
        //     let fileIds: string[] = [];
        //     const threadId = threadStore.threads.find((t) => t.name === "user-thread-id" && t.sessionId === sessionId)?.id;
        //     const isFirstMessage = this.messages.findIndex((m) => m.threadId === threadId) === -1;
        //     if (isFirstMessage) {
        //         fileIds = filesStore.getFilesBySessionId(sessionId).map((f) => f.id);
        //     }
        //     console.log(sessionId);
        //     const session = sessionStore.getSessionById(sessionId);
        //     console.log(session);

        //     if (!session) {
        //         throw new Error("Invalid session");
        //     }

        //     if (!threadId) {
        //         throw new Error("Thread ID not found");
        //     }

        //     const message: Message = {
        //         id: crypto.randomUUID(),
        //         sessionId,
        //         content,
        //         role,
        //         timestamp: Date.now(),
        //         fileIds: fileIds || [],
        //         threadId: threadId || "",
        //         step,
        //     };
        //     this.messages.push(message);

        //     if (role === "user") {
        //         await this.sendMessageToAssistant(content, sessionId, threadId, fileIds);
        //     }
        // },

        // async sendMessageToAssistant(content: string, sessionId: string, threadId: string, fileIds: string[]) {
        //     const userStore = await useUserPersistedStore();
        //     const sessionStore = useSessionStore();
        //     const assistantStore = useAssistantStore();
        //     const session = sessionStore.sessions[sessionId];

        //     if (!userStore.openaiApiKey) throw new Error("API key not found");
        //     if (!session) throw new Error("Invalid session");

        //     try {
        //         sessionStore.setAgentTyping(sessionId, true);

        //         // Get the default assistant
        //         const assistant = assistantStore.getAssistantByName("Parser");
        //         if (!assistant) throw new Error("No assistant available");

        //         // Create message in thread
        //         await create_message(userStore.openaiApiKey, threadId!, content, JSON.stringify(fileIds));

        //         // Run the assistant
        //         const runResponse = await run_assistant(userStore.openaiApiKey, threadId!, assistant.id, null);
        //         const run = JSON.parse(runResponse);
        //         sessionStore.setCurrentRunId(sessionId, run.id);

        //         // // Poll for completion
        //         // await this.pollRunCompletion(sessionId, threadId!);

        //         // Get messages after completion
        //         const messagesResponse = await list_messages(userStore.openaiApiKey, threadId!);
        //         const messages = JSON.parse(messagesResponse);

        //         // Add the assistant's response
        //         const assistantMessage = messages.data.find((m: AssistantMessage) => m.role === "assistant" && m.run_id === session.currentRunId);

        //         if (assistantMessage?.content[0]?.text?.value) {
        //             await this.addMessage(sessionId, assistantMessage.content[0].text.value, "assistant", assistantMessage.file_ids);
        //         }
        //     } catch (error) {
        //         console.error("Failed to send message to assistant:", error);
        //         const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        //         await this.addMessage(sessionId, `Error: ${errorMessage}. Please try again.`, "assistant");
        //     } finally {
        //         sessionStore.setAgentTyping(sessionId, false);
        //         sessionStore.setCurrentRunId(sessionId, null);
        //     }
        // },

        // async pollRunCompletion(sessionId: string, threadId: string) {
        //     const userStore = useUserPersistedStore();
        //     const sessionStore = useSessionStore();
        //     const session = sessionStore.sessions[sessionId];

        //     if (!session?.currentRunId || !threadId) return;

        //     while (true) {
        //         const runResponse = await get_run(userStore.openaiApiKey!, threadId, session.currentRunId);
        //         const run = JSON.parse(runResponse);

        //         if (run.status === "completed") {
        //             break;
        //         } else if (run.status === "failed" || run.status === "cancelled") {
        //             throw new Error(`Run ${run.status}`);
        //         }

        //         await new Promise((resolve) => setTimeout(resolve, 1000));
        //     }
        // },

        addStep(sessionId: string, tool: string): Step {
            const step: Step = {
                id: crypto.randomUUID(),
                tool,
                status: "running",
                timestamp: Date.now(),
            };
            return step;
        },

        updateStepStatus(message: Message, status: StepStatus) {
            if (message.step) {
                message.step.status = status;
            }
        },

        clearMessages(sessionId: string) {
            this.messages = this.messages.filter((m) => m.sessionId !== sessionId);
        },

        getMessagesBySessionId(sessionId: string, threadName = "user-thread-id") {
            return this.messages.filter((m) => m.sessionId === sessionId && m.threadId === threadName);
        },

        getDisplayMessages(sessionId: string) {
            return this.messages.filter((m) => m.sessionId === sessionId && m.threadId === "display");
        },
    },
    persist: true,
});

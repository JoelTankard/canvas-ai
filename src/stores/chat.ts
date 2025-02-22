import { defineStore, storeToRefs } from "pinia";
import { useUserPersistedStore } from "@store/user";
import { create_message, run_assistant, get_run, list_messages, upload_file } from "src-rust";
import { useAssistantStore } from "./assistant.ts";

export interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: number;
    fileIds?: string[];
}

export interface AgentStep {
    id: string;
    tool: string;
    status: "running" | "completed" | "error";
    timestamp: number;
}

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
}

interface AssistantMessage {
    role: string;
    content: Array<{ text: { value: string } }>;
    file_ids: string[];
    run_id: string;
}

export const useChatStore = defineStore("chat", {
    state: () => ({
        messages: [] as Message[],
        steps: [] as AgentStep[],
        isAgentTyping: false,
        isInputLocked: false,
        threadId: null as string | null,
        assistantId: null as string | null,
        uploadedFiles: [] as UploadedFile[],
        currentRunId: null as string | null,
    }),

    actions: {
        async initializeAssistant() {
            const userStore = useUserPersistedStore();
            console.log("Initializing assistant with API key:", userStore);
            if (!userStore.openaiApiKey) throw new Error("API key not found");

            try {
                const assistantStore = useAssistantStore();
                // Initialize assistants using the new action
                await assistantStore.initializeAssistants();
            } catch (error) {
                console.error("Failed to initialize assistant:", error);
                throw error;
            }
        },

        async uploadFile(file: File) {
            const userStore = useUserPersistedStore();
            console.log("Uploading file with API key:", userStore.openaiApiKey);
            if (!userStore.openaiApiKey) throw new Error("API key not found");

            try {
                const arrayBuffer = await file.arrayBuffer();
                const response = await upload_file(userStore.openaiApiKey, new Uint8Array(arrayBuffer), file.name);
                const uploadedFile = JSON.parse(response);

                this.uploadedFiles.push({
                    id: uploadedFile.id,
                    name: file.name,
                    size: file.size,
                });

                return uploadedFile.id;
            } catch (error) {
                console.error("Failed to upload file:", error);
                throw error;
            }
        },

        async addMessage(content: string, role: "user" | "assistant", fileIds: string[] = []) {
            const message: Message = {
                id: crypto.randomUUID(),
                content,
                role,
                timestamp: Date.now(),
                fileIds,
            };
            this.messages.push(message);

            if (role === "user") {
                await this.sendMessageToAssistant(content, fileIds);
            }
        },

        async sendMessageToAssistant(content: string, fileIds: string[] = []) {
            const userStore = await useUserPersistedStore();
            const { openaiApiKey } = storeToRefs(userStore);
            console.log("Sending message with API key dd:", userStore);
            if (!openaiApiKey.value) throw new Error("API key not found");

            try {
                // Initialize assistant and thread if needed
                if (!this.threadId || !this.assistantId) {
                    await this.initializeAssistant();
                }

                this.isAgentTyping = true;
                this.isInputLocked = true;

                // Create message in thread
                await create_message(userStore.openaiApiKey, this.threadId!, content, JSON.stringify(fileIds));

                // Run the assistant
                const runResponse = await run_assistant(userStore.openaiApiKey, this.threadId!, this.assistantId!, null);
                const run = JSON.parse(runResponse);
                this.currentRunId = run.id;

                // Poll for completion
                await this.pollRunCompletion();

                // Get messages after completion
                const messagesResponse = await list_messages(userStore.openaiApiKey, this.threadId!);
                const messages = JSON.parse(messagesResponse);

                // Add the assistant's response
                const assistantMessage = messages.data.find((m: AssistantMessage) => m.role === "assistant" && m.run_id === this.currentRunId);

                if (assistantMessage?.content[0]?.text?.value) {
                    await this.addMessage(assistantMessage.content[0].text.value, "assistant", assistantMessage.file_ids);
                }
            } catch (error) {
                console.error("Failed to send message to assistant:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                await this.addMessage(`Error: ${errorMessage}. Please try again.`, "assistant");
            } finally {
                this.isAgentTyping = false;
                this.isInputLocked = false;
                this.currentRunId = null;
            }
        },

        async pollRunCompletion() {
            const userStore = useUserPersistedStore();
            if (!this.currentRunId || !this.threadId) return;

            while (true) {
                const runResponse = await get_run(userStore.openaiApiKey!, this.threadId, this.currentRunId);
                const run = JSON.parse(runResponse);

                if (run.status === "completed") {
                    break;
                } else if (run.status === "failed" || run.status === "cancelled") {
                    throw new Error(`Run ${run.status}`);
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
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
            this.threadId = null;
            this.currentRunId = null;
            // Don't clear assistantId as we can reuse it
        },
    },
});

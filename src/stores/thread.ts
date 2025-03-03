import { defineStore } from "pinia";
import { create_thread, check_run, get_message, process_image, process_file } from "src-rust";
import { useUserPersistedStore } from "@store/user";
import { ref } from "vue";
import { useAssistantStore } from "@store/assistant";
import { useFilesStore } from "@store/files";
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

// Define a type for the queue items
interface FileQueueItem {
    fileId: string;
    sessionId: string;
}

interface ImageQueueItem {
    imageId: string;
    imageUrl: string;
    sessionId: string;
}

// Queue to manage files
const fileQueue = ref<FileQueueItem[]>([]);

// Queue to manage images
const imageQueue = ref<ImageQueueItem[]>([]);

// Function to process the next file in the queue
async function processNextFile() {
    if (fileQueue.value.length === 0) return;
    const filesStore = useFilesStore();

    const { fileId, sessionId } = fileQueue.value.shift()!;
    const thread = useThread().getThreadByNameAndSessionId("parser-thread", sessionId);
    if (!thread) {
        console.error("Parser thread not found");
        return;
    }

    try {
        const userStore = useUserPersistedStore();
        const assistantStore = useAssistantStore();
        const apiKey = userStore.openaiApiKey;
        const assistantId = assistantStore.getAssistantByName("Parser")?.id || "";

        if (!assistantId) {
            console.error("Assistant ID not found");
            return;
        }

        let pollInterval: NodeJS.Timeout | null = null;

        // Run the assistant and get the run ID
        const runId = await process_file(apiKey, fileId, assistantId, thread.id);

        // Poll the run status
        if (pollInterval) {
            clearInterval(pollInterval);
        }
        pollInterval = setInterval(async () => {
            try {
                const runStatus = await check_run(apiKey, thread.id, runId);
                if (runStatus === "completed") {
                    if (pollInterval) {
                        clearInterval(pollInterval);
                    }

                    // Retrieve messages
                    const messages = await get_message(apiKey, thread.id);
                    const parsedMessages = JSON.parse(messages);
                    const content = parsedMessages?.data[0]?.content[0]?.text?.value;

                    if (content) {
                        filesStore.updateFileContent(fileId, content);
                        console.log("File processed successfully:", fileId);
                        processNextFile();
                    }
                }
            } catch (error) {
                console.error("Failed to poll run status:", error);
            }
        }, 5000); // Poll every 5 seconds
    } catch (error) {
        console.error("Failed to process file:", error);
        processNextFile();
    }
}

// Function to add a file to the queue
export function addFileToQueue(fileId: string, sessionId: string) {
    fileQueue.value.push({ fileId, sessionId });
    if (fileQueue.value.length === 1) {
        processNextFile();
    }
}

// Function to process the next image in the queue
async function processNextImage() {
    if (imageQueue.value.length === 0) return;
    const filesStore = useFilesStore();

    const { imageId, imageUrl, sessionId } = imageQueue.value.shift()!;
    const thread = useThread().getThreadByNameAndSessionId("parser-thread", sessionId);
    if (!thread) {
        console.error("Parser thread not found");
        return;
    }

    try {
        const userStore = useUserPersistedStore();
        const apiKey = userStore.openaiApiKey;

        // Use process_image to send the image for processing
        const response = await process_image(apiKey, imageUrl);

        const parsedResponse = JSON.parse(response);

        console.log(parsedResponse);

        const content = parsedResponse?.choices[0]?.message?.content;

        filesStore.updateFileContent(imageId, content);

        console.log("Image processed successfully:", imageId);
    } catch (error) {
        console.error("Failed to process image:", error);
    } finally {
        // Process the next image in the queue
        processNextImage();
    }
}

// Function to add an image to the queue
export function addImageToQueue(imageId: string, imageUrl: string, sessionId: string) {
    imageQueue.value.push({ imageId, imageUrl, sessionId });
    if (imageQueue.value.length === 1) {
        processNextImage();
    }
}

// Mock function to send a message to OpenAI
async function sendMessageToOpenAI(threadId: string, message: string): Promise<string> {
    // Implement the logic to send a message to OpenAI and return the response
    return "Mock response from OpenAI";
}

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

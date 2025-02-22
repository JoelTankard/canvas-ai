import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useUserPersistedStore } from "@store/user";
import { useSessionStore } from "@store/session";
import { upload_file } from "src-rust";
import { useRoute } from "vue-router";
import { addFileToQueue, addImageToQueue } from "./thread";

export interface UploadedFile {
    id: string;
    sessionId: string;
    name: string;
    type: string;
    size: number;
    file: File;
    content: string;
    createdAt: Date;
    error: string | null;
}

export const useFilesStore = defineStore(
    "files",
    () => {
        const files = ref<UploadedFile[]>([]);

        async function uploadFile(file: File, sessionId: string): Promise<string> {
            const userStore = await useUserPersistedStore();
            const openaiApiKey = userStore.openaiApiKey;

            if (!openaiApiKey) {
                throw new Error("OpenAI API key is not set");
            }
            if (!sessionId) {
                throw new Error("Session ID is not set");
            }

            try {
                const buffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(buffer);

                const uploadResponse = await upload_file(openaiApiKey, uint8Array, file.name);
                const uploadResult = JSON.parse(uploadResponse);

                const uploadedFile: UploadedFile = {
                    id: uploadResult.id,
                    sessionId: sessionId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    file: file,
                    content: "",
                    createdAt: new Date(),
                    error: null,
                };

                files.value.push(uploadedFile);

                // Add the file to the appropriate queue
                if (file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64String = reader.result as string;
                        addImageToQueue(uploadedFile.id, base64String, sessionId);
                    };
                    reader.readAsDataURL(file);
                } else {
                    addFileToQueue(uploadedFile.id, sessionId);
                }

                return uploadResult.id;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error("Failed to upload file:", error);
                throw new Error(errorMessage);
            }
        }

        function clearFiles(sessionId: string) {
            files.value = files.value.filter((f) => f.sessionId !== sessionId);
        }

        function getFileById(id: string) {
            return files.value.find((file) => file.id === id);
        }

        function getFilesBySessionId(sessionId: string) {
            return files.value.filter((file) => file.sessionId === sessionId);
        }

        function updateFileContent(id: string, content: string) {
            const file = getFileById(id);
            if (file) {
                file.content = content;
            }
        }

        return {
            files,
            uploadFile,
            clearFiles,
            getFileById,
            updateFileContent,
            getFilesBySessionId,
        };
    },
    {
        persist: true,
    }
);

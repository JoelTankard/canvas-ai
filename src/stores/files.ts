import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useUserPersistedStore } from "@store/user";
import { useSessionStore } from "@store/session";
import { upload_file } from "src-rust";
import { useRoute } from "vue-router";
export interface UploadedFile {
    id: string;
    sessionId: string;
    name: string;
    type: string;
    size: number;
    file: File;
    createdAt: Date;
    error: string | null;
}

export const useFilesStore = defineStore(
    "files",
    () => {
        const files = ref<UploadedFile[]>([]);

        async function uploadFile(file: File): Promise<string> {
            const userStore = await useUserPersistedStore();
            const openaiApiKey = userStore.openaiApiKey;
            const route = useRoute();
            const sessionId = route.params.id as string;

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

                files.value.push({
                    id: uploadResult.id,
                    sessionId: sessionId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    file: file,
                    createdAt: new Date(),
                    error: null,
                });

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

        return {
            files,
            uploadFile,
            clearFiles,
            getFileById,
            getFilesBySessionId,
        };
    },
    {
        persist: true,
    }
);

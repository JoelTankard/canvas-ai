import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useUserPersistedStore } from "@store/user";
import { useSessionStore } from "@store/session";
import { upload_file, delete_file } from "src-rust";
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
    preview?: string;
    createdAt: Date;
    error: string | null;
    position?: { x: number; y: number };
}

export const useFilesStore = defineStore(
    "files",
    () => {
        const files = ref<UploadedFile[]>([]);

        async function uploadFile(file: File, sessionId: string, position?: { x: number; y: number }): Promise<string> {
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

                // Create a preview for the file
                let preview: string | undefined;
                if (file.type.startsWith("image/")) {
                    preview = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                }

                const uploadedFile: UploadedFile = {
                    id: uploadResult.id,
                    sessionId: sessionId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    file: file,
                    content: "",
                    preview,
                    createdAt: new Date(),
                    error: null,
                    position,
                };

                files.value.push(uploadedFile);

                // Add the file to the appropriate queue
                if (file.type.startsWith("image/")) {
                    addImageToQueue(uploadedFile.id, preview!, sessionId);
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

        function updateFilePosition(id: string, x: number, y: number) {
            console.log("Updating position for file", id, "to", x, y);
            const file = getFileById(id);
            if (file) {
                file.position = { x, y };
            }
        }

        function allFilesProcessed(sessionId: string) {
            return files.value.filter((file) => file.sessionId === sessionId).every((file) => file.content !== "");
        }

        async function deleteFile(fileId: string): Promise<void> {
            const userStore = await useUserPersistedStore();
            const openaiApiKey = userStore.openaiApiKey;

            if (!openaiApiKey) {
                throw new Error("OpenAI API key is not set");
            }

            try {
                await delete_file(openaiApiKey, fileId);
                // Remove from local store
                files.value = files.value.filter((f) => f.id !== fileId);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error("Failed to delete file:", error);
                throw new Error(errorMessage);
            }
        }

        return {
            files,
            uploadFile,
            deleteFile,
            clearFiles,
            getFileById,
            updateFileContent,
            updateFilePosition,
            allFilesProcessed,
            getFilesBySessionId,
        };
    },
    {
        persist: {
            key: "files-store",
            storage: localStorage,
            serializer: {
                deserialize: (value) => {
                    const parsed = JSON.parse(value);
                    if (parsed.files) {
                        parsed.files = parsed.files.map((file: any) => ({
                            ...file,
                            createdAt: new Date(file.createdAt),
                            // Keep preview and position data
                            preview: file.preview,
                            position: file.position,
                            // File object can't be restored, but we can create a minimal version
                            file: file.type.startsWith("image/") && file.preview ? new File([new Blob([])], file.name, { type: file.type }) : new File([new Blob([])], file.name),
                        }));
                    }
                    return parsed;
                },
                serialize: (value) => {
                    const toStore = {
                        ...value,
                        files: value.files.map((file: UploadedFile) => ({
                            id: file.id,
                            sessionId: file.sessionId,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            content: file.content,
                            preview: file.preview,
                            createdAt: file.createdAt.toISOString(),
                            error: file.error,
                            position: file.position,
                        })),
                    };
                    return JSON.stringify(toStore);
                },
            },
        },
    }
);

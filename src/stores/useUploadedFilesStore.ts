import { defineStore } from "pinia";
import { ref } from "vue";
import { useUserPersistedStore } from "@store/user";
import { upload_file, analyze_image, analyze_file } from "src-rust";

export interface UploadedDocument {
    id: number;
    openaiFileId: string;
    name: string;
    type: string;
    size: number;
    content: string;
    file: File;
    url?: string; // For images
    createdAt: Date;
    isAnalysing: boolean;
    error: string | null | unknown;
}

const analyseFiles = async (documents: UploadedDocument[]) => {
    const userStore = await useUserPersistedStore();
    const openaiApiKey = userStore.openaiApiKey;

    if (!openaiApiKey) {
        throw new Error("OpenAI API key is not set");
    }

    const progress = Promise.all(
        documents.map(
            async (document) =>
                new Promise(async (resolve, reject) => {
                    try {
                        document.isAnalysing = true;

                        if (document.type.startsWith("image/")) {
                            // For images, create a temporary URL
                            const reader = new FileReader();
                            const base64Promise = new Promise<string>((resolve) => {
                                reader.onload = () => resolve(reader.result as string);
                                reader.readAsDataURL(document.file);
                            });
                            document.url = await base64Promise;

                            const analysisResponse = await analyze_image(openaiApiKey, document.url, true);
                            const analysisResult = JSON.parse(analysisResponse);
                            document.content = analysisResult.content;
                        } else {
                            // For other files, upload and analyze
                            const buffer = await document.file.arrayBuffer();
                            const uint8Array = new Uint8Array(buffer);

                            // Create multipart form-data boundary
                            const boundary = "----WebKitFormBoundary" + Math.random().toString(36).slice(2);
                            const formDataHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${document.name}"\r\nContent-Type: ${document.type}\r\n\r\n`;
                            const formDataFooter = `\r\n--${boundary}--\r\n`;

                            // Combine the header, file data, and footer
                            const headerArray = new TextEncoder().encode(formDataHeader);
                            const footerArray = new TextEncoder().encode(formDataFooter);

                            const combinedArray = new Uint8Array(headerArray.length + uint8Array.length + footerArray.length);
                            combinedArray.set(headerArray, 0);
                            combinedArray.set(uint8Array, headerArray.length);
                            combinedArray.set(footerArray, headerArray.length + uint8Array.length);

                            const uploadResponse = await upload_file(openaiApiKey, combinedArray, document.name);
                            const uploadResult = JSON.parse(uploadResponse);
                            document.openaiFileId = uploadResult.id;

                            const analysisResponse = await analyze_file(openaiApiKey, uploadResult.id);
                            const analysisResult = JSON.parse(analysisResponse);
                            document.content = analysisResult.content;
                        }

                        document.isAnalysing = false;
                        resolve(document);
                    } catch (error) {
                        document.isAnalysing = false;
                        document.error = error instanceof Error ? error.message : error;
                        reject(error);
                    }
                })
        )
    );

    return progress;
};

export const useUploadedFilesStore = defineStore("uploadedFiles", () => {
    const files = ref<UploadedDocument[]>([]);
    const notes = ref<{ id: number; content: string; x: number; y: number }[]>([]);

    function addFiles(newFiles: File[]) {
        files.value = newFiles.map((file) => ({
            id: files.value.length + 1,
            openaiFileId: "",
            name: file.name,
            type: file.type,
            size: file.size,
            content: "",
            file: file,
            createdAt: new Date(),
            isAnalysing: false,
            error: null,
        }));

        analyseFiles(files.value);
    }

    function clearFiles() {
        files.value = [];
    }

    function getFilesForApi() {
        return files.value;
    }

    function addNote(id: number, content: string, x: number, y: number) {
        console.log("Adding note:", id, content, x, y);
        notes.value.push({ id, content: content ?? "", x, y });
    }

    function updateNote(id: number, content: string) {
        const note = notes.value.find((note) => note.id === id);
        if (note) {
            note.content = content;
        }
    }

    function removeNote(id: number) {
        notes.value = notes.value.filter((note) => note.id !== id);
    }

    return { files, addFiles, clearFiles, getFilesForApi, notes, addNote, updateNote, removeNote };
});

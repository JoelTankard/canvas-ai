import { defineStore } from "pinia";
import { ref } from "vue";
import { useUserPersistedStore } from "./user";

export interface UploadedDocument {
    id: number;
    name: string;
    type: string;
    size: number;
    file: File;
    url?: string;
    createdAt: Date;
}

export const useUploadedFilesStore = defineStore("uploadedFiles", () => {
    const files = ref<UploadedDocument[]>([]);
    const notes = ref<{ id: number; content: string; x: number; y: number }[]>([]);

    function addFiles(newFiles: File[]) {
        const newUploadedFiles = newFiles.map((file) => ({
            id: files.value.length ? Math.max(...files.value.map((f) => f.id)) + 1 : 1,
            name: file.name,
            type: file.type,
            size: file.size,
            file: file,
            url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
            createdAt: new Date(),
        }));

        files.value = [...files.value, ...newUploadedFiles];
    }

    function clearFiles() {
        files.value.forEach((file) => {
            if (file.url) URL.revokeObjectURL(file.url);
        });
        files.value = [];
    }

    function getFilesForApi() {
        return files.value;
    }

    function addNote(id: number, content: string, x: number, y: number) {
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

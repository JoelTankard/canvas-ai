import { defineStore } from "pinia";
import { ref } from "vue";

export const useUploadedFilesStore = defineStore("uploadedFiles", () => {
    const files = ref<File[]>([]);
    const notes = ref<{ id: number; content: string; x: number; y: number }[]>([]);

    function addFiles(newFiles: File[]) {
        files.value = [...files.value, ...newFiles];
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

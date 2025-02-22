<template>
    <div ref="noteAdderRef" class="note-adder" @mouseup="createNote">
        <!-- Notes will be dynamically added here -->
        <StickyNote v-for="note in notes" :key="note.id" :id="note.id" />
    </div>
</template>

<script setup>
    import { ref, provide, onMounted, computed } from "vue";
    import { useUploadedFilesStore } from "@/stores/useUploadedFilesStore";
    import StickyNote from "./StickyNote.vue";
    import { useMouse } from "@vueuse/core";

    const store = useUploadedFilesStore();
    const notes = computed(() => store.notes);

    const { x, y } = useMouse();

    function createNote() {
        console.log("Creating note at:", x.value, y.value);
        const id = Date.now(); // Simple unique ID based on timestamp
        const newNote = { id, x: x.value, y: y.value, content: "" };
        store.addNote(id, "", x.value, y.value);
    }
</script>

<style scoped>
    .note-adder {
        @apply h-full w-full;
        /* Additional styling */
    }
</style>

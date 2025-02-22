<template>
    <div class="absolute top-0 left-0">
        <div ref="dropZoneRef" class="w-72 h-48 border-2 border-dashed transition-colors duration-300" :class="[isOverDropZone ? 'border-blue-500 bg-blue-50' : 'border-gray-300']" @dragover.prevent @drop.prevent>
            <div class="flex items-center justify-center text-gray-500 h-full">Drop files here</div>
        </div>
        <ul class="mt-4">
            <li v-for="file in uploadedFiles" :key="file.name" class="text-gray-700">
                {{ file.name }}
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from "vue";
    import { useDropZone } from "@vueuse/core";
    import { useFilesStore } from "../stores/files";

    const dropZoneRef = ref<HTMLDivElement>();
    const filesStore = useFilesStore();

    function onDrop(droppedFiles: File[] | null) {
        if (droppedFiles) {
            filesStore.addFiles(droppedFiles);
            console.log("Files dropped:", droppedFiles);
            // Handle the files here, e.g., upload them to a server
        }
    }

    const uploadedFiles = computed(() => filesStore.files);

    const { isOverDropZone } = useDropZone(dropZoneRef, {
        onDrop,
        dataTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"], // Specify allowed file types
        multiple: true, // Allow multiple files to be dropped
        preventDefaultForUnhandled: true, // Prevent default behavior for unhandled events
    });
</script>

<style scoped>
    /* No additional styles needed as Tailwind CSS is used */
</style>

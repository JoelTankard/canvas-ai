<template>
    <div class="absolute top-0 left-0">
        <div ref="dropZoneRef" class="w-72 h-48 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 transition-colors duration-300">Drop files here</div>
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
    import { useUploadedFilesStore } from "../stores/useUploadedFilesStore";

    const dropZoneRef = ref<HTMLDivElement>();
    const uploadedFilesStore = useUploadedFilesStore();

    function onDrop(droppedFiles: File[] | null) {
        if (droppedFiles) {
            uploadedFilesStore.addFiles(droppedFiles);
            console.log("Files dropped:", droppedFiles);
            // Handle the files here, e.g., upload them to a server
        }
    }

    const uploadedFiles = computed(() => uploadedFilesStore.files);

    const { isOverDropZone } = useDropZone(dropZoneRef, {
        onDrop,
        dataTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain"], // Specify allowed file types
        multiple: true, // Allow multiple files to be dropped
        preventDefaultForUnhandled: true, // Prevent default behavior for unhandled events
    });
</script>

<style scoped>
    /* No additional styles needed as Tailwind CSS is used */
</style>

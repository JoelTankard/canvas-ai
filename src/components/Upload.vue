<template>
    <div class="absolute top-0 left-0">
        <div ref="dropZoneRef" class="w-72 h-48 border-2 border-dashed transition-colors duration-300" :class="[isOverDropZone ? 'border-blue-500 bg-blue-50' : 'border-gray-300']" @dragover.prevent @drop.prevent>
            <div class="flex items-center justify-center text-gray-500 h-full">Drop files here</div>
        </div>
        <ul class="mt-4">
            <li v-for="file in sessionFiles" :key="file.name" class="text-gray-700">{{ file.name }} - {{ !file.content ? "processing..." : "ready" }}</li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from "vue";
    import { useDropZone } from "@vueuse/core";
    import { useRoute } from "vue-router";
    import { useFilesStore } from "../stores/files";
    import { useSessionStore } from "../stores/session";

    const dropZoneRef = ref<HTMLDivElement>();
    const filesStore = useFilesStore();
    const sessionStore = useSessionStore();
    const route = useRoute();

    const currentSession = computed(() => sessionStore.sessions[route.params.id as string]);
    // Initialize session if needed
    sessionStore.initializeSession();

    async function onDrop(droppedFiles: File[] | null) {
        if (droppedFiles && currentSession.value) {
            // Upload each file individually and collect their IDs
            Promise.all(droppedFiles.map((file) => filesStore.uploadFile(file, currentSession.value.id)))
                .then((fileIds) => {
                    console.log("Files uploaded with IDs:", fileIds);
                })
                .catch((error) => {
                    console.error("Failed to upload files:", error);
                });
        }
    }

    const sessionFiles = computed(() => (currentSession.value ? filesStore.getFilesBySessionId(currentSession.value.id) : []));

    const { isOverDropZone } = useDropZone(dropZoneRef, {
        onDrop,
        dataTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"],
        multiple: true,
        preventDefaultForUnhandled: true,
    });
</script>

<style scoped>
    /* No additional styles needed as Tailwind CSS is used */
</style>

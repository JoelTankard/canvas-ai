<template>
    <div class="fixed inset-0 pointer-events-auto" @dragenter.prevent @dragover.prevent>
        <div ref="dropZoneRef" class="w-full h-full transition-opacity duration-300 flex items-center justify-center" :class="[isOverDropZone ? 'opacity-100 bg-blue-500/20' : 'opacity-0']" @dragenter.prevent @dragover.prevent @drop.prevent="handleDrop" @dragleave.prevent>
            <div class="text-2xl font-semibold text-blue-700">Drop files here</div>
        </div>

        <!-- File status list -->
        <div class="absolute top-4 left-4 z-50">
            <ul class="space-y-2">
                <li v-for="file in sessionFiles" :key="file.name" class="flex items-center gap-2">
                    <span class="text-gray-700">{{ file.name }}</span>
                    <span
                        class="text-sm"
                        :class="{
                            'text-blue-500': !file.content && file.content !== 'error',
                            'text-green-500': file.content && file.content !== 'error',
                            'text-red-500': file.content === 'error',
                        }">
                        {{ !file.content ? "uploading..." : file.content === "error" ? "failed" : "ready" }}
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from "vue";
    import { useDropZone } from "@vueuse/core";
    import { useRoute } from "vue-router";
    import { useFilesStore } from "../stores/files";
    import { useSessionStore } from "../stores/session";
    import type { InstanceType } from "vue";
    import type CanvasObject from "./CanvasObject.vue";

    const props = defineProps<{
        canvasRef: InstanceType<typeof CanvasObject> | undefined;
    }>();

    const dropZoneRef = ref<HTMLDivElement>();
    const filesStore = useFilesStore();
    const sessionStore = useSessionStore();
    const route = useRoute();
    const pendingFiles = ref<{ name: string; status: string }[]>([]);

    const currentSession = computed(() => sessionStore.sessions[route.params.id as string]);
    sessionStore.initializeSession();

    const handleDrop = async (event: DragEvent) => {
        const droppedFiles = event.dataTransfer?.files;
        if (droppedFiles && currentSession.value) {
            const dropX = event.clientX;
            const dropY = event.clientY;

            // Immediately add files to pending list
            Array.from(droppedFiles).forEach((file) => {
                pendingFiles.value.push({
                    name: file.name,
                    status: "uploading",
                });
            });

            // Upload each file individually and update UI immediately
            Promise.all(
                Array.from(droppedFiles).map(async (file) => {
                    try {
                        const fileId = await filesStore.uploadFile(file, currentSession.value.id);
                        // Remove from pending once uploaded
                        pendingFiles.value = pendingFiles.value.filter((f) => f.name !== file.name);
                        // Update file position in canvas
                        props.canvasRef?.updateFilePosition(fileId, dropX, dropY);
                        return fileId;
                    } catch (error) {
                        console.error(`Failed to upload file ${file.name}:`, error);
                        // Update status to error
                        const pendingFile = pendingFiles.value.find((f) => f.name === file.name);
                        if (pendingFile) pendingFile.status = "error";
                        return null;
                    }
                })
            ).then((fileIds) => {
                console.log("Files uploaded with IDs:", fileIds.filter(Boolean));
            });
        }
    };

    const sessionFiles = computed(() => {
        const storeFiles = currentSession.value ? filesStore.getFilesBySessionId(currentSession.value.id) : [];
        return [
            ...pendingFiles.value.map((f) => ({
                name: f.name,
                content: f.status === "error" ? "error" : null,
            })),
            ...storeFiles,
        ];
    });

    const { isOverDropZone } = useDropZone(dropZoneRef, {
        onDrop: () => {}, // We handle drop in handleDrop
        onEnter: (_files: File[] | null, event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();
        },
        onLeave: (_files: File[] | null, event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();
        },
        onOver: (_files: File[] | null, event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();
        },
        dataTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"],
        multiple: true,
    });
</script>

<style scoped>
    /* No additional styles needed as Tailwind CSS is used */
</style>

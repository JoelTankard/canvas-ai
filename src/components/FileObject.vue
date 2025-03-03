<template>
    <div
        class="file-object absolute pointer-events-auto cursor-move bg-zinc-200 overflow-hidden"
        :style="{
            left: `${position?.x || 0}px`,
            top: `${position?.y || 0}px`,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
        }"
        @mousedown="startDrag">
        <!-- Image preview for images -->
        <template v-if="isImage">
            <img v-if="objectUrl" :src="objectUrl" class="w-full h-full object-contain" @load="onImageLoad" />
            <div v-else class="w-full h-full bg-white border border-gray-200 rounded shadow p-4 overflow-scroll flex items-center justify-center">
                <div class="text-sm text-gray-600">{{ displayContent }}</div>
            </div>
        </template>

        <!-- PDF preview -->
        <template v-else-if="isPdf">
            <div class="w-full h-full bg-white border border-gray-200 rounded shadow p-4 overflow-scroll flex items-center justify-center">
                <div class="text-sm text-gray-600 whitespace-pre-wrap">{{ displayContent }}</div>
            </div>
        </template>

        <!-- Text preview -->
        <div v-else class="w-full h-full bg-white border border-gray-200 rounded shadow p-4 overflow-auto">
            <div class="text-sm text-gray-600 whitespace-pre-wrap">{{ displayContent }}</div>
        </div>

        <!-- Loading overlay -->
        <div v-if="!file.content" class="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div class="text-blue-500">Processing...</div>
        </div>

        <!-- File name, status and actions -->
        <div class="file-deets absolute top-0 left-0 right-0 flex items-center justify-between text-sm gap-2 bg-white p-2">
            <span class="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{{ file.name }}</span>
            <div class="flex items-center gap-2">
                <span
                    :class="{
                        'text-blue-500': !file.content,
                        'text-green-500': file.content && file.content !== 'error',
                        'text-red-500': file.content === 'error',
                    }">
                    {{ !file.content ? "Processing..." : file.content === "error" ? "Error" : "Ready" }}
                </span>
                <button @click.stop="handleDelete" class="p-1 hover:bg-red-100 rounded transition-colors" :class="{ 'opacity-50 cursor-not-allowed': isDeleting }" :disabled="isDeleting">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted } from "vue";
    import type { UploadedFile } from "../stores/files";
    import { useFilesStore } from "../stores/files";

    const props = defineProps<{
        file: UploadedFile;
        position?: { x: number; y: number };
    }>();

    const emit = defineEmits<{
        (e: "positionUpdate", x: number, y: number): void;
        (e: "delete"): void;
    }>();

    const filesStore = useFilesStore();
    const isDeleting = ref(false);

    // Dragging state
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });

    // File type checks
    const isImage = computed(() => props.file.type.startsWith("image/"));
    const isPdf = computed(() => props.file.type === "application/pdf");
    const isText = computed(() => props.file.type === "text/plain");

    // Dimensions state
    const dimensions = ref({ width: 300, height: 400 }); // Default dimensions
    const objectUrl = computed(() => {
        if (isImage.value && props.file.preview) {
            return props.file.preview;
        }
        if (props.file.file instanceof File) {
            return URL.createObjectURL(props.file.file);
        }
        return "";
    });

    // Clean up object URL only if it's not a preview URL
    onUnmounted(() => {
        if (objectUrl.value && !props.file.preview) {
            URL.revokeObjectURL(objectUrl.value);
        }
    });

    // Handle image load to set actual dimensions
    const onImageLoad = (event: Event) => {
        const img = event.target as HTMLImageElement;
        dimensions.value = {
            width: Math.min(img.naturalWidth, 800), // Cap width at 800px
            height: Math.min(img.naturalHeight, 600), // Cap height at 600px
        };
    };

    // Content display
    const displayContent = computed(() => {
        if (isImage.value) {
            return props.file.content || "Processing image...";
        }
        if (isPdf.value) {
            return props.file.content || "Processing PDF...";
        }
        if (isText.value || props.file.preview) {
            return props.file.content || "Processing...";
        }
        return "Processing...";
    });

    // Dragging handlers
    const startDrag = (event: MouseEvent) => {
        isDragging.value = true;
        dragOffset.value = {
            x: event.clientX - (props.position?.x || 0),
            y: event.clientY - (props.position?.y || 0),
        };

        // Add global mouse event listeners
        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", stopDrag);
    };

    const onDrag = (event: MouseEvent) => {
        if (!isDragging.value) return;

        const x = event.clientX - dragOffset.value.x;
        const y = event.clientY - dragOffset.value.y;

        emit("positionUpdate", x, y);
    };

    const stopDrag = () => {
        isDragging.value = false;
        // Remove global mouse event listeners
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", stopDrag);
    };

    const handleDelete = async () => {
        if (isDeleting.value) return;

        try {
            isDeleting.value = true;
            await filesStore.deleteFile(props.file.id);
            emit("delete");
        } catch (error) {
            console.error("Failed to delete file:", error);
        } finally {
            isDeleting.value = false;
        }
    };
</script>

<style scoped>
    .file-object {
        transition: transform 0.2s ease;

        .file-deets {
            @apply opacity-0;
        }

        &:hover {
            .file-deets {
                @apply opacity-100;
            }
        }
    }
</style>

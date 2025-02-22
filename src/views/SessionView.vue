<template>
    <div class="session-view">
        <AgentPointer />

        <ZoomView>
            <Agent />
            <NoteAdder />
            <!-- Create a canvas for each file -->
            <template v-for="file in sessionFiles" :key="file.id">
                <CanvasObject :ref="(el) => (canvasRefs[file.id] = el)" :position="filePositions[file.id]">
                    <FileObject :file="file" @positionUpdate="(x, y) => updateFilePosition(file.id, x, y)" />
                </CanvasObject>
            </template>
        </ZoomView>
        <ChatInput />
        <Upload :canvasRefs="canvasRefs" />
        <!-- <Chat /> -->
    </div>
</template>

<script setup lang="ts">
    import { onMounted, ref, computed } from "vue";
    import { useRoute } from "vue-router";
    import { useSessionStore } from "@store/session";
    import { useFilesStore } from "@store/files";
    import Upload from "@/components/Upload.vue";
    import NoteAdder from "@/components/NoteAdder.vue";
    import ChatInput from "@/components/ChatInput.vue";
    import Chat from "@/components/Chat.vue";
    import Agent from "@/components/Agent.vue";
    import ZoomView from "@/components/ZoomView.vue";
    import CanvasObject from "@/components/CanvasObject.vue";
    import FileObject from "@/components/FileObject.vue";
    import AgentPointer from "@/components/AgentPointer.vue";

    const route = useRoute();
    const sessionStore = useSessionStore();
    const filesStore = useFilesStore();

    // Track canvas refs and positions
    const canvasRefs = ref<Record<string, typeof CanvasObject>>({});
    const filePositions = ref<Record<string, { x: number; y: number }>>({});

    // Get files for current session
    const sessionFiles = computed(() => {
        const sessionId = route.params.id as string;
        return filesStore.getFilesBySessionId(sessionId);
    });

    // Update file position
    const updateFilePosition = (fileId: string, x: number, y: number) => {
        filePositions.value[fileId] = { x, y };
    };

    onMounted(async () => {
        const sessionId = route.params.id as string;
        if (sessionId && sessionId !== "new") {
            sessionStore.initializeSession();
        }
    });
</script>

<style scoped>
    .session-view {
        @apply relative h-full w-full;
    }
</style>

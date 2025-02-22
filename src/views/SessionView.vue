<template>
    <div class="session-view">
        <AgentPointer />

        <ZoomView>
            <!-- <NoteAdder /> -->
            <!-- Create a canvas for each file -->
            <template v-for="file in sessionFiles" :key="file.id">
                <CanvasObject :ref="(el: any) => (canvasRefs[file.id] = el)" :position="file.position">
                    <FileObject :file="file" @positionUpdate="(x: number, y: number) => updateFilePosition(file.id, x, y)" />
                </CanvasObject>
            </template>
            <Agent />
        </ZoomView>
        <LatestPlanInteraction />

        <ChatInput />
        <Upload />
        <!-- <Chat /> -->
    </div>
</template>

<script setup lang="ts">
    import { onMounted, ref, computed } from "vue";
    import type { RouteLocationNormalizedLoaded } from "vue-router";
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
    import LatestPlanInteraction from "@/components/LatestPlanInteraction.vue";
    const route = useRoute();
    const sessionStore = useSessionStore();
    const filesStore = useFilesStore();

    // Track canvas refs
    const canvasRefs = ref<Record<string, typeof CanvasObject>>({});

    // Get files for current session
    const sessionFiles = computed(() => {
        const sessionId = route.params.id as string;
        return filesStore.getFilesBySessionId(sessionId);
    });

    // Update file position
    const updateFilePosition = (fileId: string, x: number, y: number) => {
        filesStore.updateFilePosition(fileId, x, y);
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

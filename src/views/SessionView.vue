<template>
    <div class="session-view">
        <Upload />
        <NoteAdder />
        <ChatInput />
        <Chat />
    </div>
</template>

<script setup lang="ts">
    import { onMounted } from "vue";
    import { useRoute } from "vue-router";
    import { useSessionStore } from "@store/session";
    import Upload from "@/components/Upload.vue";
    import NoteAdder from "@/components/NoteAdder.vue";
    import ChatInput from "@/components/ChatInput.vue";
    import Chat from "@/components/Chat.vue";

    const route = useRoute();
    const sessionStore = useSessionStore();

    onMounted(async () => {
        const sessionId = route.params.id as string;
        if (sessionId && sessionId !== "new") {
            sessionStore.currentSessionId = sessionId;
        }
    });
</script>

<style scoped>
    .session-view {
        @apply relative h-full w-full;
    }
</style>

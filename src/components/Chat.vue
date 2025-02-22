<script setup lang="ts">
    import { ref, watch, computed, onMounted } from "vue";
    import { useMessagesStore } from "@store/messages";
    import { useSessionStore } from "@store/session";
    import { useRoute } from "vue-router";

    const messageStore = useMessagesStore();
    const sessionStore = useSessionStore();
    const route = useRoute();

    const currentSession = computed(() => sessionStore.sessions[route.params.id as string]);

    const messages = computed(() => messageStore.getDisplayMessages(currentSession.value!.id));
    const chatContainer = ref<HTMLDivElement>();
    const fileInput = ref<HTMLInputElement>();

    const scrollToBottom = () => {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    watch(
        () => messages.value,
        () => {
            scrollToBottom();
        },
        { deep: true }
    );

    onMounted(() => {
        scrollToBottom();
    });
</script>

<template>
    <div class="chat-container">
        <div ref="chatContainer" class="messages">
            <div v-for="message in messages" :key="message.id" :class="['message', message.role]">
                <div class="message-content">{{ message.content }}</div>
                <div v-if="message.fileIds?.length" class="file-attachments">
                    <div v-for="fileId in message.fileIds" :key="fileId" class="file-attachment">
                        {{ filesStore.getFileById(fileId)?.name || "Attached file" }}
                    </div>
                </div>
                <div class="message-time">{{ formatTimestamp(message.timestamp) }}</div>
            </div>

            <div v-if="currentSession?.isAgentTyping" class="typing-indicator">AI is typing...</div>
        </div>
    </div>
</template>

<style scoped>
    .chat-container {
        @apply fixed bottom-0 right-0 w-96 h-96 bg-white/50;
    }

    .messages {
        @apply h-[calc(100%-4rem)] overflow-y-auto p-4 flex flex-col gap-4;
    }

    .message {
        @apply max-w-[80%] p-3 rounded-lg relative;
    }

    .message.user {
        @apply self-end bg-blue-500 text-white rounded-br-sm;
    }

    .message.assistant {
        @apply self-start bg-gray-100 text-gray-900 rounded-bl-sm;
    }

    .message-time {
        @apply text-xs opacity-70 mt-1;
    }

    .file-attachments {
        @apply mt-2 flex flex-wrap gap-2;
    }

    .file-attachment {
        @apply text-xs py-1 px-2 rounded bg-opacity-20 bg-black;
    }

    .step {
        @apply self-center bg-gray-50 p-2 rounded text-sm;
    }

    .step-content {
        @apply flex items-center gap-2;
    }

    .step-tool {
        @apply font-medium;
    }

    .step-status {
        @apply px-2 py-1 rounded text-xs;
    }

    .step-status.running {
        @apply bg-yellow-100 text-yellow-800;
    }

    .step-status.completed {
        @apply bg-green-100 text-green-800;
    }

    .step-status.error {
        @apply bg-red-100 text-red-800;
    }

    .typing-indicator {
        @apply self-start text-gray-600 italic p-2;
    }

    .input-container {
        @apply h-16 flex items-center gap-2 p-4 border-t border-gray-200;
    }

    input[type="text"] {
        @apply flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500;
    }

    input[type="text"]:disabled {
        @apply bg-gray-100 cursor-not-allowed;
    }
</style>

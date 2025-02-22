<script setup lang="ts">
    import { ref, watch } from "vue";
    import { useChatStore } from "../stores/chat";
    import type { Message } from "../stores/chat";

    const chatStore = useChatStore();
    const messageInput = ref("");
    const chatContainer = ref<HTMLDivElement>();

    const scrollToBottom = () => {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    watch(chatStore.messages, () => {
        scrollToBottom();
    });
</script>

<template>
    <div class="chat-container">
        <div ref="chatContainer" class="messages">
            <div v-for="message in chatStore.messages" :key="message.id" :class="['message', message.role]">
                <div class="message-content">{{ message.content }}</div>
                <div class="message-time">{{ formatTimestamp(message.timestamp) }}</div>
            </div>

            <div v-for="step in chatStore.steps" :key="step.id" class="step">
                <div class="step-content">
                    <span class="step-tool">{{ step.tool }}</span>
                    <span :class="['step-status', step.status]">{{ step.status }}</span>
                </div>
                <div class="step-time">{{ formatTimestamp(step.timestamp) }}</div>
            </div>

            <div v-if="chatStore.isAgentTyping" class="typing-indicator">AI is typing...</div>
        </div>
    </div>
</template>

<style scoped>
    .chat-container {
        @apply fixed bottom-0 right-0;
    }

    .messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .message {
        max-width: 80%;
        padding: 0.75rem 1rem;
        border-radius: 1rem;
        position: relative;
    }

    .message.user {
        align-self: flex-end;
        background: #007aff;
        color: white;
        border-bottom-right-radius: 0.25rem;
    }

    .message.assistant {
        align-self: flex-start;
        background: #f0f0f0;
        color: #333;
        border-bottom-left-radius: 0.25rem;
    }

    .message-time {
        font-size: 0.75rem;
        opacity: 0.7;
        margin-top: 0.25rem;
    }

    .step {
        align-self: center;
        background: #f8f9fa;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
    }

    .step-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .step-tool {
        font-weight: 500;
    }

    .step-status {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
    }

    .step-status.running {
        background: #fff3cd;
        color: #856404;
    }

    .step-status.completed {
        background: #d4edda;
        color: #155724;
    }

    .step-status.error {
        background: #f8d7da;
        color: #721c24;
    }

    .typing-indicator {
        align-self: flex-start;
        color: #666;
        font-style: italic;
        padding: 0.5rem;
    }

    .input-container {
        display: flex;
        gap: 0.5rem;
        padding: 1rem;
        border-top: 1px solid #eee;
    }

    input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 0.5rem;
        font-size: 1rem;
    }

    input:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
    }

    button {
        padding: 0.75rem 1.5rem;
        background: #007aff;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    button:hover:not(:disabled) {
        opacity: 0.9;
    }
</style>

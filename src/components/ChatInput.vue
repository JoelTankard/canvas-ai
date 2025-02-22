<template>
    <div :class="['chat-input', { 'is-focused': isFocused }]" :style="styleChatInput">
        <input ref="inputRef" v-model="message" placeholder="Message" @focus="onFocus" @blur="onBlur" @keydown.enter="sendMessage" :disabled="currentSession?.isInputLocked" />
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick } from "vue";
    import { useMouse, useMagicKeys } from "@vueuse/core";
    import { useSessionStore } from "@/stores/session";
    import { useRoute } from "vue-router";
    const { slash } = useMagicKeys();
    const inputRef = ref<HTMLInputElement>();
    const { x, y } = useMouse();

    const sessionStore = useSessionStore();
    const route = useRoute();

    const currentSessionId = computed(() => route.params.id as string);
    const currentSession = sessionStore.getSessionById(currentSessionId.value);
    const message = ref("");

    const isFocused = ref(false);
    const styleChatInput = computed(() => ({
        transform: `translate(${x.value}px, ${y.value}px)`,
    }));

    function onFocus() {
        isFocused.value = true;
    }

    function onBlur() {
        isFocused.value = false;
    }

    function sendMessage() {
        if (!message.value.trim() || currentSession?.isInputLocked) return;

        sessionStore.addMessage(currentSessionId.value, message.value);
        message.value = "";

        inputRef.value?.blur();
    }

    watch(slash, (value) => {
        if (value) {
            isFocused.value = true;

            inputRef.value?.focus();

            setTimeout(() => {
                if (message.value.endsWith("/")) {
                    setTimeout(() => {
                        message.value = message.value.slice(0, -1).trim();
                    }, 1);
                }
            }, 1);
        }
    });
</script>

<style scoped>
    .chat-input {
        @apply absolute top-0 left-0 p-4 opacity-0 pointer-events-none;

        input {
            @apply p-4 rounded-full rounded-tl-none border border-gray-300 shadow-xl;
        }

        &.is-focused {
            @apply opacity-100;
        }
    }
</style>

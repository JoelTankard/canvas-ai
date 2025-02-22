<template>
    <div :class="['chat-input', { 'is-focused': isFocused }]" :style="styleChatInput">
        <input ref="inputRef" v-model="message" placeholder="Message" @focus="onFocus" @blur="onBlur" />
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick } from "vue";
    import { useMouse, useMagicKeys } from "@vueuse/core";

    const { slash } = useMagicKeys();
    const inputRef = ref<HTMLInputElement>();
    const { x, y } = useMouse();
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
        @apply absolute top-0 left-0 p-4 opacity-0;

        input {
            @apply p-4 rounded-full rounded-tl-none border border-gray-300 shadow-xl;
        }

        &.is-focused {
            @apply opacity-100;
        }
    }
</style>

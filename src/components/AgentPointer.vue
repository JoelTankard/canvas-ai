<template>
    <div class="agent-pointer-wrapper" :style="pointerStyle">
        <div class="last-agent-message">
            <div class="last-agent-message-inner">
                <p>{{ lastAgentMessage }}</p>
            </div>
        </div>
        <div class="agent-pointer">
            <div class="agent-image">
                <img src="@/assets/small-agent.png" alt="Agent" />
            </div>
            <div class="agent-pointer-inner" :style="arrowStyle">
                <img src="@/assets/pointer.png" alt="Agent Pointer" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch } from "vue";
    import { storeToRefs } from "pinia";
    import { useAgentStore } from "@/stores/agent";
    import { useMessagesStore } from "@/stores/messages";
    import { useRoute } from "vue-router";

    const route = useRoute();
    const messageStore = useMessagesStore();
    const sessionId = computed(() => route.params.id as string);
    const displayMessages = computed(() => messageStore.getDisplayMessages(sessionId.value));

    const lastAgentMessage = computed(() => {
        return displayMessages.value.reverse().find((message) => message.role === "assistant")?.content;
    });

    const agentStore = useAgentStore();
    const { agentPosition, scale: agentScale } = storeToRefs(agentStore);

    // Track panzoom transform
    const zoomTransform = ref({ x: 0, y: 0, scale: 1 });

    onMounted(() => {
        // Watch for panzoom changes
        const zoomView = document.querySelector(".zoom-view");
        if (zoomView) {
            const observer = new MutationObserver(() => {
                const transform = window.getComputedStyle(zoomView).transform;
                if (transform && transform !== "none") {
                    const matrix = new DOMMatrix(transform);
                    zoomTransform.value = {
                        x: matrix.e,
                        y: matrix.f,
                        scale: matrix.a,
                    };
                }
            });

            observer.observe(zoomView, {
                attributes: true,
                attributeFilter: ["style"],
            });
        }
    });

    const getTransformedPosition = (x: number, y: number) => {
        return {
            x: x * zoomTransform.value.scale + zoomTransform.value.x,
            y: y * zoomTransform.value.scale + zoomTransform.value.y,
        };
    };

    const isInViewport = (x: number, y: number) => {
        const margin = 100 * zoomTransform.value.scale; // Scale margin with zoom
        const pos = getTransformedPosition(x, y);
        const padding = 100; // Extra padding to ensure visibility

        return pos.x >= -margin && pos.x <= window.innerWidth - padding + margin && pos.y >= -margin && pos.y <= window.innerHeight - padding + margin;
    };

    const pointerStyle = computed(() => {
        const rawX = agentPosition.value.x;
        const rawY = agentPosition.value.y;
        const pos = getTransformedPosition(rawX, rawY);
        const inView = isInViewport(rawX, rawY);
        const padding = 100; // Padding from viewport edges

        // Calculate angle to point towards actual agent position
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);

        // Different transition speeds for in-view vs out-of-view
        const inViewDuration = 0.1; // Fast follow when in view
        const outOfViewDuration = Math.max(1, Math.min(3, 1 + 0.8 * zoomTransform.value.scale)); // Slow for edge pointing

        const transitionDuration = inView ? inViewDuration : outOfViewDuration;

        let transform;
        if (inView) {
            transform = `translate(${pos.x}px, ${Math.max(padding, pos.y - 50 * zoomTransform.value.scale)}px)`;
        } else {
            // Calculate clamped position on screen edge with padding
            const clampedX = clamp(pos.x, padding, window.innerWidth - padding);
            const clampedY = clamp(pos.y, padding, window.innerHeight - padding);
            transform = `translate(${clampedX}px, ${clampedY}px)`;
        }

        return {
            "--pointer-angle": `${angle}deg`,
            transform,
            opacity: inView ? 0 : 1,
            transition: `transform ${transitionDuration}s ease-out, opacity 0.2s ease-out`,
        };
    });

    const clamp = (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max);
    };

    const arrowStyle = computed(() => {
        const inView = isInViewport(agentPosition.value.x, agentPosition.value.y);
        const inViewDuration = 0.1;
        const outOfViewDuration = Math.max(1, Math.min(3, 1 + 0.8 * zoomTransform.value.scale));

        return {
            transform: `rotate(var(--pointer-angle))`,
            transition: `transform ${inView ? inViewDuration : outOfViewDuration}s ease-out`,
        };
    });
</script>

<style lang="scss" scoped>
    .agent-pointer-wrapper {
        @apply fixed pointer-events-none h-16 w-16  flex items-center justify-center;
        z-index: 1000;
    }
    img {
        @apply w-full h-full object-contain;
    }

    .agent-pointer {
        @apply absolute inset-0 flex items-center justify-end origin-center;
    }

    .agent-image {
        @apply absolute inset-0;
    }

    .agent-pointer-inner {
        @apply flex items-end justify-center absolute -m-8;
    }

    .last-agent-message {
        @apply absolute bottom-0 left-0 flex items-start justify-start w-auto min-w-64 max-w-screen-sm mb-16 ml-8;

        .last-agent-message-inner {
            @apply w-full bg-white rounded-xl rounded-bl-sm p-4 shadow-xl inline-block w-full;
        }
    }
</style>

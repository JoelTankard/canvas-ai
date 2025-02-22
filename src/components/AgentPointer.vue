<template>
    <div class="agent-pointer-wrapper" :style="pointerStyle">
        <div class="agent-pointer" :style="arrowStyle">
            <div class="agent-pointer-inner">
                <img src="@/assets/pointer.png" alt="Agent Pointer" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch } from "vue";
    import { storeToRefs } from "pinia";
    import { useAgentStore } from "@/stores/agent";

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

        // Scale transition duration with zoom (slower at higher zoom levels)
        const transitionDuration = Math.max(1, Math.min(3, 1 + 0.8 * zoomTransform.value.scale));

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
        // Scale transition duration with zoom
        const transitionDuration = Math.max(1, Math.min(3, 1 + 0.8 * zoomTransform.value.scale));

        return {
            transform: `rotate(var(--pointer-angle))`,
            transition: `transform ${transitionDuration}s ease-out`,
        };
    });
</script>

<style lang="scss" scoped>
    .agent-pointer-wrapper {
        @apply fixed pointer-events-none;
        z-index: 1000;
    }

    .agent-pointer {
        @apply absolute;
        transform-origin: center;
    }

    .agent-pointer-inner {
        @apply flex items-center justify-center;
        width: 32px;
        height: 32px;

        img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
    }
</style>

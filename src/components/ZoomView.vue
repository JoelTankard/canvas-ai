<template>
    <div ref="zoomView" class="zoom-view">
        <div class="dot-grid"></div>
        <slot />
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import Panzoom from "panzoom";

    const zoomView = ref<HTMLDivElement | null>(null);

    onMounted(() => {
        if (zoomView.value) {
            const instance = Panzoom(zoomView.value, {
                beforeWheel: (e: WheelEvent) => {
                    // Only allow zooming with Ctrl/Cmd key pressed
                    const isZoomEvent = e.ctrlKey || e.metaKey;

                    if (!isZoomEvent) {
                        // Convert wheel movement to pan
                        // Invert both directions for more natural feel
                        const dx = -e.deltaX;
                        const dy = -e.deltaY;
                        instance.moveBy(dx, dy, false);
                        e.preventDefault();
                        return true;
                    }

                    return !isZoomEvent; // allow zooming when Ctrl/Cmd is pressed
                },
                smoothScroll: false,
            });
        }
    });
</script>

<style scoped>
    .zoom-view {
        @apply relative w-screen h-screen;
    }

    .dot-grid {
        @apply absolute inset-0  pointer-events-none;
        background-image: radial-gradient(circle at 2px 2px, rgb(203 213 225) 2px, transparent 0);
        background-size: 40px 40px;
        width: 5000vw;
        height: 5000vh;
        left: -2500vw;
        top: -2500vh;
    }
</style>

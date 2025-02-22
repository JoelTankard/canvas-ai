<template>
    <div ref="zoomView" class="zoom-view">
        <slot />
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import panzoom from "panzoom";

    const zoomView = ref<HTMLDivElement | null>(null);

    onMounted(() => {
        if (zoomView.value) {
            const instance = panzoom(zoomView.value, {
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
        /* width: 100%;
        height: 100%;
        overflow: hidden; */
    }
</style>

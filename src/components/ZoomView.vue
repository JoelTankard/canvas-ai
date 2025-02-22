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
            panzoom(zoomView.value, {
                // Disable mousewheel zooming by default
                beforeWheel: (e) => {
                    // Only allow zooming with Ctrl/Cmd key pressed
                    const isZoomEvent = e.ctrlKey || e.metaKey;
                    return !isZoomEvent; // return true to prevent default behavior
                },
                // Customize zoom speed
                // zoomSpeed: 0.065,
                smoothScroll: false,
            });
        }
    });
</script>

<style scoped>
    .zoom-view {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
</style>

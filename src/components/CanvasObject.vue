<template>
    <div
        class="fixed pointer-events-none"
        :style="{
            left: `${position?.x || 0}px`,
            top: `${position?.y || 0}px`,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
        }">
        <!-- Objects within this canvas -->
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const props = defineProps<{
        position?: { x: number; y: number };
        dimensions?: { width: number; height: number };
    }>();

    // Default dimensions if not provided
    const dimensions = ref(props.dimensions || { width: 800, height: 600 });

    // Expose methods to parent
    defineExpose({
        dimensions,
    });
</script>

<template>
    <div class="agent" :style="style">
        <div class="agent-body">
            <img src="@/assets/agent.png" alt="Agent" />

            <div class="agent-hand left-hand">
                <img src="@/assets/agent-hand.png" alt="Hand" />
            </div>
            <div class="agent-hand right-hand">
                <img src="@/assets/agent-hand.png" alt="Hand" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from "vue";

    const SPEED = 0.002;

    const scale = ref(0.2);
    const x = ref(0);
    const y = ref(0);

    const travelTimeout = ref<NodeJS.Timeout | null>(null);

    const transitionTime = ref(0);

    // center the agent on the screen
    // const center = () => {
    //     x.value = window.innerWidth / 2 - 100;
    //     y.value = window.innerHeight / 2 - 100;
    // };

    const moveToRandomLocation = () => {
        const oldX = x.value;
        const oldY = y.value;

        x.value = Math.random() * (window.innerWidth - 200);
        y.value = Math.random() * (window.innerHeight - 200);

        const distance = Math.sqrt(Math.pow(x.value - oldX, 2) + Math.pow(y.value - oldY, 2));
        transitionTime.value = distance * SPEED;

        if (travelTimeout.value) {
            clearTimeout(travelTimeout.value);
        }
        travelTimeout.value = setTimeout(() => {
            requestAnimationFrame(moveToRandomLocation);
        }, transitionTime.value * 1000 + 1000);
    };
    onMounted(() => {
        // center();
        moveToRandomLocation();
    });
    const style = computed(() => {
        return {
            transform: `translate(${x.value}px, ${y.value}px) scale(${scale.value})`,
            transition: `transform ${transitionTime.value}s ease-in-out`,
        };
    });
</script>

<style lang="scss" scoped>
    .agent {
        @apply fixed top-0 left-0;
    }

    .agent-body {
        @apply relative;
    }
</style>

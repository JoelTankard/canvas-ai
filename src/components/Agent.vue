<template>
    <div class="agent" :style="style">
        <div class="flip-wrapper" :style="{ transform: `scaleX(${facingLeft ? 1 : -1})` }">
            <div class="agent-body">
                <img src="@/assets/agent.png" alt="Agent" />

                <div class="agent-hands">
                    <div class="agent-hand left-hand">
                        <img src="@/assets/agent-hand.png" alt="Hand" />
                    </div>
                    <div class="agent-hand right-hand">
                        <img src="@/assets/agent-hand.png" alt="Hand" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch } from "vue";
    import { useRoute } from "vue-router";
    import { useMessagesStore } from "@/stores/messages";
    import { useAgentStore } from "@/stores/agent";
    import { useMouse, usePageLeave } from "@vueuse/core";
    const mousePos = useMouse();
    const isMouseLeft = usePageLeave();

    const messagesStore = useMessagesStore();
    const agentStore = useAgentStore();

    const route = useRoute();

    const sessionId = computed(() => {
        return route.params.id as string;
    });

    const sessionMessages = computed(() => {
        return messagesStore.getDisplayMessages(sessionId.value);
    });

    const isLatestMessageUser = computed(() => {
        return sessionMessages.value.find((message) => message.role === "user");
    });

    const lastAgentMessage = computed(() => {
        return sessionMessages.value.find((message) => message.role === "assistant");
    });

    const SPEED = 0.002;
    const HAND_DELAY = 0.15; // 150ms delay for hands

    const scale = ref(0.2);
    const x = ref(0);
    const y = ref(0);
    const leftHandRotation = ref(0);
    const rightHandRotation = ref(0);
    const leftHandOffset = ref({ x: 0, y: 0 });
    const rightHandOffset = ref({ x: 0, y: 0 });
    const facingLeft = ref(false);

    const travelTimeout = ref<NodeJS.Timeout | null>(null);

    const transitionTime = ref(0);

    // center the agent on the screen
    // const center = () => {
    //     x.value = window.innerWidth / 2 - 100;
    //     y.value = window.innerHeight / 2 - 100;
    // };

    const moveToRandomLocation = (setX?: number | undefined, setY?: number | undefined, timeout = 1000) => {
        const oldX = x.value;
        const oldY = y.value;

        x.value = Math.random() * (window.innerWidth - 200);
        y.value = Math.random() * (window.innerHeight - 200);

        // Update store with new position
        agentStore.updatePosition(x.value, y.value);
        agentStore.updateScale(scale.value);

        // Calculate movement vector
        const dx = x.value - oldX;
        const dy = y.value - oldY;
        const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

        // Update facing direction based on horizontal movement
        if (Math.abs(dx) > Math.abs(dy)) {
            // If moving more horizontally than vertically
            facingLeft.value = dx < 0;
        }

        // Calculate rotation based on movement direction
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        leftHandRotation.value = Math.min(Math.max(angle * 0.2, -15), 15);
        rightHandRotation.value = -leftHandRotation.value;

        // Calculate hand offsets based on movement
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        leftHandOffset.value = {
            x: -normalizedDy * 10,
            y: normalizedDx * 10,
        };
        rightHandOffset.value = {
            x: normalizedDy * 10,
            y: -normalizedDx * 10,
        };

        transitionTime.value = distance * SPEED;

        if (travelTimeout.value) {
            clearTimeout(travelTimeout.value);
        }
        travelTimeout.value = setTimeout(() => {
            requestAnimationFrame(moveToRandomLocation);
        }, transitionTime.value * 1000 + timeout);
    };
    onMounted(() => {
        // center();
        moveToRandomLocation();

        // Ensure initial position is set in store
        agentStore.updatePosition(x.value, y.value);
        agentStore.updateScale(scale.value);
    });

    // Update store whenever position changes
    watch(
        [x, y],
        ([newX, newY]) => {
            requestAnimationFrame(() => {
                agentStore.updatePosition(newX, newY);
            });
        },
        { immediate: true }
    );

    watch(
        scale,
        (newScale) => {
            requestAnimationFrame(() => {
                agentStore.updateScale(newScale);
            });
        },
        { immediate: true }
    );

    const style = computed(() => {
        return {
            transform: `translate(${x.value}px, ${y.value}px) scale(${scale.value})`,
            transition: `transform ${transitionTime.value}s ease-in-out`,
            "--left-hand-rotation": `${leftHandRotation.value}deg`,
            "--right-hand-rotation": `${rightHandRotation.value}deg`,
            "--transition-time": `${transitionTime.value}s`,
            "--hand-delay": `${HAND_DELAY}s`,
            "--left-hand-x": `${leftHandOffset.value.x}px`,
            "--left-hand-y": `${leftHandOffset.value.y}px`,
            "--right-hand-x": `${rightHandOffset.value.x}px`,
            "--right-hand-y": `${rightHandOffset.value.y}px`,
        };
    });

    // watch(isLatestMessageUser, (newVal) => {
    //     if (newVal) {
    //         let focus = { x: mousePos.x.value, y: mousePos.y.value };
    //         if (isMouseLeft.value) {
    //             focus = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    //         }

    //         moveToRandomLocation(focus.x, focus.y, 10000);
    //     }
    // });
</script>

<style lang="scss" scoped>
    .agent {
        @apply fixed top-0 left-0;
    }

    .agent-body {
        @apply relative;
    }

    .flip-wrapper {
        @apply transition-transform duration-300 ease-in-out;
    }

    .agent-hands {
        @apply flex flex-row justify-between;

        .agent-hand {
            @apply absolute;
            transition: transform var(--transition-time) ease-in-out var(--hand-delay);

            &.left-hand {
                @apply left-0 -ml-32;
                transform: translate(var(--left-hand-x), var(--left-hand-y)) rotate(var(--left-hand-rotation, 0deg));
            }

            &.right-hand {
                @apply right-0 -mr-32;
                transform: translate(var(--right-hand-x), var(--right-hand-y)) scale(-1, 1) rotate(var(--right-hand-rotation, 0deg));
            }
        }
    }
</style>

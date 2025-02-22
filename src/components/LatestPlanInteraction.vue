<script setup lang="ts">
    import { usePlanningInteractionStore } from "@store/PlanInteraction";
    import { computed } from "vue";
    import MacroSteps from "./MacroSteps.vue";

    const planningStore = usePlanningInteractionStore();

    const allInteractions = computed(() => planningStore.interactions);

    const latestInteraction = computed(() => planningStore.interactions[planningStore.interactions.length - 1]);

    const latestPlanIteration = computed(() => {
        if (!latestInteraction.value?.planIterations.length) return null;
        return latestInteraction.value.planIterations[latestInteraction.value.planIterations.length - 1];
    });

    const formattedTimestamp = computed(() => {
        if (!latestPlanIteration.value?.timestamp) return "";
        return new Date(latestPlanIteration.value.timestamp).toLocaleString();
    });
</script>

<template>
    <div class="rounded-lg border p-4 space-y-4 h-full w-1/3 bg-white z-100 fixed bottom-0 right-0">
        <div class="h-full overflow-scroll relative">
            <div v-if="latestInteraction">
                <div class="space-y-2">
                    <h3 class="text-lg font-semibold">Latest Plan</h3>
                    <div class="text-sm text-gray-500">{{ formattedTimestamp }}</div>
                </div>

                <div class="space-y-2">
                    <div class="font-medium">User Input:</div>
                    <div class="text-gray-700">{{ latestInteraction.userInput }}</div>
                </div>

                <div class="space-y-2">
                    <div class="font-medium">Intent:</div>
                    <div class="text-gray-700">{{ latestInteraction.intent }}</div>
                </div>

                <div v-if="latestPlanIteration" class="space-y-4">
                    <div>
                        <div class="font-medium">Plan (v{{ latestPlanIteration.version }}):</div>
                        <div class="text-gray-700 whitespace-pre-wrap">{{ latestPlanIteration.textPlan }}</div>
                    </div>

                    <div v-if="latestPlanIteration.critique">
                        <div class="font-medium text-amber-600">Critique:</div>
                        <div class="text-amber-600 text-sm">{{ latestPlanIteration.critique }}</div>
                    </div>

                    <div v-if="latestPlanIteration.structuredPlan?.macroSequence.length">
                        <div class="font-medium mb-2">Macro Steps:</div>
                        <MacroSteps :steps="latestPlanIteration.structuredPlan.macroSequence" />
                    </div>
                </div>

                <div v-else class="text-gray-500 italic">No plan iterations yet</div>
            </div>
            <div v-else class="text-gray-500 italic p-4">No interactions yet</div>
        </div>
    </div>
</template>

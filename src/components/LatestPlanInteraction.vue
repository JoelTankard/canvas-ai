<script setup lang="ts">
    import { usePlanningInteractionStore } from "@store/PlanInteraction";
    import { computed } from "vue";
    import MacroSequence from "./MacroSequence.vue";
    import { useRoute } from "vue-router";
    const planningStore = usePlanningInteractionStore();

    const route = useRoute();
    const sessionId = computed(() => route.params.id as string);

    const allInteractions = computed(() => planningStore.getIntercationBySessionId(sessionId.value));

    const latestInteraction = computed(() => allInteractions.value?.[allInteractions.value.length - 1]);

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
    <div class="rounded-lg border p-4 space-y-4 bg-white z-100 outline outline-2 outline-blue-500 pointer-events-auto">
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
                        <div class="font-medium mb-2">Plan macro steps:</div>
                        <ol class="list-decimal list-inside">
                            <li v-for="step in latestPlanIteration.structuredPlan.macroSequence" :key="step.name" class="mb-2">
                                <div class="flex items-center gap-2">
                                    <b>{{ step.macro }}</b>
                                    <span
                                        v-if="step.status"
                                        :class="{
                                            'text-green-600': step.status === 'success',
                                            'text-red-600': step.status === 'failed',
                                        }"
                                        class="text-sm font-medium">
                                        {{ step.status }}
                                    </span>
                                </div>
                                <p class="ml-4 text-gray-600">{{ step.description }}</p>
                                <p v-if="step.error" class="ml-4 text-red-600 text-sm mt-1">Error: {{ step.error }}</p>
                                <div v-if="step.feasibility" class="ml-4 mt-2 text-sm">
                                    <div :class="step.feasibility.is_feasible ? 'text-green-600' : 'text-red-600'">
                                        {{ step.feasibility.is_feasible ? "Feasible" : "Not Feasible" }}
                                    </div>
                                    <div v-if="step.feasibility.reason" class="text-gray-600 mt-1">
                                        {{ step.feasibility.reason }}
                                    </div>
                                    <div v-if="step.feasibility.suggested_primitives.length" class="mt-1">
                                        <span class="text-gray-600">Suggested primitives:</span>
                                        <span class="text-blue-600">{{ step.feasibility.suggested_primitives.join(", ") }}</span>
                                    </div>
                                </div>
                            </li>
                        </ol>
                    </div>
                </div>

                <div v-else class="text-gray-500 italic">No plan iterations yet</div>
            </div>
            <div v-else class="text-gray-500 italic p-4">No interactions yet</div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Stepper, StepperItem, StepperIndicator, StepperTitle, StepperDescription, StepperSeparator } from "@ui";
    import { useMacroStore } from "@/stores/macro";
    import { usePlanningInteractionStore } from "@/stores/PlanInteraction";
    import { useRoute } from "vue-router";
    import { computed, ref } from "vue";
    import MacroSteps from "./MacroSteps.vue";

    const macroStore = useMacroStore();
    const planningStore = usePlanningInteractionStore();
    const route = useRoute();
    const sessionId = computed(() => route.params.id as string);

    const steps = computed(() => planningStore.getMacroStepsBySessionId(sessionId.value));
    const selectedMacro = ref<string | null>(null);

    const handleDelete = (macro: string) => {
        planningStore.updatePlanIterationAfterMacroDeletion(planningStore.getIntercationBySessionId(sessionId.value)?.[0]?.id || "", macro);
        macroStore.deleteMacro(macro);
    };

    const handleDragStart = (event: DragEvent, step: number) => {
        if (event.dataTransfer) {
            event.dataTransfer.setData("text/plain", step.toString());
        }
    };

    const handleDrop = (event: DragEvent, targetStep: number) => {
        event.preventDefault();
        const sourceStep = parseInt(event.dataTransfer?.getData("text/plain") || "0");
        if (sourceStep === targetStep) return;

        const newSteps = [...steps.value];
        const [movedStep] = newSteps.splice(sourceStep - 1, 1);
        newSteps.splice(targetStep - 1, 0, movedStep);

        // Update step numbers
        const reorderedSteps = newSteps.map((step, index) => ({
            ...step,
            step: index + 1,
        }));

        planningStore.reorderMacroSteps(sessionId.value, reorderedSteps);
    };

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
    };

    const toggleMacroDetails = (macroName: string) => {
        selectedMacro.value = selectedMacro.value === macroName ? null : macroName;
    };

    const getMacroDetails = (macroName: string) => {
        return macroStore.getMacroByName(macroName);
    };
</script>

<template>
    <div class="space-y-4">
        <Stepper :value="steps.length">
            <StepperItem v-for="step in steps" :key="step.step" :value="step.step" :data-state="step.step <= steps.length ? 'completed' : 'pending'" draggable="true" @dragstart="handleDragStart($event, step.step)" @drop="handleDrop($event, step.step)" @dragover="handleDragOver" class="cursor-move">
                <StepperIndicator>
                    {{ step.step }}
                </StepperIndicator>

                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <button @click="toggleMacroDetails(step.macro)" class="text-left hover:text-blue-600 transition-colors">
                            <StepperTitle>{{ step.macro }}</StepperTitle>
                        </button>
                        <button @click="handleDelete(step.macro)" class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors pointer-events-auto" title="Delete macro">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <StepperDescription v-if="step.description">
                        {{ step.description }}
                    </StepperDescription>

                    <div v-if="selectedMacro === step.macro" class="mt-4 pl-4 border-l-2 border-blue-200">
                        <div v-if="getMacroDetails(step.macro)" class="space-y-2">
                            <MacroSteps :macro="getMacroDetails(step.macro)!" />
                        </div>
                        <div v-else class="text-amber-600 text-sm p-2">Macro details not found. This macro may have been deleted or modified.</div>
                    </div>
                </div>

                <StepperSeparator v-if="step.step < steps.length" />
            </StepperItem>
        </Stepper>
    </div>
</template>

<style scoped>
    .macro-steps {
        @apply bg-white rounded-lg shadow-sm;
    }
</style>

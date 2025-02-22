<script setup lang="ts">
    import { Stepper, StepperItem, StepperIndicator, StepperTitle, StepperDescription, StepperSeparator } from "@ui";
    import type { MacroStep } from "@/stores/PlanInteraction";

    const props = defineProps<{
        steps: MacroStep[];
    }>();
</script>

<template>
    <div class="macro-steps p-4">
        <Stepper :value="steps.length">
            <StepperItem v-for="step in steps" :key="step.step" :value="step.step" :data-state="step.step <= steps.length ? 'completed' : 'pending'">
                <StepperIndicator>
                    {{ step.step }}
                </StepperIndicator>

                <div class="flex flex-col gap-1">
                    <StepperTitle>{{ step.macro }}</StepperTitle>
                    <StepperDescription v-if="step.description">
                        {{ step.description }}
                    </StepperDescription>
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

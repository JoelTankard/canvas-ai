<script setup lang="ts">
    import type { MacroDesign } from "@/agents/Function";

    const props = defineProps<{
        macro: MacroDesign;
    }>();

    const hasSteps = props.macro && Array.isArray(props.macro.sequence) && props.macro.sequence.length > 0;
</script>

<template>
    <div v-if="hasSteps" class="space-y-3">
        <div v-for="(step, index) in macro.sequence" :key="index" class="flex items-start gap-3 p-3 border rounded-lg bg-white">
            <div class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                {{ index + 1 }}
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <div class="font-medium">{{ step.primitive }}</div>
                    <div
                        v-if="step.status"
                        :class="{
                            'text-green-600': step.status === 'success',
                            'text-red-600': step.status === 'failed',
                        }"
                        class="text-sm font-medium">
                        {{ step.status }}
                    </div>
                </div>
                <div class="text-gray-600 text-sm">{{ step.description }}</div>
                <div v-if="step.params" class="mt-2 bg-gray-50 rounded p-2 text-sm font-mono">
                    <div v-if="step.params.message" class="text-gray-700">Message: {{ step.params.message }}</div>
                    <div v-if="step.params.code" class="text-gray-700">Code: {{ step.params.code }}</div>
                    <div v-if="step.params.condition" class="text-gray-700">Condition: {{ step.params.condition }}</div>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="text-gray-500 italic p-3">No steps defined for this macro</div>
</template>

<style scoped>
    .macro-steps {
        @apply bg-white rounded-lg shadow-sm;
    }
</style>

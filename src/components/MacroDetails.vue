<script setup lang="ts">
    import type { MacroDesign } from "@/agents/Function";
    import { ref } from "vue";

    const props = defineProps<{
        macro: MacroDesign;
        onClose: () => void;
    }>();

    const isVisible = ref(true);

    const handleClose = () => {
        isVisible.value = false;
        props.onClose();
    };
</script>

<template>
    <div v-if="isVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 relative">
            <button @click="handleClose" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700" title="Close">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div class="p-6">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold mb-2">{{ macro.name }}</h2>
                    <p class="text-gray-600">{{ macro.description }}</p>
                </div>

                <div class="space-y-4">
                    <h3 class="text-lg font-semibold">Steps</h3>
                    <div class="space-y-3">
                        <div v-for="(step, index) in macro.sequence" :key="index" class="border rounded-lg p-4">
                            <div class="flex items-start gap-3">
                                <div class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                                    {{ index + 1 }}
                                </div>
                                <div>
                                    <div class="font-medium">{{ step.primitive }}</div>
                                    <div class="text-gray-600 text-sm">{{ step.description }}</div>
                                    <div v-if="step.params" class="mt-2 bg-gray-50 rounded p-2 text-sm font-mono">
                                        <div v-if="step.params.message" class="text-gray-700">Message: {{ step.params.message }}</div>
                                        <div v-if="step.params.code" class="text-gray-700">Code: {{ step.params.code }}</div>
                                        <div v-if="step.params.condition" class="text-gray-700">Condition: {{ step.params.condition }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

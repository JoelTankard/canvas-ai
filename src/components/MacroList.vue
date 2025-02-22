<script setup lang="ts">
    import { useMacroStore } from "@/stores/macro";
    import { computed } from "vue";

    const macroStore = useMacroStore();

    const macros = computed(() => macroStore.macros);

    const handleDelete = (name: string) => {
        macroStore.deleteMacro(name);
    };
</script>

<template>
    <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-xl font-semibold mb-4">Available Macros</h2>
        <div class="space-y-4">
            <div v-for="macro in macros" :key="macro.name" class="border rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-lg font-medium">{{ macro.name }}</h3>
                            <span v-if="macro.isCustom" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Custom</span>
                        </div>
                        <p class="text-gray-600">{{ macro.description }}</p>

                        <ol>
                            <li v-for="step in macro.sequence" :key="step.name">
                                <b>{{ step.primitive }}</b>
                                <p>{{ step.description }}</p>
                            </li>
                        </ol>
                    </div>
                    <button @click="handleDelete(macro.name)" class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors pointer-events-auto" title="Delete macro">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

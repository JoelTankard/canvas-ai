<template>
    <div class="fixed bottom-0 left-0 w-96 bg-white/50">
        <table>
            <thead>
                <tr>
                    <th>Assistant</th>
                    <th>Thread</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="assistant in assistants" :key="assistant.id">
                    <td>{{ assistant.name }}</td>
                </tr>
                <tr v-for="thread in getThreadsBySessionId" :key="thread.id">
                    <td>{{ thread.name }}</td>
                    <td>{{ thread.id }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
    import { computed } from "vue";
    import { useAssistantStore } from "../stores/assistant";
    import { useThread } from "../stores/thread";
    import { useRoute } from "vue-router";

    const route = useRoute();
    const sessionId = computed(() => route.params.id);
    console.log("Session ID:", sessionId.value);
    const assistantStore = useAssistantStore();
    const threadStore = useThread();

    const assistants = computed(() => assistantStore.assistants);

    const getThreadsBySessionId = computed(() => threadStore.threads.filter((thread) => thread.sessionId === sessionId.value));
</script>

<style scoped>
    /* Add any necessary styles here */
</style>

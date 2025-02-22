<template>
    <div ref="noteElement" class="sticky-note" contenteditable="true" @focus="onFocus" @blur="onBlur" @input="onInput" :style="noteStyle">
        {{ content }}
    </div>
</template>

<script setup>
    import { ref, onMounted, defineProps, inject, computed } from "vue";
    import { useFilesStore } from "@/stores/files";

    const props = defineProps({
        id: Number,
    });

    const content = ref("");
    const store = useFilesStore();
    const noteElement = ref(null);
    const removeLocalNote = inject("removeLocalNote");

    function onFocus() {
        // Logic to handle focus
    }

    function onBlur() {
        if (content.value.trim() === "") {
            store.removeNote(props.id);
        } else {
            store.updateNote(props.id, content.value);
        }
    }

    function onInput(event) {
        content.value = event.target.innerText;
    }

    const note = store.notes.find((note) => note.id === props.id);

    const noteStyle = computed(() => ({
        transform: `translate(${note.x}px, ${note.y}px)`,
    }));

    onMounted(() => {
        noteElement.value.focus();
    });
</script>

<style scoped>
    .sticky-note {
        /* Add styles for the sticky note */
        @apply absolute top-0 left-0 h-32 w-32 bg-white;
        /* Additional styling */
    }
</style>

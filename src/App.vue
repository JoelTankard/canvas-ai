<script setup lang="ts">
    import { ref } from "vue";
    import { Button } from "@ui";

    import { useExampleStore, useExamplePersistedStore } from "@/store/example";
    import { greet, fetch_geolocation } from "src-rust";

    const exampleStore = useExampleStore();
    const examplePersistedStore = useExamplePersistedStore();

    const greetMsg = ref("");
    const geoInfo = ref("");
    const name = ref("");

    async function clickGreet() {
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        // greetMsg.value = await greet();
        geoInfo.value = await fetch_geolocation();
    }

    function incrementExampleStore() {
        exampleStore.count++;
    }

    function incrementExamplePersistedStore() {
        examplePersistedStore.count++;
    }
</script>

<template>
    <main class="container">
        <h1>Welcome to Rust + Vue</h1>

        <input v-model="name" />
        <Button @click="clickGreet">Greet</Button>

        <p>{{ greetMsg }}</p>
        <p>{{ geoInfo }}</p>

        <h2>Example Store</h2>
        <p>{{ exampleStore.count }}</p>
        <Button @click="incrementExampleStore">Increment</Button>

        <h2>Example Persisted Store</h2>
        <p>{{ examplePersistedStore.count }}</p>
        <Button @click="incrementExamplePersistedStore">Increment</Button>
    </main>
</template>

<style lang="scss" scoped>
    h1 {
        @apply text-3xl font-bold;
    }
</style>

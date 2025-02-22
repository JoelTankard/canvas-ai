<template>
    <main class="main">
        <SessionTabs />
        <OpenAIDialog />
        <DebugAssistants />
        <router-view></router-view>
    </main>
</template>

<script setup lang="ts">
    import OpenAIDialog from "@/components/OpenAIDialog.vue";
    import DebugAssistants from "@/components/DebugAssistants.vue";
    import SessionTabs from "@/components/SessionTabs.vue";

    // import { greet, fetch_geolocation } from "src-rust";

    // const greetMsg = ref("");
    // const geoInfo = ref("");
    // const name = ref("");

    // async function clickGreet() {
    //     // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    //     // greetMsg.value = await greet();
    //     geoInfo.value = await fetch_geolocation();
    // }
</script>

<style lang="scss" scoped>
    .main {
        @apply bg-zinc-100 h-screen w-screen;
    }
</style>

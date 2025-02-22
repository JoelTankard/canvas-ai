<template>
    <main class="main" ref="dropZoneRef" :class="{ 'file-drag': isOverDropZone }">
        <OpenAIDialog />
        <!-- <DebugAssistants /> -->

        <router-view class="w-full relative"></router-view>

        <SessionTabs />
    </main>
</template>

<script setup lang="ts">
    import OpenAIDialog from "@/components/OpenAIDialog.vue";
    import DebugAssistants from "@/components/DebugAssistants.vue";
    import SessionTabs from "@/components/SessionTabs.vue";
    import LatestPlanInteraction from "@/components/LatestPlanInteraction.vue";
    import { ref } from "vue";
    import { useDropZone } from "@vueuse/core";
    // import { greet, fetch_geolocation } from "src-rust";

    const dropZoneRef = ref<HTMLElement>();
    const { isOverDropZone } = useDropZone(dropZoneRef, {
        onDrop: () => {},
    });

    // const greetMsg = ref("");
    // const geoInfo = ref("");
    // const name = ref("");

    // async function clickGreet() {
    //     // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    //     // greetMsg.value = await greet();
    //     geoInfo.value = await fetch_geolocation();
    // }
</script>

<style lang="scss">
    .main {
        @apply bg-zinc-100 h-screen w-screen overflow-hidden;
    }
</style>

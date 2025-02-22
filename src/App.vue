<template>
    <main class="main">
        <OpenAIDialog />
        <Upload />
        <NoteAdder />
        <ChatInput />
        <Chat />
    </main>
</template>

<script setup lang="ts">
    import { ref } from "vue";
    import { Button } from "@ui";
    import OpenAIDialog from "@/components/OpenAIDialog.vue";
    import Upload from "@/components/Upload.vue";
    import { useUserPersistedStore } from "@/store/user";
    import NoteAdder from "@/components/NoteAdder.vue";
    import ChatInput from "@/components/ChatInput.vue";
    import Chat from "@/components/Chat.vue";
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

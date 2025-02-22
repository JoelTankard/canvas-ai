<template>
    <div class="w-full border-b bg-white fixed top-0 left-0 right-0">
        <div class="flex justify-between items-center">
            <Tabs v-model="activeTab" class="w-full">
                <TabsList class="w-full flex justify-between items-center bg-transparent h-16">
                    <div class="flex-1 flex overflow-x-auto">
                        <TabsTrigger v-for="sessionId in Object.keys(sessions)" :key="sessionId" :value="sessionId" :class="['flex items-center bg-white border-r-2 border-b-zinc-200 ', { 'border-2 border-blue-500': sessionId === activeTab }]">
                            <div class="flex items-center justify-between w-48 h-12">
                                <p class="truncate w-full overflow-hidden">{{ sessionId.slice(0, 8) }}</p>
                                <Button variant="ghost" size="icon" class="h-4 w-4" @click.stop="deleteSession(sessionId)">
                                    <XIcon class="h-3 w-3" />
                                </Button>
                            </div>
                        </TabsTrigger>
                    </div>
                    <div class="flex items-center p-4">
                        <Button variant="outline" size="sm" class="ml-2" @click="createNewSession">
                            <PlusIcon class="h-4 w-4 mr-1" />
                            New Session
                        </Button>
                    </div>
                </TabsList>
            </Tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, watch } from "vue";
    import { useRouter, useRoute } from "vue-router";
    import { Tabs, TabsList, TabsTrigger } from "@ui/tabs";
    import { Button } from "@ui/button";
    import { XIcon, PlusIcon } from "lucide-vue-next";
    import { useSessionStore } from "../stores/session";
    import { useMessagesStore } from "../stores/messages";
    import { useFilesStore } from "../stores/files";
    import { useThread } from "../stores/thread";
    const router = useRouter();
    const sessionStore = useSessionStore();
    const messagesStore = useMessagesStore();
    const filesStore = useFilesStore();
    const threadStore = useThread();

    const route = useRoute();
    const sessions = computed(() => sessionStore.sessions);

    const activeTab = computed({
        get: () => route.params.id || "",
        set: (value) => {
            if (value) {
                router.push(`/session/${value}`);
            }
        },
    });

    async function createNewSession() {
        const sessionId = await sessionStore.createSession();
        router.push(`/session/${sessionId}`);
    }

    async function deleteSession(sessionId: string) {
        // Don't delete if it's the last session
        if (Object.keys(sessions.value).length <= 1) {
            return;
        }

        // Clean up associated data
        messagesStore.clearMessages(sessionId);
        filesStore.clearFiles(sessionId);
        threadStore.clearThreads(sessionId);
        // Remove the session
        delete sessionStore.sessions[sessionId];

        // If we're deleting the current session, navigate to another one
        if (sessionId === route.params.id) {
            const remainingSessionId = Object.keys(sessions.value)[0];
            if (remainingSessionId) {
                router.push(`/session/${remainingSessionId}`);
            } else {
                createNewSession();
            }
        }
    }
</script>

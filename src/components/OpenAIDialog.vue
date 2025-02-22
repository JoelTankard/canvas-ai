<template>
    <div>
        <Dialog v-model:open="showDialog">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enter your OpenAI API Key</DialogTitle>
                    <DialogDescription>Enter your OpenAI API Key to use the app.</DialogDescription>
                </DialogHeader>
                <Input v-model="apiKey" placeholder="API Key" type="password" />
                <DialogFooter>
                    <Button @click="saveApiKey">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from "vue";
    import { useUserPersistedStore } from "@/store/user";
    import { Dialog, Input, Button } from "@ui";
    import { DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@ui/dialog";

    const apiKey = ref("");
    const store = useUserPersistedStore();

    const showDialog = computed(() => !store.apiKey);

    const saveApiKey = () => {
        store.setApiKey(apiKey.value);
    };
</script>

<style scoped></style>

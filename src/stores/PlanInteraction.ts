import { defineStore } from "pinia";
import { useFilesStore } from "@store/files";

export interface PlanIteration {
    version: number;
    plan: string;
    critique?: string;
    timestamp: number;
}

export interface PlanningInteraction {
    id: string;
    sessionId: string;
    userInput: string;
    filesAttached: {
        id: string;
        name: string;
        content: string;
    }[];
    intent: string;
    groundedIntent?: string;
    planIterations: PlanIteration[];
    createdAt: number;
    updatedAt: number;
}

export const usePlanningInteractionStore = defineStore("planningInteraction", {
    state: () => ({
        // Flat array of planning interactions.
        interactions: [] as PlanningInteraction[],
        // Current active session ID (should be set by your session store).
        currentInteractionId: "" as string,
    }),
    getters: {
        // Get all interactions for the current session.
        currentSessionInteractions(state): PlanningInteraction[] {
            return state.interactions.filter((interaction) => interaction.sessionId === state.currentInteractionId);
        },
        // Optionally, get the latest planning interaction for the current session.
        currentPlanningInteraction(state): PlanningInteraction | undefined {
            const sessionInteractions = state.interactions.filter((interaction) => interaction.sessionId === state.currentInteractionId);
            return sessionInteractions[sessionInteractions.length - 1];
        },
    },
    actions: {
        // Set the active session ID.
        setCurrentInteractionId(interactionId: string) {
            this.currentInteractionId = interactionId;
        },
        // Create a new planning interaction for the current session.
        createInteraction(userInput: string, intent: string, sessionId: string) {
            const fileStore = useFilesStore();
            // Retrieve files associated with the current session from the file store.
            const filesAttached = fileStore.getFilesBySessionId(sessionId);
            const newInteraction: PlanningInteraction = {
                id: crypto.randomUUID(),
                sessionId: sessionId,
                userInput,
                filesAttached: filesAttached.map((file) => ({
                    id: file.id,
                    name: file.name,
                    content: file.content,
                })),
                intent,
                planIterations: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            this.interactions.push(newInteraction);
            return newInteraction;
        },
        // Update the grounded intent for a specific interaction.
        updateGroundedIntent(interactionId: string, groundedIntent: string) {
            const interaction = this.interactions.find((interaction) => interaction.id === interactionId);
            if (interaction) {
                interaction.groundedIntent = groundedIntent;
                interaction.updatedAt = Date.now();
            }
        },
        // Add a new plan iteration to a specific planning interaction.
        addPlanIteration(interactionId: string, plan: string, critique?: string) {
            const interaction = this.interactions.find((interaction) => interaction.id === interactionId);
            if (interaction) {
                const version = interaction.planIterations.length + 1;
                interaction.planIterations.push({
                    version,
                    plan,
                    critique,
                    timestamp: Date.now(),
                });
                interaction.updatedAt = Date.now();
            }
        },
        // Retrieve a planning interaction by its ID.
        getInteractionById(interactionId: string): PlanningInteraction | undefined {
            return this.interactions.find((interaction) => interaction.id === interactionId);
        },
    },
    persist: true, // Optional: persist interactions between reloads.
});

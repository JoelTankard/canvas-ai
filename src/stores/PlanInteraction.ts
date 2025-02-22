import { defineStore } from "pinia";
import { useFilesStore } from "@store/files";
import { useMacroStore } from "@store/macro";

export interface MacroStep {
    step: number;
    macro: string;
    description?: string;
    status?: "success" | "failed";
    error?: string;
}

export interface MacroSequence {
    macroSequence: MacroStep[];
}

export interface PlanIteration {
    version: number;
    textPlan: string;
    structuredPlan?: MacroSequence;
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
        currentMacroSteps(state): MacroStep[] {
            const latestInteraction = this.currentPlanningInteraction;
            if (!latestInteraction?.planIterations.length) return [];

            const latestIteration = latestInteraction.planIterations[latestInteraction.planIterations.length - 1];
            return latestIteration.structuredPlan?.macroSequence || [];
        },
        getMacroStepsBySessionId:
            (state) =>
            (sessionId: string): MacroStep[] => {
                const interactions = state.interactions.filter((interaction) => interaction.sessionId === sessionId);
                if (!interactions.length) return [];

                const latestInteraction = interactions[interactions.length - 1];
                if (!latestInteraction.planIterations.length) return [];

                const latestIteration = latestInteraction.planIterations[latestInteraction.planIterations.length - 1];
                return latestIteration.structuredPlan?.macroSequence || [];
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
        addPlanIteration(interactionId: string, textPlan: string, critique?: string, structuredPlan?: MacroSequence) {
            const interaction = this.interactions.find((interaction) => interaction.id === interactionId);
            if (interaction) {
                const version = interaction.planIterations.length + 1;
                interaction.planIterations.push({
                    version,
                    textPlan,
                    structuredPlan,
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

        getIntercationBySessionId(sessionId: string): PlanningInteraction[] | undefined {
            return this.interactions.filter((interaction) => interaction.sessionId === sessionId);
        },

        updatePlanIterationAfterMacroDeletion(interactionId: string, deletedMacro: string) {
            const interaction = this.interactions.find((interaction) => interaction.id === interactionId);
            if (interaction && interaction.planIterations.length > 0) {
                const latestIteration = interaction.planIterations[interaction.planIterations.length - 1];
                if (latestIteration.structuredPlan?.macroSequence) {
                    // Remove the deleted macro and reorder steps
                    const filteredSteps = latestIteration.structuredPlan.macroSequence
                        .filter((step) => step.macro !== deletedMacro)
                        .map((step, index) => ({
                            ...step,
                            step: index + 1,
                        }));

                    latestIteration.structuredPlan.macroSequence = filteredSteps;
                    interaction.updatedAt = Date.now();
                }
            }
        },

        reorderMacroSteps(sessionId: string, steps: MacroStep[]) {
            const interactions = this.getIntercationBySessionId(sessionId);
            if (interactions && interactions.length > 0) {
                const latestInteraction = interactions[interactions.length - 1];
                if (latestInteraction.planIterations.length > 0) {
                    const latestIteration = latestInteraction.planIterations[latestInteraction.planIterations.length - 1];
                    if (latestIteration.structuredPlan) {
                        latestIteration.structuredPlan.macroSequence = steps;
                        latestInteraction.updatedAt = Date.now();
                    }
                }
            }
        },

        updateStepStatus(sessionId: string, stepNumber: number, status: "success" | "failed", error?: string) {
            const interactions = this.getIntercationBySessionId(sessionId);
            if (interactions && interactions.length > 0) {
                const latestInteraction = interactions[interactions.length - 1];
                if (latestInteraction.planIterations.length > 0) {
                    const latestIteration = latestInteraction.planIterations[latestInteraction.planIterations.length - 1];
                    if (latestIteration.structuredPlan) {
                        const step = latestIteration.structuredPlan.macroSequence.find((s) => s.step === stepNumber);
                        if (step) {
                            step.status = status;
                            if (error) {
                                step.error = error;
                            }
                            latestInteraction.updatedAt = Date.now();
                        }
                    }
                }
            }
        },
    },
    persist: true, // Optional: persist interactions between reloads.
});

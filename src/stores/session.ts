import { computed } from "vue";
import { defineStore } from "pinia";
import { useThread } from "@store/thread";
import { useRoute } from "vue-router";
import * as convoAgent from "@agents/Convo";
import { useFilesStore } from "./files";
import * as funcAgent from "@agents/Function";
import * as textGenAgent from "@agents/TextGen";
import * as structuredAgent from "@agents/structured";
import { usePlanningInteractionStore } from "@store/PlanInteraction";
import { useMessagesStore } from "@store/messages";
import { useMacroStore } from "@store/macro";
import type { MacroDesign, MacroDesignRequest } from "@agents/Function";

interface MacroRequest {
    macro: string;
    description: string;
}

export interface SessionState {
    id: string;
    isAgentTyping: boolean;
    isInputLocked: boolean;
    currentRunId: string | null;
}

export const useSessionStore = defineStore("session", {
    state: () => ({
        sessions: {} as Record<string, SessionState>,
    }),
    getters: {},
    actions: {
        getSessionById(id: string) {
            return this.sessions[id];
        },
        async createSession() {
            const sessionId = crypto.randomUUID();
            const threadStore = useThread();

            threadStore.initializeThreads(sessionId);

            this.sessions[sessionId] = {
                id: sessionId,
                isAgentTyping: false,
                isInputLocked: false,
                currentRunId: null,
            };

            return sessionId;
        },

        setAgentTyping(sessionId: string, typing: boolean) {
            if (this.sessions[sessionId]) {
                this.sessions[sessionId].isAgentTyping = typing;
                this.sessions[sessionId].isInputLocked = typing;
            }
        },

        setCurrentRunId(sessionId: string, runId: string | null) {
            if (this.sessions[sessionId]) {
                this.sessions[sessionId].currentRunId = runId;
            }
        },

        addMessage(sessionId: string, message: string) {
            const messageStore = useMessagesStore();
            const step = messageStore.addStep(sessionId, "user_input");
            messageStore.addMessage(sessionId, message, "user", "display", step);
        },

        async initializeSession() {
            const route = useRoute();
            if (!this.sessions[route.params.id as string]) {
                await this.createSession();
            }
            return this.sessions[route.params.id as string];
        },

        async userInput(sessionId: string, message: string) {
            const fileStore = useFilesStore();

            if (!fileStore.allFilesProcessed(sessionId)) {
                await convoAgent.filesNotReady(sessionId).interact(message, "display");
                return;
            }

            const getIntent = await funcAgent.getIntent(sessionId).execute(message);
            console.log("Intent detection:", getIntent);

            if (getIntent.can_get_intent === "yes" && getIntent.intent) {
                const planningStore = usePlanningInteractionStore();
                const macroStore = useMacroStore();
                const interaction = planningStore.createInteraction(message, getIntent.intent, sessionId);
                console.log("Created planning interaction:", interaction);

                // Notify user that we're starting to plan
                convoAgent.notifyPlanning(sessionId, getIntent.intent).interact(message, "display");

                try {
                    // Get anxious critique about potential failures
                    const anxiousCritique = await textGenAgent.anxiousCritique(sessionId).generate(getIntent.intent);
                    console.log("Anxious critique:", anxiousCritique);

                    // Generate step-by-step plan considering the critique
                    const textPlan = await textGenAgent.planGenerator(sessionId).generate(
                        JSON.stringify({
                            intent: getIntent.intent,
                            constraints: anxiousCritique,
                            availableMacros: macroStore.availableMacros,
                        })
                    );
                    console.log("Generated text plan:", textPlan);

                    // First iteration with just the text plan and critique
                    planningStore.addPlanIteration(interaction.id, textPlan, anxiousCritique);

                    // Convert plan to macro sequence using function calling
                    const macroResult = await funcAgent.selectMacros(sessionId, macroStore.availableMacros).execute(textPlan);
                    console.log("Selected macros:", macroResult);

                    // Process new macros in parallel
                    const macroRequests = macroResult.new_macros.map((macro: MacroRequest) => ({
                        name: macro.macro,
                        description: macro.description,
                    }));
                    console.log("Macro requests to process:", macroRequests);

                    // Process macros in batches of 3
                    const batchSize = 3;
                    const batches = [];
                    for (let i = 0; i < macroRequests.length; i += batchSize) {
                        batches.push(macroRequests.slice(i, i + batchSize));
                    }
                    console.log("Batched macro requests:", batches);

                    const allMacroDesigns: MacroDesign[] = [];
                    for (const batch of batches) {
                        console.log("Processing batch:", batch);
                        const batchResults = await Promise.all(
                            batch.map(async (request: MacroDesignRequest) => {
                                const result = await funcAgent.designMacros(sessionId, [request]).execute("");
                                return result.macros[0];
                            })
                        );
                        console.log("Batch results:", batchResults);
                        allMacroDesigns.push(...batchResults);
                    }
                    console.log("All macro designs:", allMacroDesigns);

                    // Add the designed macros to the store
                    allMacroDesigns.forEach((design) => {
                        macroStore.addCustomMacro(design.name, design.description);
                    });

                    // Build the final sequence combining both selected and new macros
                    const steps = [...macroResult.selected_macros, ...macroResult.new_macros]
                        .sort((a, b) => a.step - b.step)
                        .map((step) => ({
                            step: step.step,
                            macro: step.macro,
                            ...(step.description && { description: step.description }),
                        }));
                    console.log("Final macro sequence steps:", steps);

                    const macroSequence = { macroSequence: steps };
                    console.log("Final macro sequence:", macroSequence);

                    planningStore.addPlanIteration(interaction.id, textPlan, anxiousCritique, macroSequence);
                } catch (error) {
                    console.error("Planning error details:", {
                        error,
                        sessionId,
                        intent: getIntent.intent,
                        message,
                    });
                    convoAgent.notifyPlanning(sessionId, "Ugh, something went wrong while planning. My bad.").interact(message, "display");
                    return;
                }

                return;
            }

            await convoAgent.askForMoreContext(sessionId).interact(message, "display");
        },
    },
    persist: true,
});

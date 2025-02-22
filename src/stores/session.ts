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

            // if (fileStore.allFilesProcessed(sessionId)) {
            //     messageStore.addMessage(sessionId, message, "user");
            // } else {

            if (!fileStore.allFilesProcessed(sessionId)) {
                await convoAgent.filesNotReady(sessionId).interact(message, "display");
                return;
            }

            // const canGetIntent = await funcAgent.canGetIntent(sessionId).execute(message);
            const getIntent = await funcAgent.getIntent(sessionId).execute(message);

            // if (canGetIntent) {
            // const intent = await textGenAgent.userIntent(sessionId).generate(message);

            if (getIntent.can_get_intent === "yes" && getIntent.intent) {
                const planningStore = usePlanningInteractionStore();
                const macroStore = useMacroStore();
                const interaction = planningStore.createInteraction(message, getIntent.intent, sessionId);

                // Get anxious critique about potential failures
                const anxiousCritique = await textGenAgent.anxiousCritique(sessionId).generate(getIntent.intent);

                // Generate step-by-step plan considering the critique
                const textPlan = await textGenAgent.planGenerator(sessionId).generate(
                    JSON.stringify({
                        intent: getIntent.intent,
                        constraints: anxiousCritique,
                        availableMacros: macroStore.availableMacros,
                    })
                );

                // First iteration with just the text plan and critique
                planningStore.addPlanIteration(interaction.id, textPlan, anxiousCritique);

                // Convert plan to macro sequence using structured output
                const macroSequence = await structuredAgent.macroConverter(sessionId, macroStore.availableMacros).interact(textPlan);

                // Add any new macros to the store
                const structuredPlan = JSON.parse(macroSequence);
                structuredPlan.macroSequence.forEach((step: any) => {
                    if (step.description) {
                        macroStore.addCustomMacro(step.macro, step.description);
                    }
                });

                // Update the plan with the structured macro sequence
                planningStore.addPlanIteration(interaction.id, textPlan, anxiousCritique, structuredPlan);

                await convoAgent.notifyPlanning(sessionId, getIntent.intent).interact(message, "display");
                return;
            }
            // }
            await convoAgent.askForMoreContext(sessionId).interact(message, "display");

            // }
        },
    },
    persist: true,
});

import { defineStore } from "pinia";
import type { MacroDesign } from "@/agents/Function";

export interface Macro extends MacroDesign {
    isCustom: boolean;
}

export const useMacroStore = defineStore("macro", {
    state: () => ({
        macros: [] as Macro[],
    }),

    getters: {
        availableMacros: (state) => state.macros.map((macro) => macro.name),

        getMacroByName: (state) => {
            return (name: string) => state.macros.find((macro) => macro.name === name);
        },
    },

    actions: {
        addMacro(name: string, description: string, sequence: MacroDesign["sequence"]) {
            if (!this.macros.find((m) => m.name === name)) {
                this.macros.push({ name, description, sequence, isCustom: true });
            }
        },

        deleteMacro(name: string) {
            const index = this.macros.findIndex((macro) => macro.name === name);
            if (index !== -1) {
                this.macros.splice(index, 1);
            }
        },

        updateStepStatus(macroName: string, stepIndex: number, status: "success" | "failed") {
            const macro = this.macros.find((m) => m.name === macroName);
            if (macro && macro.sequence[stepIndex]) {
                macro.sequence[stepIndex].status = status;
            }
        },
    },
    persist: true,
});

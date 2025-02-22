import { defineStore } from "pinia";

export interface Macro {
    name: string;
    description: string;
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
        addMacro(name: string, description: string, isCustom: boolean = false) {
            if (!this.macros.find((m) => m.name === name)) {
                this.macros.push({ name, description, isCustom });
            }
        },

        addCustomMacro(name: string, description: string) {
            this.addMacro(name, description, true);
        },

        initializeDefaultMacros() {
            const defaults = [
                { name: "clone_repo", description: "Clone a repository and create new branch" },
                { name: "install_deps", description: "Install project dependencies" },
                { name: "run_tests", description: "Run test suite and verify coverage" },
                // Add more default macros here
            ];

            defaults.forEach((macro) => this.addMacro(macro.name, macro.description));
        },
    },
    persist: true,
});

import { defineStore } from "pinia";

interface Position {
    x: number;
    y: number;
}

export const useAgentStore = defineStore("agent", {
    state: () => ({
        agentPosition: { x: 0, y: 0 } as Position,
        scale: 0.2,
    }),

    actions: {
        updatePosition(x: number, y: number) {
            this.agentPosition = { x, y };
        },

        updateScale(scale: number) {
            this.scale = scale;
        },
    },
});

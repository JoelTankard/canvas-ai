import { createRouter, createWebHistory, RouteLocationNormalized } from "vue-router";
import { useSessionStore } from "@store/session";
import SessionView from "@/views/SessionView.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            redirect: (to: RouteLocationNormalized) => {
                const sessionStore = useSessionStore();
                if (sessionStore.currentSessionId) {
                    return `/session/${sessionStore.currentSessionId}`;
                }
                return "/session/new";
            },
        },
        {
            path: "/session/new",
            name: "new-session",
            component: SessionView,
            beforeEnter: async () => {
                const sessionStore = useSessionStore();
                const sessionId = await sessionStore.createSession();
                return `/session/${sessionId}`;
            },
        },
        {
            path: "/session/:id",
            name: "session",
            component: SessionView,
            beforeEnter: async (to: RouteLocationNormalized) => {
                const sessionStore = useSessionStore();
                const sessionId = to.params.id as string;

                // If session doesn't exist, redirect to latest session or create new one
                if (!sessionStore.sessions[sessionId]) {
                    if (sessionStore.currentSessionId) {
                        return `/session/${sessionStore.currentSessionId}`;
                    }
                    return "/session/new";
                }

                // Update current session
                sessionStore.currentSessionId = sessionId;
            },
        },
    ],
});

export default router;

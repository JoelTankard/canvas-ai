import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import init from "src-rust";

import App from "./App.vue";
import "./assets/css/index.css";

// Initialize WASM before mounting the app
// @ts-ignore
init();

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);

app.mount("#app");

import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import init from "src-rust";
import router from "./router";

import App from "./App.vue";
import "./assets/css/index.css";

// Initialize WASM before mounting the app
// @ts-ignore
init();

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCWmA7ILREn6u139Qw3J690JiMyOr0OQA4",
    authDomain: "canvas-ai-d9a44.firebaseapp.com",
    projectId: "canvas-ai-d9a44",
    storageBucket: "canvas-ai-d9a44.firebasestorage.app",
    messagingSenderId: "660169648367",
    appId: "1:660169648367:web:494c64df1114686ec5531a",
    measurementId: "G-5YQH1GVKMK",
};

// Initialize Firebase
const appFirebase = initializeApp(firebaseConfig);
const analytics = getAnalytics(appFirebase);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);

app.mount("#app");

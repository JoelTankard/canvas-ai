import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs";
import path from "path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { ViteRsw } from "vite-plugin-rsw";

function autoGenerateUiExports() {
    const UI_COMPONENTS_DIR = fileURLToPath(new URL("./src/components/ui", import.meta.url));
    const INDEX_FILE = path.join(UI_COMPONENTS_DIR, "index.ts");

    return {
        name: "auto-generate-ui-exports",
        configureServer(server) {
            function generateExports() {
                const directories = fs
                    .readdirSync(UI_COMPONENTS_DIR, { withFileTypes: true })
                    .filter((dirent) => dirent.isDirectory())
                    .map((dirent) => dirent.name)
                    .filter((name) => name !== "node_modules" && !name.startsWith("."));

                const exports = directories.map((dir) => `export * from './${dir}'`).join("\n");
                fs.writeFileSync(INDEX_FILE, exports + "\n");
            }

            generateExports();
            server.watcher.add(UI_COMPONENTS_DIR);
            server.watcher.on("addDir", (path) => {
                if (path.includes("/components/ui/")) generateExports();
            });
            server.watcher.on("unlinkDir", (path) => {
                if (path.includes("/components/ui/")) generateExports();
            });
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), autoGenerateUiExports(), wasm(), topLevelAwait(), ViteRsw()],
    clearScreen: false,

    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "@ui": fileURLToPath(new URL("./src/components/ui", import.meta.url)),
            "@store": fileURLToPath(new URL("./src/stores", import.meta.url)),
        },
    },
});

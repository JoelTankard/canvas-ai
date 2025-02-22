import { useFilesStore } from "@store/files";

export const fileSystemPrompt = (sessionId: string) => {
    const fileStore = useFilesStore();
    const files = fileStore.getFilesBySessionId(sessionId);

    const fileString = files.map((file) => `- ${file.name} (type: ${file.type}): ${file.content}`).join("\n");

    const prompt = `You have the following files available with names and descriptions. Each file contains specific notes that provide context:

${fileString}

Use these details as a reference for all further instructions.`;

    return prompt;
};

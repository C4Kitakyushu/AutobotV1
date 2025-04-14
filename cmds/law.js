const axios = require("axios");

module.exports = {
    name: "law",
    usePrefix: false,
    usage: "law [number]",
    version: "1.0.0",
    admin: false,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "📚 Please provide a law number (1–48).\n\nUsage: law <number>\nExample: law 5",
                threadID,
                messageID
            );
        }

        const lawNumber = args[0];
        const apiUrl = `https://haji-mix.up.railway.app/api/law?number=${encodeURIComponent(lawNumber)}`;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const res = await axios.get(apiUrl);
            const { status, title, law, message } = res.data;

            if (!status) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(
                    `❌ Failed to fetch the law. Message: ${message || "Please enter a number between 1 and 48."}`,
                    threadID,
                    messageID
                );
            }

            const output = `📖 𝗧𝗶𝘁𝗹𝗲: ${title}\n\n📜 𝗟𝗮𝘄: ${law}`;
            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(output, threadID, messageID);

        } catch (error) {
            console.error("Law command error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("❌ An error occurred while fetching the law. Please try again later.", threadID, messageID);
        }
    }
};
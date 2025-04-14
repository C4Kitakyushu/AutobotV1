const axios = require("axios");

module.exports = {
    name: "bible",
    usePrefix: false,
    usage: "bible",
    version: "1.0.0",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event }) => {
        const { threadID, messageID } = event;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            api.sendMessage("📖 Fetching a Bible verse...", threadID, messageID);

            const response = await axios.get("https://beta.ourmanna.com/api/v1/get/?format=text");
            const verse = response.data;

            if (!verse) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage("🥺 Sorry, I couldn't fetch a Bible verse.", threadID, messageID);
            }

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(`📜 𝗕𝗶𝗯𝗹𝗲 𝗩𝗲𝗿𝘀𝗲\n\n"${verse}"`, threadID, messageID);

        } catch (error) {
            console.error("Bible API error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(`❌ An error occurred while fetching the verse.`, threadID, messageID);
        }
    },
};
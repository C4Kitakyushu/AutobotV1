const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    name: "wanted",
    usePrefix: false,
    usage: "wanted [userID]",
    version: "1.0.0",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "✦ Please provide a Facebook User ID to generate a WANTED poster.\n\nExample: wanted 61556130417570",
                threadID,
                messageID
            );
        }

        const userId = args[0];
        const apiUrl = `https://jerome-web.gleeze.com/service/api/wanted?uid=${encodeURIComponent(userId)}`;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);
            const imgPath = path.join(cacheDir, `wanted_${Date.now()}.jpg`);

            const response = await axios.get(apiUrl, { responseType: "stream" });
            const writer = fs.createWriteStream(imgPath);

            await new Promise((resolve, reject) => {
                response.data.pipe(writer);
                writer.on("finish", resolve);
                writer.on("error", reject);
            });

            await api.sendMessage({
                body: `📰 WANTED Poster for User ID: ${userId}`,
                attachment: fs.createReadStream(imgPath)
            }, threadID, messageID);

            await fs.unlink(imgPath);
            api.setMessageReaction("✅", messageID, () => {}, true);

        } catch (error) {
            console.error("Error generating wanted poster:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("❌ Failed to generate the wanted poster. Please try again later.", threadID, messageID);
        }
    }
};
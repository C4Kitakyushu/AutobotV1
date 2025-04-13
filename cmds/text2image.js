const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "text2image",
    aliases: ["t2i"],
    usePrefix: false,
    usage: "text2image [prompt]",
    version: "1.0.1",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args.length) {
            return api.sendMessage("✦ Please provide a prompt to generate an image.\n\nUsage: text2image [prompt]", threadID, messageID);
        }

        const prompt = args.join(" ");
        const apiUrl = `https://kaiz-apis.gleeze.com/api/text2image?prompt=${encodeURIComponent(prompt)}`;
        const filePath = path.join(__dirname, `t2i_${Date.now()}.jpg`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const response = await axios({
                url: apiUrl,
                method: "GET",
                responseType: "stream"
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            writer.on("finish", () => {
                api.setMessageReaction("✅", messageID, () => {}, true);

                const msg = {
                    body: `✅ Here’s your image for: "${prompt}"`,
                    attachment: fs.createReadStream(filePath),
                };

                api.sendMessage(msg, threadID, (err) => {
                    if (err) {
                        console.error("❌ Error sending image:", err);
                        api.sendMessage("⚠️ Failed to send image.", threadID);
                    }

                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error("❌ Error deleting file:", unlinkErr);
                    });
                });
            });

            writer.on("error", (err) => {
                console.error("❌ Error saving image:", err);
                api.setMessageReaction("❌", messageID, () => {}, true);
                api.sendMessage("⚠️ Failed to download image.", threadID, messageID);
            });

        } catch (error) {
            console.error("❌ API Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            api.sendMessage("❌ An error occurred while generating the image. Please try again.", threadID, messageID);
        }
    },
};
const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "flux",
    usePrefix: false,
    usage: "flux [prompt]",
    version: "1.0.1",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage("⚠️ Please provide a prompt.\nUsage: flux [prompt]", threadID, messageID);
        }

        const prompt = args.join(" ");
        const apiUrl = `https://global-redwans-apis.onrender.com/api/fluxxx?p=${encodeURIComponent(prompt)}&mode=flux`;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const response = await axios.get(apiUrl);
            const { html } = response.data.data;
            const matches = [...html.matchAll(/<a href="(https:\/\/aicdn\.picsart\.com\/[a-zA-Z0-9-]+\.jpg)"/g)];
            const imageUrls = matches.map((m) => m[1]);

            if (!imageUrls.length) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage("❌ Image generation failed. Please try a different prompt.", threadID, messageID);
            }

            const imgUrl = imageUrls[0];
            const filePath = path.join(__dirname, `flux_${Date.now()}.jpg`);

            const imgResponse = await axios({
                url: imgUrl,
                method: "GET",
                responseType: "stream"
            });

            const writer = fs.createWriteStream(filePath);
            imgResponse.data.pipe(writer);

            writer.on("finish", () => {
                api.setMessageReaction("✅", messageID, () => {}, true);

                const msg = {
                    body: `🖼️ Flux image for: "${prompt}"`,
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
            api.sendMessage("⚠️ An error occurred while generating the image.", threadID, messageID);
        }
    },
};
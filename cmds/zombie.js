const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "zombie",
    usePrefix: false,
    usage: "zombie <reply to an image>",
    version: "1.0.0",
    admin: false,
    cooldown: 5,
    async execute({ api, event }) {
        const { messageReply, threadID, messageID } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("❌ Please reply to an image to apply the zombie effect.", threadID, messageID);
        }

        const attachment = messageReply.attachments[0];
        if (attachment.type !== "photo") {
            return api.sendMessage("⚠️ Only image replies are supported.", threadID, messageID);
        }

        const imageUrl = encodeURIComponent(attachment.url);
        const apiUrl = `https://kaiz-apis.gleeze.com/api/zombie?url=${imageUrl}`;

        try {
            api.sendMessage("⌛ Converting image to Zombie Style, please wait...", threadID, messageID);

            const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
            const tempDir = path.join(__dirname, "..", "temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            const tempPath = path.join(tempDir, `zombie_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, Buffer.from(response.data, "binary"));

            api.sendMessage(
                {
                    body: "🧟 Here's your zombie-style image!",
                    attachment: fs.createReadStream(tempPath)
                },
                threadID,
                () => fs.unlinkSync(tempPath),
                messageID
            );
        } catch (error) {
            console.error("Zombie API Error:", error);
            api.sendMessage("❌ An error occurred while processing the image.", threadID, messageID);
        }
    }
};
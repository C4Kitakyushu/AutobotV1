const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "remini",
    usePrefix: false,
    usage: "remini <reply to a photo>",
    version: "1.0",
    admin: false,
    cooldown: 5,
    async execute({ api, event }) {
        const { messageReply, threadID, messageID } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("❌ Please reply to an image.", threadID, messageID);
        }

        const attachment = messageReply.attachments[0];
        if (attachment.type !== "photo") {
            return api.sendMessage("❌ The replied message must be a photo.", threadID, messageID);
        }

        const imageUrl = attachment.url;
        const apiUrl = `https://kaiz-apis.gleeze.com/api/upscalev3?url=${encodeURIComponent(imageUrl)}&stream=true`;

        try {
            api.sendMessage("⏳ Enhancing image, please wait...", threadID);

            const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

            const tempDir = path.join(__dirname, "..", "temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            const tempPath = path.join(tempDir, `remini_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, Buffer.from(response.data, "binary"));

            api.sendMessage(
                {
                    body: "✅ Image enhanced!",
                    attachment: fs.createReadStream(tempPath)
                },
                threadID,
                () => fs.unlinkSync(tempPath)
            );
        } catch (err) {
            console.error("Remini Error:", err.message);
            api.sendMessage("❌ Error occurred while enhancing the image.", threadID);
        }
    }
};
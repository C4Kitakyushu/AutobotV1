const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "faceswap",
    usePrefix: false,
    usage: "faceswap <reply to 2 images>",
    version: "1.0.0",
    admin: false,
    cooldown: 5,
    async execute({ api, event }) {
        const { messageReply, threadID, messageID } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length < 2) {
            return api.sendMessage("⚠️ Please reply to a message containing *two* images to swap faces.", threadID, messageID);
        }

        const [source, target] = messageReply.attachments;
        if (source.type !== "photo" || target.type !== "photo") {
            return api.sendMessage("⚠️ Both attachments must be images.", threadID, messageID);
        }

        const sourceUrl = encodeURIComponent(source.url);
        const targetUrl = encodeURIComponent(target.url);
        const apiUrl = `https://kaiz-apis.gleeze.com/api/faceswap-v2?targetUrl=${targetUrl}&sourceUrl=${sourceUrl}`;

        try {
            api.sendMessage("⏳ Swapping faces, please wait...", threadID, messageID);

            const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

            const tempDir = path.join(__dirname, "..", "temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
            const tempPath = path.join(tempDir, `faceswap_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, Buffer.from(response.data, "binary"));

            api.sendMessage(
                {
                    body: "✅ Face swap completed!",
                    attachment: fs.createReadStream(tempPath)
                },
                threadID,
                () => fs.unlinkSync(tempPath),
                messageID
            );
        } catch (error) {
            console.error("FaceSwap API Error:", error);
            api.sendMessage("❌ An error occurred while processing the face swap.", threadID, messageID);
        }
    }
};
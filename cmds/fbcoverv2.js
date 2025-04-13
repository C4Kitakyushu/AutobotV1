const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "fbcoverv2",
    aliases: ["cover"],
    usePrefix: false,
    usage: "fbcover <name>|<id>|<subname>|<color>",
    version: "1.0.0",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args.length) {
            return api.sendMessage(
                `❌ Please provide all required fields.\n\nUsage:\nfbcover <name> | <id> | <subname> | <color>\nExample:\nfbcover Reijin | 5 | Inv | red`,
                threadID,
                messageID
            );
        }

        const details = args.join(" ").split("|").map(d => d.trim());
        if (details.length < 4) {
            return api.sendMessage(
                `❌ Invalid format. Use " | " to separate fields.\n\nExample:\nfbcover Reijin | 5 | Inv | red`,
                threadID,
                messageID
            );
        }

        const [name, id, subname, color] = details.map(d => encodeURIComponent(d));
        const apiUrl = `http://87.106.100.187:6312/canvas/fbcoverv2?name=${name}&id=${id}&subname=${subname}&color=${color}`;
        const filePath = path.join(__dirname, `fbcoverv2_${Date.now()}.jpg`);

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
                    body: "✅ Here's your Facebook cover:",
                    attachment: fs.createReadStream(filePath)
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
                console.error("❌ File write error:", err);
                api.setMessageReaction("❌", messageID, () => {}, true);
                api.sendMessage("⚠️ Failed to generate the Facebook cover.", threadID, messageID);
            });

        } catch (error) {
            console.error("❌ API Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            api.sendMessage("⚠️ An error occurred while generating the Facebook cover.", threadID, messageID);
        }
    },
};
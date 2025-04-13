const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "fbcoverv4",
    aliases: ["coverv4"],
    usePrefix: false,
    usage: "fbcoverv4 <name>|<id>|<subname>|<colorname>|<colorsub>",
    description: "Generate a Facebook cover with separate colors for name and subname.",
    version: "1.0.0",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args.length) {
            return api.sendMessage(
                `❌ Please provide all required fields.\n\n` +
                `Usage:\n` +
                `fbcoverv4 <name> | <id> | <subname> | <colorname> | <colorsub>\n` +
                `Example:\n` +
                `fbcoverv4 Reiko | 2 | Midoriya | blue | red`,
                threadID,
                messageID
            );
        }

        const details = args.join(" ").split("|").map((d) => d.trim());
        if (details.length < 5) {
            return api.sendMessage(
                `❌ Invalid format. Use " | " to separate fields.\n\n` +
                `Example:\n` +
                `fbcoverv4 Reiko | 2 | Midoriya | blue | red`,
                threadID,
                messageID
            );
        }

        const [name, id, subname, colorname, colorsub] = details.map(encodeURIComponent);
        const apiUrl = `http://87.106.100.187:6312/canvas/fbcoverv4?name=${name}&id=${id}&subname=${subname}&colorname=${colorname}&colorsub=${colorsub}`;
        const filePath = path.join(__dirname, `fbcoverv4_${Date.now()}.jpg`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const response = await axios.get(apiUrl, { responseType: "stream" });
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            writer.on("finish", () => {
                api.setMessageReaction("✅", messageID, () => {}, true);
                api.sendMessage({
                    body: "✅ Here's your customized Facebook cover:",
                    attachment: fs.createReadStream(filePath)
                }, threadID, () => fs.unlinkSync(filePath), messageID);
            });

            writer.on("error", (error) => {
                console.error("❌ File write error:", error);
                api.setMessageReaction("❌", messageID, () => {}, true);
                api.sendMessage("❌ Failed to generate the Facebook cover.", threadID, messageID);
            });
        } catch (error) {
            console.error("❌ Error generating Facebook cover:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            api.sendMessage("❌ An error occurred while generating the Facebook cover. Please try again.", threadID, messageID);
        }
    },
};
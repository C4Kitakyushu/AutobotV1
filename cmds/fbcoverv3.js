const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "fbcoverv3",
    aliases: ["coverv3"],
    usePrefix: false,
    usage: "fbcoverv3 <name>|<uid>|<birthday>|<gender>|<love>|<location>|<hometown>|<followers>",
    version: "1.0.0",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args.length) {
            return api.sendMessage(
                `❌ Please provide all required fields.\n\nUsage:\nfbcoverv3 <name> | <uid> | <birthday> | <gender> | <love> | <location> | <hometown> | <followers>\nExample:\nfbcoverv3 Mark Zuckerberg | 4 | May 14, 1984 | male | Priscilla Chan | USA | California | 119000000`,
                threadID,
                messageID
            );
        }

        const details = args.join(" ").split("|").map(d => d.trim());
        if (details.length < 8) {
            return api.sendMessage(
                `❌ Invalid format. Use " | " to separate each field.\n\nExample:\nfbcoverv3 Mark Zuckerberg | 4 | May 14, 1984 | male | Priscilla Chan | USA | California | 119000000`,
                threadID,
                messageID
            );
        }

        const [name, uid, birthday, gender, love, location, hometown, followers] = details.map(encodeURIComponent);
        const apiUrl = `http://87.106.100.187:6312/canvas/fbcoverv3?uid=${uid}&birthday=${birthday}&love=${love}&location=${location}&hometown=${hometown}&name=${name}&follow=${followers}&gender=${gender}`;
        const filePath = path.join(__dirname, `fbcoverv3_${Date.now()}.jpg`);

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
                    body: "✅ Here's your Facebook cover (v3):",
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
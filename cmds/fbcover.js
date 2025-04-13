const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "fbcover",
    aliases: ["cover"],
    usePrefix: false,
    usage: "fbcover [name]|[subname]|[number]|[address]|[email]|[uid]|[color]",
    version: "1.0.0",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args.length) {
            return api.sendMessage(
                `✦ Please provide all the required details to generate a Facebook cover.\n\nExample:\nfbcover Mark | Zuckerberg | 12345 | USA | zuck@gmail.com | 10092939929 | Blue`,
                threadID,
                messageID
            );
        }

        const details = args.join(" ").split("|").map((d) => d.trim());
        if (details.length < 7) {
            return api.sendMessage(
                `✦ Invalid format. Make sure to use " | " to separate each field.\n\nExample:\nfbcover Mark | Zuckerberg | 12345 | USA | zuck@gmail.com | 10092939929 | Blue`,
                threadID,
                messageID
            );
        }

        const [name, subname, sdt, address, email, uid, color] = details.map((d) =>
            encodeURIComponent(d)
        );

        const apiUrl = `http://87.106.100.187:6312/canvas/fbcover?name=${name}&subname=${subname}&sdt=${sdt}&address=${address}&email=${email}&uid=${uid}&color=${color}`;
        const filePath = path.join(__dirname, `fbcover_${Date.now()}.jpg`);

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
                console.error("❌ File write error:", err);
                api.setMessageReaction("❌", messageID, () => {}, true);
                api.sendMessage("❌ Failed to generate the Facebook cover.", threadID, messageID);
            });

        } catch (error) {
            console.error("❌ API Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            api.sendMessage("❌ An error occurred while generating the Facebook cover. Please try again.", threadID, messageID);
        }
    },
};
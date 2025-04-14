const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "mlbbhero",
    usePrefix: false,
    usage: "mlbbhero [heroName]",
    version: "1.0.1",
    admin: false,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage("⚠️ Please provide a Mobile Legends hero name.\nUsage: mlbbhero [heroName]", threadID, messageID);
        }

        const heroName = args.join(" ");
        const apiUrl = `https://kaiz-apis.gleeze.com/api/mlbb-heroes?name=${encodeURIComponent(heroName)}`;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const { data } = await axios.get(apiUrl);
            const hero = data.response;

            if (!hero) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage("❌ Hero not found. Please check the name and try again.", threadID, messageID);
            }

            const {
                heroName: name,
                alias,
                internalName,
                birthday,
                born,
                gender,
                species,
                affiliation,
                equipment,
                heroNumber,
                releaseDate,
                role,
                specialty,
                price,
                skillResource,
                damageType,
                basicAttackType,
                controlEffects,
                difficulty,
                thumbnail
            } = hero;

            const info = `
🎮 MLBB Hero Info
🏆 Name: ${name}
🗡 Alias: ${alias}
📛 Internal Name: ${internalName}
🎂 Birthday: ${birthday}
🏞 Born in: ${born}
🚻 Gender: ${gender}
🧬 Species: ${species}
🏛 Affiliation: ${affiliation}
🔱 Equipment: ${equipment}
#️⃣ Hero Number: ${heroNumber}
📅 Release Date: ${releaseDate}
🎭 Role: ${role}
🔥 Specialty: ${specialty}
💰 Price: ${price}
⚡ Skill Resource: ${skillResource}
⚔ Damage Type: ${damageType}
🛡 Basic Attack: ${basicAttackType}
🎮 Control Effects: ${controlEffects}
🎯 Difficulty: ${difficulty}
            `.trim();

            await api.sendMessage(info, threadID, messageID);

            if (thumbnail) {
                const cacheDir = path.join(__dirname, "cache");
                await fs.promises.mkdir(cacheDir, { recursive: true });

                const filePath = path.join(cacheDir, `mlbb_${Date.now()}.jpg`);
                const response = await axios.get(thumbnail, { responseType: "stream" });

                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);

                writer.on("finish", () => {
                    api.setMessageReaction("✅", messageID, () => {}, true);

                    api.sendMessage({
                        attachment: fs.createReadStream(filePath),
                    }, threadID, () => {
                        fs.unlink(filePath, (err) => {
                            if (err) console.error("Error deleting image file:", err);
                        });
                    }, messageID);
                });

                writer.on("error", (err) => {
                    console.error("Error saving image:", err);
                    api.setMessageReaction("❌", messageID, () => {}, true);
                    api.sendMessage("⚠️ Failed to download hero thumbnail.", threadID, messageID);
                });
            } else {
                api.setMessageReaction("✅", messageID, () => {}, true);
            }

        } catch (error) {
            console.error("❌ API Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            api.sendMessage("⚠️ An error occurred while fetching hero information.", threadID, messageID);
        }
    },
};
const axios = require("axios");

module.exports = {
    name: "weather",
    usePrefix: false,
    usage: "weather <location>",
    version: "1.0.0",
    admin: false,
    cooldown: 5,
    async execute({ api, event, args }) {
        const { threadID, messageID } = event;

        if (!args || args.length === 0) {
            return api.sendMessage("⚠️ Please provide a location.\n\nExample: weather Tokyo", threadID, messageID);
        }

        const location = args.join(" ");
        const apiUrl = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data["0"];

            if (!data || !data.location || !data.current) {
                return api.sendMessage("❌ Could not fetch weather info. Please try a different location.", threadID, messageID);
            }

            const {
                location: loc,
                current: {
                    temperature,
                    skytext,
                    humidity,
                    winddisplay,
                    feelslike,
                    date,
                    observationtime,
                    observationpoint,
                },
            } = data;

            const msg = `
📍 Location: ${loc.name}
🌡️ Temperature: ${temperature}°C
⛅ Sky: ${skytext}
💧 Humidity: ${humidity}%
🌬️ Wind: ${winddisplay}
🌡️ Feels Like: ${feelslike}°C
📅 Date: ${date}
⏰ Time: ${observationtime}
📌 Observation Point: ${observationpoint}
            `.trim();

            api.sendMessage(msg, threadID, messageID);
        } catch (error) {
            console.error("Weather API Error:", error);
            api.sendMessage("❌ Error retrieving weather data. Please try again later.", threadID, messageID);
        }
    }
};
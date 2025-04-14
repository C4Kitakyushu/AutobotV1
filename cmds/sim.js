const axios = require("axios");

module.exports = {
  name: "sim",
  version: "1.0.0",
  usePrefix: false,
  usage: "sim <message>",
  description: "Talk to SimSimi",
  admin: false,
  cooldown: 0,

  execute: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    if (!args.length) {
      return api.sendMessage("Bakit ba?? kupal kaba?.", threadID, messageID);
    }

    const content = encodeURIComponent(args.join(" "));

    try {
      const res = await axios.get(`https://simsimi-api-pro.onrender.com/sim?query=${content}`);
      if (res.data.error) {
        return api.sendMessage(`❌ Error: ${res.data.error}`, threadID, messageID);
      }

      return api.sendMessage(res.data.respond, threadID, messageID);
    } catch (error) {
      console.error("Sim command error:", error);
      return api.sendMessage("❌ An error occurred while trying to talk to Sim.", threadID, messageID);
    }
  },
};
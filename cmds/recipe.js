const axios = require("axios");

module.exports = {
  name: "recipe",
  usePrefix: false,
  usage: "recipe <ingredient>",
  description: "Get a detailed recipe based on the ingredient you provide.",
  version: "1.0.0",
  admin: false,
  cooldown: 5,

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    const ingredient = args.join(" ");
    if (!ingredient) {
      return send("⚠️ Please provide an ingredient.\n\nExample: recipe chicken");
    }

    send(`🔍 Searching for a recipe using "${ingredient}"...`);

    const apiUrl = `https://kaiz-apis.gleeze.com/api/recipe?ingredients=${encodeURIComponent(ingredient)}`;

    try {
      const res = await axios.get(apiUrl);
      const data = res.data;

      if (!data?.recipe) {
        return send("❌ No recipe found for that ingredient.");
      }

      send(data.recipe);
    } catch (error) {
      console.error("Recipe API Error:", error.message);
      send("❌ Failed to fetch recipe. Please try again later.");
    }
  }
};
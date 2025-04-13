const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "screenshot",
  usePrefix: false,
  usage: "screenshot <url>",
  description: "Take a screenshot of a given website URL.",
  version: "1.0.0",
  admin: false,
  cooldown: 5,

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    if (!args.length) {
      return send(
        `⚠️ Please provide a URL to take a screenshot.\n\nExample:\nscreenshot https://example.com`
      );
    }

    const url = args.join(" ").trim();
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://kaiz-apis.gleeze.com/api/screenshot?url=${encodedUrl}`;
    const filePath = path.join(__dirname, `screenshot_${Date.now()}.jpg`);

    try {
      send(`⏳ Taking screenshot of: ${url}`);

      const response = await axios.get(apiUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: `✅ Screenshot of: ${url}`,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          () => fs.unlinkSync(filePath),
          messageID
        );
      });

      writer.on("error", (error) => {
        console.error("File write error:", error);
        send("❌ Failed to save the screenshot.");
      });
    } catch (error) {
      console.error("Error taking screenshot:", error);
      send("❌ An error occurred while taking the screenshot. Please check the URL and try again.");
    }
  },
};
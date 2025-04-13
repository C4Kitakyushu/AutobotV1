const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: "pastecode",
  usePrefix: false,
  usage: "pastecode [get <pasteID> ...] or reply with code, or pastecode <filename>",
  description: "Upload files or code snippets to paste.c-net.org and send the link.",
  version: "1.0.0",
  admin: false,
  cooldown: 5,

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    // If the user uses the "get" subcommand, retrieve paste contents.
    if (args[0] && args[0].toLowerCase() === "get") {
      if (args.length < 2) {
        return api.sendMessage("⚠️ Please provide the paste IDs to retrieve!", threadID, messageID);
      }
      for (const pasteID of args.slice(1)) {
        try {
          const url = `https://paste.c-net.org/${pasteID}`;
          const response = await axios.get(url);
          await api.sendMessage(
            `Retrieved content from ${url}:\n\n${response.data}`,
            threadID,
            messageID
          );
        } catch (error) {
          console.error(error);
          await api.sendMessage(`❌ An error occurred while retrieving ${pasteID}`, threadID, messageID);
        }
      }
      return;
    }

    // If the message is a reply, use its body as the code snippet.
    if (event.messageReply) {
      const code = event.messageReply.body;
      try {
        const response = await axios.post("https://paste.c-net.org/", code, {
          headers: { "X-FileName": "replied-code.txt" }
        });
        const pasteUrl = response.data;
        return api.sendMessage(`✅ Code uploaded to: ${pasteUrl}`, threadID, messageID);
      } catch (error) {
        console.error(error);
        return api.sendMessage("❌ An error occurred while uploading the code!", threadID, messageID);
      }
    } else {
      // Otherwise, expect a filename as parameter.
      if (!args.length) {
        return api.sendMessage("⚠️ Please provide a filename!", threadID, messageID);
      }

      const fileName = args[0];
      const filePathWithoutExtension = path.join(__dirname, "..", "cmds", fileName);
      const filePathWithExtension = path.join(__dirname, "..", "cmds", fileName + ".js");

      let filePath = "";
      if (fs.existsSync(filePathWithoutExtension)) {
        filePath = filePathWithoutExtension;
      } else if (fs.existsSync(filePathWithExtension)) {
        filePath = filePathWithExtension;
      } else {
        return api.sendMessage("❌ File not found!", threadID, messageID);
      }

      try {
        const code = await fs.readFile(filePath, "utf8");
        const response = await axios.post("https://paste.c-net.org/", code, {
          headers: { "X-FileName": path.basename(filePath) }
        });
        const pasteUrl = response.data;
        return api.sendMessage(`✅ File uploaded to: ${pasteUrl}`, threadID, messageID);
      } catch (error) {
        console.error(error);
        return api.sendMessage("❌ An error occurred while uploading the file!", threadID, messageID);
      }
    }
  },
};
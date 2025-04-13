const axios = require("axios");

module.exports = {
  name: "pastecode",
  usePrefix: false,
  usage: "pastecode [get <pasteID> ...] or reply with code or pastecode <code>",
  description: "Upload code to paste.c-net.org and get a shareable link.",
  version: "1.0.0",
  admin: false,
  cooldown: 5,

  async execute({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    // GET mode: retrieve paste by ID
    if (args[0] && args[0].toLowerCase() === "get") {
      if (args.length < 2) return send("⚠️ Please provide paste ID(s) to retrieve!");

      for (const pasteID of args.slice(1)) {
        const url = `https://paste.c-net.org/${pasteID}`;
        try {
          const res = await axios.get(url);
          send(`📥 Retrieved from ${url}:\n\n${res.data}`);
        } catch (err) {
          console.error(err);
          send(`❌ Error retrieving paste: ${pasteID}`);
        }
      }
      return;
    }

    // Upload code from replied message
    if (messageReply?.body) {
      try {
        const res = await axios.post("https://paste.c-net.org/", messageReply.body, {
          headers: { "X-FileName": "replied-code.txt" }
        });
        return send(`✅ Code uploaded: ${res.data}`);
      } catch (err) {
        console.error(err);
        return send("❌ Failed to upload replied code.");
      }
    }

    // Upload raw code directly from args
    if (!args.length) return send("⚠️ Please provide code to upload or reply to a message.");

    const rawCode = args.join(" ");
    try {
      const res = await axios.post("https://paste.c-net.org/", rawCode, {
        headers: { "X-FileName": "pasted-code.txt" }
      });
      return send(`✅ Code uploaded: ${res.data}`);
    } catch (err) {
      console.error(err);
      return send("❌ Failed to upload code.");
    }
  }
};
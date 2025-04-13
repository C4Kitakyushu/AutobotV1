const axios = require("axios");

const serverUrls = {
  server1: "https://serverpota-3.onrender.com",
  server2: "https://serverpota-2.onrender.com",
  server3: "https://serverpota-1.onrender.com",
};

module.exports = {
  name: "fbshare",
  aliases: ["autoboost"],
  usePrefix: false,
  usage: "fbshare fbstate | post_url | amount | interval | server1/server2/server3",
  description: "Boost Facebook post shares using a specified server.",
  version: "1.0.1",
  admin: true,
  cooldown: 5,

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) {
      return api.sendMessage(
        "❗ Usage:\nfbshare fbstate | post_url | amount | interval | server1/server2/server3",
        threadID,
        messageID
      );
    }

    const [cookie, url, amount, interval, serverKey] = args.join(" ").split("|").map(i => i.trim());

    if (!cookie || !url || !amount || !interval || !serverKey) {
      return api.sendMessage(
        "❌ Missing input.\nUsage:\nfbshare fbstate | post_url | amount | interval | server1/server2/server3",
        threadID,
        messageID
      );
    }

    if (!serverUrls[serverKey]) {
      return api.sendMessage(
        "❌ Invalid server. Choose one of: server1, server2, server3",
        threadID,
        messageID
      );
    }

    api.sendMessage(
      `⏳ Boosting post...\n\n` +
      `🔗 Post: ${url}\n` +
      `📈 Amount: ${amount}\n` +
      `⏱️ Interval: ${interval}s\n` +
      `🌐 Server: ${serverKey}`,
      threadID,
      messageID
    );

    try {
      const res = await axios.post(
        `${serverUrls[serverKey]}/api/submit`,
        {
          cookie,
          url,
          amount: parseInt(amount),
          interval: parseInt(interval),
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = res.data;

      if (data.status === 200) {
        return api.sendMessage(
          `✅ Boost submitted!\n${data.message || "Your request has been sent."}`,
          threadID,
          messageID
        );
      } else {
        return api.sendMessage(
          `⚠️ Failed to boost.\n${data.message || "Unknown error."}`,
          threadID,
          messageID
        );
      }
    } catch (err) {
      console.error("Boost error:", err.response?.data || err.message);
      return api.sendMessage(
        "❌ Error connecting to the server. Please check your input or try again later.",
        threadID,
        messageID
      );
    }
  }
};
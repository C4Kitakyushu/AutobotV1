const axios = require("axios");

const serverUrls = {
  server1: "https://serverpota-3.onrender.com",
  server2: "https://serverpota-2.onrender.com",
  server3: "https://serverpota-1.onrender.com",
};

module.exports = {
  name: "fbshare",
  aliases: ["autoboost"],
  usage: "fbshare fbstate | post_url | amount | interval | server1/server2/server3",
  description: "Boost Facebook post shares using a specified server.",
  version: "1.0.1",
  cooldowns: 5,
  hasPrefix: true,
  admin: true,
  credits: "Developer",

  execute: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    const input = args.join(" ").split("|").map((i) => i.trim());
    const [cookie, url, amount, interval, serverKey] = input;

    // Validation
    if (input.length < 5) {
      return send(
        "❗ Usage:\nfbshare fbstate | post_url | amount | interval | server1/server2/server3"
      );
    }

    if (!serverUrls[serverKey]) {
      return send("❌ Invalid server. Choose: server1, server2, server3");
    }

    // Start boosting
    send(
      `⏳ Submitting boost...\n\n` +
      `🔗 Post: ${url}\n` +
      `📈 Amount: ${amount}\n` +
      `⏱️ Interval: ${interval}s\n` +
      `🌐 Server: ${serverKey}`
    );

    const result = await handleBoost({
      cookie,
      url,
      amount: parseInt(amount),
      interval: parseInt(interval),
      server: serverKey,
    });

    // Handle response
    if (result.success) {
      send(`✅ Boost submitted!\n${result.message}`);
    } else {
      send(`❌ Failed to boost.\n${result.message}`);
    }
  },
};

// Helper function to handle the boost
async function handleBoost({ cookie, url, amount, interval, server }) {
  try {
    const response = await axios.post(
      `${serverUrls[server]}/api/submit`,
      {
        cookie,
        url,
        amount,
        interval,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = response.data;

    if (data.status === 200) {
      return {
        success: true,
        message: data.message || "Your request has been processed.",
      };
    } else {
      return {
        success: false,
        message: data.message || "Server responded with an error.",
      };
    }
  } catch (error) {
    console.error("Boost Error:", error.response?.data || error.message);
    return {
      success: false,
      message: "Failed to connect to the server. Please try again.",
    };
  }
}

const os = require("os");
const pidusage = require("pidusage");

module.exports = {
  name: "uptime",
  version: "1.0.2",
  usePrefix: false,
  usage: "uptime",
  description: "Displays bot uptime and system information.",
  admin: false,
  cooldown: 5,

  execute: async ({ api, event }) => {
    const { threadID, messageID } = event;

    const byte2mb = (bytes) => {
      const units = ["Bytes", "KB", "MB", "GB", "TB"];
      let l = 0,
        n = parseInt(bytes, 10) || 0;
      while (n >= 1024 && ++l) n = n / 1024;
      return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
    };

    const getUptime = () => {
      const seconds = process.uptime();
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${days} day(s), ${hours} hour(s), ${minutes} minute(s), ${secs} second(s)`;
    };

    try {
      const usage = await pidusage(process.pid);
      const ping = Date.now();

      const info = `
⏱ Bot Uptime: ${getUptime()}
❖ CPU Usage: ${usage.cpu.toFixed(1)}%
❖ RAM Usage: ${byte2mb(usage.memory)}
❖ CPU Cores: ${os.cpus().length}
❖ Ping: ${Date.now() - ping}ms
❖ OS Platform: ${os.platform()}
❖ CPU Architecture: ${os.arch()}
      `.trim();

      return api.sendMessage(info, threadID, messageID);
    } catch (err) {
      console.error("❌ Uptime command error:", err);
      return api.sendMessage("❌ Failed to fetch uptime info.", threadID, messageID);
    }
  },
};
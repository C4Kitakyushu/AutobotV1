const axios = require("axios");

const fontMapping = {
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
  'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
  'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
  'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴',
  'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻',
  'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂',
  'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇'
};

function convertToBold(text) {
  return text.replace(/(?:\*\*(.*?)\*\*|## (.*?)|### (.*?))/g, (match, boldText, h2Text, h3Text) => {
    const targetText = boldText || h2Text || h3Text;
    return [...targetText].map(char => fontMapping[char] || char).join('');
  });
}

module.exports = {
  name: "meta",
  usePrefix: false,
  usage: "meta [question]",
  description: "Ask a question to Meta AI",
  version: "1.0.0",
  cooldown: 5,

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage("❌ Please provide your question.\n\nUsage: meta <your question>", threadID, messageID);
    }

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const apiUrl = `https://markdevs-last-api-s7d0.onrender.com/api/meta?q=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiUrl);
      const text = convertToBold(res.data.response);

      const metaReply = `∞ | 𝗠𝗲𝘁𝗮 𝗔𝗶\n━━━━━━━━━━━━\n${text}\n━━━━━━━━━━━━`;

      await api.sendMessage(metaReply, threadID, messageID);
      api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (error) {
      console.error("Meta AI error:", error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ Sorry, there was an error processing your request.", threadID, messageID);
    }
  }
};
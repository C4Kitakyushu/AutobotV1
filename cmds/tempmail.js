const axios = require("axios");

module.exports = {
    name: "tempmail",
    usePrefix: false,
    usage: "tempmail gen | tempmail inbox <token>",
    version: "1.0",
    admin: false,
    cooldown: 5,
    async execute({ api, event, args }) {
        const { threadID, messageID } = event;
        
        if (!args || args.length === 0) {
            return api.sendMessage("❗ Usage: tempmail gen | tempmail inbox <token>", threadID, messageID);
        }
        
        const subcommand = args[0].toLowerCase();
        
        // Handle "gen" subcommand
        if (subcommand === "gen") {
            try {
                const { data } = await axios.get("https://kaiz-apis.gleeze.com/api/tempmail-create");
                
                if (!data?.token || !data?.address) {
                    return api.sendMessage("⚠️ Failed to generate email. Please try again later.", threadID, messageID);
                }
                
                const email = data.address;
                const token = data.token;
                const message =
                    `📧 Generated Email: ${email}\n\n` +
                    `🔑 COPY YOUR TOKEN:\n${token}\n\n` +
                    `Check inbox with:\n` +
                    `tempmail inbox ${token}`;
                    
                return api.sendMessage(message, threadID, messageID);
            } catch (error) {
                console.error("Error generating tempmail:", error);
                return api.sendMessage("⚠️ An error occurred while generating the email.", threadID, messageID);
            }
        }
        
        // Handle "inbox" subcommand
        if (subcommand === "inbox" && args[1]) {
            const token = args[1];
            try {
                const { data } = await axios.get(`https://kaiz-apis.gleeze.com/api/tempmail-inbox?token=${token}`);
                const inbox = data.emails || [];
                
                if (inbox.length === 0) {
                    return api.sendMessage("📭 No messages found in your inbox.", threadID, messageID);
                }
                
                const mail = inbox[0];
                const from = mail.from || "Unknown Sender";
                const subject = mail.subject || "No Subject";
                const date = mail.date || "Unknown Date";
                const body = mail.body || "No content available.";
                
                const inboxMessage =
                    `🛡️ TOKEN VERIFIED ✅\n\n` +
                    `📩 From: ${from}\n` +
                    `🔖 Subject: ${subject}\n` +
                    `━━━━━━━━━━━━━━━━`;
                    
                return api.sendMessage(inboxMessage, threadID, messageID);
            } catch (error) {
                console.error("Error fetching inbox:", error);
                return api.sendMessage("⚠️ An error occurred while fetching the inbox.", threadID, messageID);
            }
        }
        
        // Invalid usage
        return api.sendMessage("❗ Usage: tempmail gen | tempmail inbox <token>", threadID, messageID);
    }
};
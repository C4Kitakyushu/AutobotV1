module.exports = {
    name: "uid",
    aliases: ["userid", "getid"],
    usePrefix: false,
    usage: "uid [id|reply|group|all]",
    version: "1.0.0",
    admin: false,
    cooldown: 3,

    execute: async ({ api, event, args }) => {
        const { threadID, senderID, type, messageReply, participantIDs, mentions } = event;

        let id = senderID;
        const input = args.join(" ");

        // If user supplied a Facebook profile URL
        if (input.startsWith("https://")) {
            try {
                const uid = await api.getUID(input);
                return api.shareContact(uid, uid, threadID);
            } catch {
                return api.sendMessage("❌ Invalid URL or unable to retrieve UID.", threadID);
            }
        }

        // If reply to a message
        if (type === "message_reply") {
            id = messageReply.senderID;
        }

        // If mention
        if (input.includes("@")) {
            const mentionIDs = Object.keys(mentions);
            if (mentionIDs.length) id = mentionIDs[0];
        }

        // List all participant IDs
        if (input.toLowerCase() === "all") {
            const list = participantIDs.map((pid, i) => `${i + 1}. ${pid}`).join("\n");
            return api.sendMessage(list, threadID);
        }

        // Group ID
        if (input.toLowerCase() === "group" || input === "-g") {
            return api.sendMessage(threadID, threadID);
        }

        // Default: share contact of resolved ID
        return api.shareContact(id, id, threadID);
    },
};
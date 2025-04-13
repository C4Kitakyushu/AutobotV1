module.exports = {
    name: "adduser",
    aliases: ["add"],
    usePrefix: false,
    usage: "adduser <uid>",
    description: "Add a user to the group using their UID.",
    version: "1.0.1",
    admin: true,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        const botID = api.getCurrentUserID();
        const send = (msg) => api.sendMessage(msg, threadID, messageID);

        if (!args[0]) {
            return send("⚠️ Please enter a user ID or profile link.");
        }

        const { participantIDs, approvalMode, adminIDs } = await api.getThreadInfo(threadID);
        const members = participantIDs.map(id => parseInt(id));
        const admins = adminIDs.map(admin => parseInt(admin.id));

        // Handle UID directly
        if (!isNaN(args[0])) {
            return addToGroup(args[0]);
        }

        // Handle profile link
        try {
            const [id, name, failed] = await getUID(args[0], api);
            if (failed && id) return send(id);
            if (failed && !id) return send("❌ User ID not found.");
            return addToGroup(id, name || "Facebook user");
        } catch (err) {
            return send(`❌ ${err.name}: ${err.message}`);
        }

        async function addToGroup(id, name = "User") {
            id = parseInt(id);
            if (members.includes(id)) {
                return send(`ℹ️ ${name} is already in the group.`);
            }

            try {
                await api.addUserToGroup(id, threadID);
                if (approvalMode && !admins.includes(botID)) {
                    return send(`✅ Added ${name} to the approved list.`);
                } else {
                    return send(`✅ Added ${name} to the group.`);
                }
            } catch {
                return send(`❌ Unable to add ${name} to the group.`);
            }
        }
    },
};
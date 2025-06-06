const fs = require("fs");
const path = require("path");
const os = require("os");
const util = require("util");

const unlinkAsync = util.promisify(fs.unlink);
const historyFilePath = path.resolve(__dirname, '..', 'data', 'history.json');

let historyData = [];

try {
    historyData = require(historyFilePath);
} catch (err) {
    console.error("❌ Failed to load history.json:", err);
}

module.exports = {
    name: "session",
    aliases: ["listusers", "listbots", "activeusers", "list-users", "bot-users", "active-users", "active-bots", "list-bot", "botstatus"],
    description: "List all active bot sessions and their uptime information.",
    usage: "active-session [logout]",
    role: 2,
    cooldown: 0,
    admin: true,
    usePrefix: false,

    execute: async ({ api, event, args }) => {
        const OWNER_ID = "61576665130177";
        const { threadID, messageID, senderID } = event;

        if (senderID !== OWNER_ID) {
            return api.sendMessage("⚠️ This command is only for the AUTOBOT owner.", threadID, messageID);
        }

        if (args[0] && args[0].toLowerCase() === "logout") {
            return await handleLogout(api, event);
        }

        if (!Array.isArray(historyData) || historyData.length === 0) {
            return api.sendMessage("📭 No users found in the history session data.", threadID, messageID);
        }

        const currentUserId = api.getCurrentUserID();
        const mainBotIndex = historyData.findIndex(user => user.userid === currentUserId);

        if (mainBotIndex === -1) {
            return api.sendMessage("❌ Main bot not found in history.json.", threadID, messageID);
        }

        const mainBot = historyData[mainBotIndex];
        const mainBotName = await getUserName(api, currentUserId);
        const mainBotOS = getOSInfo();
        const mainBotUptime = formatUptime(mainBot.time);

        const otherUsers = historyData.filter(u => u.userid !== currentUserId);
        const userList = await Promise.all(otherUsers.map(async (user, idx) => {
            const name = await getUserName(api, user.userid);
            const uptime = formatUptime(user.time);
            return `[ ${idx + 1} ]\n𝗡𝗔𝗠𝗘: ${name}\n𝗜𝗗: ${user.userid}\n𝗨𝗣𝗧𝗜𝗠𝗘: ${uptime}`;
        }));

        const response = `𝗠𝗔𝗜𝗡𝗕𝗢𝗧: ${mainBotName}\n𝗜𝗗: ${currentUserId}\n𝗕𝗢𝗧 𝗥𝗨𝗡𝗡𝗜𝗡𝗚: ${mainBotUptime}\n\n| SYSTEM |\n\n${mainBotOS}\n\n𝗢𝗧𝗛𝗘𝗥 𝗦𝗘𝗦𝗦𝗜𝗢𝗡𝗦 [${userList.length}]\n\n${userList.join('\n')}\n\n📝 To logout, type: active-session logout`;

        api.sendMessage(response, threadID, messageID);
    }
};

async function handleLogout(api, event) {
    const { threadID, messageID } = event;
    const currentUserId = api.getCurrentUserID();
    const sessionFile = path.resolve(__dirname, '..', 'data', 'session', `${currentUserId}.json`);

    try {
        await unlinkAsync(sessionFile);
        api.sendMessage("✅ Bot has been logged out successfully.", threadID, messageID, () => process.exit(1));
    } catch (err) {
        console.error("❌ Failed to delete session file:", err);
        api.sendMessage("❌ Logout failed. Please try again.", threadID, messageID);
    }
}

async function getUserName(api, userID) {
    try {
        const info = await api.getUserInfo(userID);
        return info?.[userID]?.name || "Unknown";
    } catch {
        return "Unknown";
    }
}

function getOSInfo() {
    const cpu = os.cpus()[0]?.model || "Unknown CPU";
    const cores = os.cpus().length;
    const total = formatBytes(os.totalmem());
    const free = formatBytes(os.freemem());

    return `OS: ${os.type()} ${os.release()} ${os.arch()} (${os.platform()})\nCPU: ${cpu}\nCores: ${cores}\nTotal Memory: ${total}\nFree Memory: ${free}`;
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d} days ${h} hours ${m} minutes ${s} seconds`;
}

function formatBytes(bytes) {
    if (bytes === 0) return "0 Byte";
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
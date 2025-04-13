const cron = require("node-cron");

module.exports = {
  name: "acc",
  aliases: [],
  usage: "acc [approve <UID>]",
  description: "Accept or check pending friend requests.",
  version: "1.0.0",
  cooldown: 5,
  admin: true,

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    const handleApprove = async (targetUID) => {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
        doc_id: "3147613905362928",
        variables: JSON.stringify({
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            friend_requester_id: targetUID,
            client_mutation_id: Math.round(Math.random() * 19).toString(),
          },
          scale: 3,
          refresh_num: 0,
        }),
      };

      const success = [];
      const failed = [];

      try {
        const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        const result = JSON.parse(res);
        if (result.errors) failed.push(targetUID);
        else success.push(targetUID);
      } catch (e) {
        failed.push(targetUID);
      }

      return { success, failed };
    };

    if (args[0] === "approve") {
      if (args.length !== 2 || isNaN(args[1])) {
        return send("❌ Invalid syntax. Use: acc approve <UID>");
      }

      const { success, failed } = await handleApprove(args[1]);

      if (success.length > 0) send(`✅ Approved friend request for UID: ${success.join(", ")}`);
      if (failed.length > 0) send(`❌ Failed to approve friend request for UID: ${failed.join(", ")}`);
      return;
    }

    await checkFriendRequests(api, threadID, messageID);
  },
};

// Scheduled check every hour (adjust as needed)
cron.schedule("0 * * * *", async () => {
  const api = global.api;
  const threadID = "YOUR_THREAD_ID"; // Replace with actual thread ID
  const messageID = null;

  if (api) {
    await checkFriendRequests(api, threadID, messageID);
  }
});

async function checkFriendRequests(api, threadID, messageID) {
  const send = (msg) => api.sendMessage(msg, threadID, messageID);

  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } }),
  };

  try {
    const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
    const requests = JSON.parse(res).data.viewer.friending_possibilities.edges;

    if (!requests.length) return send("✅ No pending friend requests found.");

    let msg = "📥 Pending Friend Requests:\n";
    let count = 0;

    for (const user of requests) {
      count++;
      const date = new Date(user.time * 1000);
      msg += `\n${count}. Name: ${user.node.name}\nID: ${user.node.id}\nUrl: ${user.node.url.replace("www.facebook", "fb")}\nTime: ${date.toLocaleString()}\n`;
    }

    msg += `\nTo approve a request, use: acc approve <UID>`;
    send(msg);

  } catch (error) {
    console.error("Friend check error:", error);
    send("❌ Error fetching friend request list.");
  }
}
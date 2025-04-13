const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const login = require('ws3-fca');
const scheduleTasks = require('./custom');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Serve the generated image
app.get("/api/image", (req, res) => {
    const imagePath = path.join(__dirname, "./api/generated-image.png");
    res.sendFile(imagePath, (err) => {
        if (err) {
            res.status(404).json({ error: "Image not found" });
        }
    });
});

const loadConfig = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Missing ${filePath}! Make sure it exists.`);
            process.exit(1);
        }
        return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
        console.error(`❌ Error loading ${filePath}:`, error);
        process.exit(1);
    }
};

const config = loadConfig("./config.json");
const botPrefix = config.prefix || "!";

global.events = new Map();
global.commands = new Map();
global.activeBots = new Map();
const apiRoutes = [];

const loadEvents = () => {
    try {
        const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`./events/${file}`);
            if (event.name && event.execute) {
                global.events.set(event.name, event);
                console.log(`✅ Loaded event: ${event.name}`);
            }
        }
    } catch (error) {
        console.error("❌ Error loading events:", error);
    }
};

const loadCommands = () => {
    try {
        const commandFiles = fs.readdirSync('./cmds').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./cmds/${file}`);
            if (command.name && command.execute) {
                global.commands.set(command.name, command);
                console.log(`✅ Loaded command: ${command.name}`);
            }
        }
    } catch (error) {
        console.error("❌ Error loading commands:", error);
    }
};

const loadAPIs = () => {
    try {
        const apiPath = path.join(__dirname, 'api');
        if (!fs.existsSync(apiPath)) return console.warn("⚠️ No 'api/' directory found. Skipping API loading.");

        fs.readdirSync(apiPath).forEach(file => {
            if (file.endsWith('.js')) {
                try {
                    const apiModule = require(`./api/${file}`);
                    if (!apiModule.name || !apiModule.execute) {
                        throw new Error(`Missing required properties in ${file}`);
                    }

                    const route = apiModule.route || `/api/${apiModule.name}`;
                    const method = apiModule.method?.toLowerCase() || 'get';

                    app[method](route, async (req, res) => {
                        try {
                            await apiModule.execute({ req, res });
                        } catch (error) {
                            console.error(`❌ Error in API '${apiModule.name}':`, error);
                            res.status(500).json({ error: "Internal Server Error" });
                        }
                    });

                    apiRoutes.push({
                        name: apiModule.name,
                        category: apiModule.category || "uncategorized",
                        route: route,
                        method: method.toUpperCase(),
                        usage: apiModule.usage || "No usage information provided."
                    });

                    console.log(`✅ Loaded API: ${apiModule.name} (Route: ${route}, Method: ${method.toUpperCase()})`);
                } catch (error) {
                    console.error(`❌ Error loading API ${file}: ${error.message}`);
                }
            }
        });
    } catch (error) {
        console.error("❌ Error loading APIs:", error);
    }
};

app.get('/api/list', (req, res) => {
    res.json(apiRoutes);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const loadBots = () => {
    try {
        if (!fs.existsSync("./appState.json")) return {};
        return JSON.parse(fs.readFileSync("./appState.json"));
    } catch (error) {
        console.error("❌ Error loading appState.json:", error);
        return {};
    }
};

const saveBots = (bots) => {
    try {
        fs.writeFileSync("./appState.json", JSON.stringify(bots, null, 2));
    } catch (error) {
        console.error("❌ Error saving appState.json:", error);
    }
};

const startBot = async (botID, botData) => {
    try {
        login({ appState: botData.appState }, (err, api) => {
            if (err) {
                console.error(`❌ Bot ${botID} login failed:`, err.error || err);
                return;
            }

            api.setOptions(config.option);
            global.activeBots.set(botID, {
                api,
                ownerUid: botData.ownerUid || null,
                selectedCommands: botData.selectedCommands || []
            });

            console.log(`🤖 Your bot ${botID} is now actived!`);

            // ✅ Notify owner if available
            if (botData.ownerUid) {
                api.sendMessage(
                    `✅ Your bot (ID: ${botID}) is now online and running.`,
                    botData.ownerUid,
                    (err) => {
                        if (err) {
                            console.error(`❌ Failed to message owner ${botData.ownerUid} for bot ${botID}:`, err);
                        } else {
                            console.log(`✅ Notified owner ${botData.ownerUid} that bot ${botID} is online`);
                        }
                    }
                );
            }

            api.listenMqtt(async (err, event) => {
                if (err) return console.error(`❌ Error in bot ${botID}:`, err);

                if (global.events.has(event.type)) {
                    try {
                        await global.events.get(event.type).execute({ api, event });
                    } catch (error) {
                        console.error(`❌ Error in event '${event.type}' for bot ${botID}:`, error);
                    }
                }

                if (event.body) {
                    const args = event.body.trim().split(/ +/);
                    const commandName = args.shift().toLowerCase();
                    const currentBot = global.activeBots.get(botID);

                    for (const [name, command] of global.commands) {
                        const allowed =
                            command.admin ||
                            currentBot.selectedCommands.length === 0 ||
                            currentBot.selectedCommands.includes(name);

                        if (allowed &&
                            ((command.usePrefix && event.body.startsWith(botPrefix) && commandName === name) ||
                            (!command.usePrefix && commandName === name))) {
                            try {
                                await command.execute({ api, event, args, ownerUid: currentBot.ownerUid });
                            } catch (error) {
                                console.error(`❌ Error executing command '${name}' for bot ${botID}:`, error);
                            }
                            return;
                        }
                    }
                }
            });

        });
    } catch (error) {
        console.error(`❌ Bot ${botID} crashed. Removing...`, error);
    }
};

const startAllBots = () => {
    const bots = loadBots();
    Object.entries(bots).forEach(([botID, botData]) => {
        startBot(botID, botData);
    });
};

app.post('/api/add-bot', (req, res) => {
    const { appState, ownerUid, selectedCommands } = req.body;
    if (!appState) {
        return res.status(400).json({ error: "appState is required" });
    }

    const botID = `${Date.now()}`;
    const bots = loadBots();

    const adminCommands = Array.from(global.commands.values())
        .filter(cmd => cmd.admin)
        .map(cmd => cmd.name);

    bots[botID] = {
        appState,
        ownerUid: ownerUid || null,
        selectedCommands: [...new Set([...(selectedCommands || []), ...adminCommands])]
    };

    saveBots(bots);
    startBot(botID, bots[botID]);

    res.json({ success: true, botID });
});

app.get('/api/bots', (req, res) => {
    const bots = loadBots();
    res.json(Object.keys(bots).map(botID => ({ botID })));
});

app.get('/api/available-cmds', (req, res) => {
    const cmds = Array.from(global.commands.values()).map(cmd => ({
        name: cmd.name,
        usage: cmd.usage,
        admin: cmd.admin || false
    }));
    res.json(cmds);
});

loadEvents();
loadCommands();
loadAPIs();
startAllBots();

app.listen(PORT, () => {
    console.log(`🌐 API & Web Server running at http://localhost:${PORT}`);
});

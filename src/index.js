require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { REST, Routes } = require('@discordjs/rest');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const { startDashboard } = require('./dashboard/server');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
  allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
});

client.commands = new Collection();
client.cooldowns = new Collection();

// Load commands
const cmdDir = path.join(__dirname, 'commands');
const commands = [];

for (const file of fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'))) {
  try {
    const cmd = require(path.join(cmdDir, file));
    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
      commands.push(cmd.data.toJSON());
    }
  } catch (e) { logger.error(`Command load error ${file}: ${e.message}`); }
}

// Load events
const evtDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(evtDir).filter(f => f.endsWith('.js'))) {
  const evt = require(path.join(evtDir, file));
  evt.once
    ? client.once(evt.name, (...a) => evt.execute(...a, client))
    : client.on(evt.name, (...a) => evt.execute(...a, client));
}

// Auto-deploy commands
async function deployCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    logger.info(`📡 Deploying ${commands.length} commands...`);
    
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    
    logger.info(`✅ Successfully deployed ${commands.length} slash commands!`);
    commands.forEach(c => logger.info(`  /${c.name}`));
  } catch (e) {
    logger.error('Command deployment failed: ' + e.message);
  }
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/desbot');
    logger.info('MongoDB connected');
  } catch (e) {
    logger.warn('MongoDB failed, continuing without DB: ' + e.message);
  }

  // Deploy commands before logging in
  await deployCommands();

  await client.login(process.env.DISCORD_TOKEN);
  startDashboard(client);
}

main().catch(e => { logger.error(e); process.exit(1); });

module.exports = client;

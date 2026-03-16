require('dotenv').config();
const { REST, Routes } = require('@discordjs/rest');
const fs = require('fs');
const path = require('path');

const commands = [];
const cmdDir = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'))) {
  try {
    const cmd = require(path.join(cmdDir, file));
    if (cmd.data) commands.push(cmd.data.toJSON());
  } catch (e) { console.error(`Failed ${file}: ${e.message}`); }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`📡 Deploying ${commands.length} commands globally...`);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log(`✅ Successfully deployed ${commands.length} slash commands!`);
    commands.forEach(c => console.log(`  /${c.name}`));
  } catch (e) {
    console.error('Deploy failed:', e);
  }
})();

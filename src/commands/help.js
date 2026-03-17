const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help').setDescription('📖 Command list and help')
    .addStringOption(o => o.setName('command').setDescription('Specific command to get help for')),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const cmd = interaction.options.getString('command');

    if (cmd) {
      const c = client.commands.get(cmd);
      if (!c) return interaction.editReply({ embeds: [E.error('Not Found', `Command \`${cmd}\` not found.`)] });
      await interaction.editReply({ embeds: [E.gold(`/${c.data.name}`, c.data.description, [
        { name: '📋 Subcommands', value: c.data.options?.filter(o => o.type === 1).map(o => `\`${o.name}\` — ${o.description}`).join('\n') || 'No subcommands.', inline: false },
      ])] });
      return;
    }

    await interaction.editReply({ embeds: [E.gold('📖 DeS Bot™ Commands', 'Your complete DOT Esport bot guide', [
      { name: '🛡️ /mod', value: 'ban, unban, kick, mute, unmute, warn, warnings, clearwarns, purge, slowmode, lock, unlock, nick, cases', inline: false },
      { name: '🏆 /tournament', value: 'create, list, info, join, leave, start, end, cancel, teams', inline: false },
      { name: '🎫 /ticket', value: 'setup, panel, create, close, claim, unclaim, add, remove, priority, list, transcript', inline: false },
      { name: '📊 /stats', value: 'view, leaderboard, rank, compare', inline: false },
      { name: '⚙️ /setup', value: 'wizard, logs, automod, antiraid, antinuke, leveling, autorole, view, reset', inline: false },
      { name: '👋 /welcome', value: 'setup, disable, test, farewell, farewell-disable, farewell-test, config', inline: false },
      { name: '🎭 /role', value: 'add, remove, create, delete, color, list, members', inline: false },
      { name: '🔧 /util', value: 'serverinfo, userinfo, avatar, banner, ping, botinfo, roleinfo, channelinfo, invite, stealemoji', inline: false },
      { name: '🎉 /giveaway', value: 'create, end, reroll, list, cancel', inline: false },
      { name: '🪙 /economy', value: 'balance, daily, weekly, pay, leaderboard, gamble', inline: false },
      { name: '💎 /premium', value: 'status, perks, subscribe, badge, xpboost, customcolor, bio', inline: false },
      { name: '📢 /poll', value: 'create, end', inline: false },
      { name: '⏰ /reminder', value: 'set, list, delete', inline: false },
      { name: '💡 /suggest', value: 'submit, approve, deny', inline: false },
      { name: '👑 /owner', value: 'givepremium, removepremium, blacklist, stats, givecoins, and more...', inline: false },
      { name: '🌐 Dashboard', value: '[dotsbot.site/dashboard](http://www.dotsbot.site/dashboard)', inline: false },
    ])] });
  }
};

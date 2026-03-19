const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { requirePerm } = require('../utils/helpers');
const { Guild, User } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Invite tracking system')
    .addSubcommand(s => s.setName('setup').setDescription('Setup invite tracker')
      .addChannelOption(o => o.setName('channel').setDescription('Announce channel').setRequired(true))
    )
    .addSubcommand(s => s.setName('leaderboard').setDescription('Top inviters'))
    .addSubcommand(s => s.setName('stats').setDescription('Your invite stats')
      .addUserOption(o => o.setName('user').setDescription('User (default: you)'))
    )
    .addSubcommand(s => s.setName('reset').setDescription('Reset all invites (Owner)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: sub !== 'leaderboard' && sub !== 'stats' });

    if (sub === 'setup') {
      if (!(await requirePerm(interaction, PermissionFlagsBits.Administrator))) return;
      const ch = interaction.options.getChannel('channel');
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: { 'invites.channel': ch.id, 'invites.enabled': true } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Invite Tracker', `Setup in <#${ch.id}>`)] });
    }

    else if (sub === 'leaderboard') {
      const users = await User.find({ guildId: interaction.guildId }).sort({ invites: -1 }).limit(10);
      const entries = users.map((u, i) => ({ id: u.userId, val: (u.invites || 0) + ' invites' }));
      await interaction.editReply({ embeds: [E.lb('Top Inviters', entries, interaction.guild)] });
    }

    else if (sub === 'stats') {
      const target = interaction.options.getUser('user') || interaction.user;
      let u = await User.findOne({ userId: target.id, guildId: interaction.guildId });
      if (!u) u = { invites: 0 };
      await interaction.editReply({ embeds: [E.gold(target.username + "'s Invites", '', [
        { name: 'Total Invites', value: (u.invites || 0).toString(), inline: true },
        { name: 'Invited By', value: u.invitedBy ? '<@' + u.invitedBy + '>' : 'Unknown', inline: true }
      ]).setThumbnail(target.displayAvatarURL({ dynamic: true }))] });
    }

    else if (sub === 'reset') {
      if (!(await requirePerm(interaction, PermissionFlagsBits.Administrator))) return;
      await User.updateMany({ guildId: interaction.guildId }, { $set: { invites: 0, invitedBy: null } });
      await interaction.editReply({ embeds: [E.success('Reset', 'All invites have been reset.')] });
    }
  }
};

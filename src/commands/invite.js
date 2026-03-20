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
    .addSubcommand(s => s.setName('test').setDescription('Test invite system (adds 5 fake invites)'))
    .addSubcommand(s => s.setName('reset').setDescription('Reset all invites (Admin)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: sub !== 'leaderboard' && sub !== 'stats' });

    if (sub === 'setup') {
      if (!(await requirePerm(interaction, PermissionFlagsBits.Administrator))) return;
      const ch = interaction.options.getChannel('channel');
      await Guild.findOneAndUpdate(
        { guildId: interaction.guildId },
        { $set: { 'invites.channel': ch.id, 'invites.enabled': true } },
        { upsert: true }
      );
      await interaction.editReply({ embeds: [E.success('✅ Invite Tracker Setup', `Announcements will be sent to <#${ch.id}>\n\nInvites will now be tracked when members join!`)] });
    }

    else if (sub === 'leaderboard') {
      const users = await User.find({ guildId: interaction.guildId, invites: { $gt: 0 } })
        .sort({ invites: -1 })
        .limit(10);

      if (users.length === 0) {
        return interaction.editReply({ embeds: [E.info('No Invites', 'No one has invited anyone yet!')] });
      }

      const entries = users.map((u, i) => ({ id: u.userId, val: `**${u.invites || 0}** invites` }));
      await interaction.editReply({ embeds: [E.lb('🏆 Top Inviters', entries, interaction.guild)] });
    }

    else if (sub === 'stats') {
      const target = interaction.options.getUser('user') || interaction.user;
      let u = await User.findOne({ userId: target.id, guildId: interaction.guildId });

      if (!u) {
        u = { userId: target.id, invites: 0, invitedBy: null };
      }

      const inviterName = u.invitedBy ? `<@${u.invitedBy}>` : '❌ Unknown';
      
      // Get inviter's invite count
      let inviterInvites = 'N/A';
      if (u.invitedBy) {
        const inviter = await User.findOne({ userId: u.invitedBy, guildId: interaction.guildId });
        inviterInvites = inviter ? `**${inviter.invites || 0}** invites` : 'N/A';
      }

      await interaction.editReply({
        embeds: [E.gold(`📊 ${target.username}'s Invite Stats`, '', [
          { name: '📤 Total Invites', value: `**${u.invites || 0}**`, inline: true },
          { name: '👤 Invited By', value: inviterName, inline: true },
          { name: '📈 Inviter\'s Invites', value: inviterInvites, inline: true }
        ]).setThumbnail(target.displayAvatarURL({ dynamic: true }))]
      });
    }

    else if (sub === 'test') {
      if (!(await requirePerm(interaction, PermissionFlagsBits.Administrator))) return;

      // Add 5 test invites for the user
      let u = await User.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
      if (!u) {
        u = await User.create({ userId: interaction.user.id, guildId: interaction.guildId });
      }

      u.invites = (u.invites || 0) + 5;
      await u.save();

      await interaction.editReply({
        embeds: [E.success('✅ Test Complete', `Added **5** test invites to your account!\n\nYou now have **${u.invites}** invites.`)]
      });
    }

    else if (sub === 'reset') {
      if (!(await requirePerm(interaction, PermissionFlagsBits.Administrator))) return;

      await User.updateMany(
        { guildId: interaction.guildId },
        { $set: { invites: 0, invitedBy: null } }
      );

      await interaction.editReply({
        embeds: [E.success('🔄 Reset Complete', 'All invite data has been reset!')]
      });
    }
  }
};

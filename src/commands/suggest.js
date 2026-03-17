const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { Guild } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest').setDescription('💡 Suggestion system')
    .addSubcommand(s => s.setName('setup').setDescription('Setup suggestion channel')
      .addChannelOption(o => o.setName('channel').setDescription('Suggestion channel').setRequired(true)))
    .addSubcommand(s => s.setName('submit').setDescription('Submit a suggestion')
      .addStringOption(o => o.setName('idea').setDescription('Your suggestion').setRequired(true).setMaxLength(1000)))
    .addSubcommand(s => s.setName('approve').setDescription('Approve a suggestion')
      .addStringOption(o => o.setName('message-id').setDescription('Suggestion message ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('deny').setDescription('Deny a suggestion')
      .addStringOption(o => o.setName('message-id').setDescription('Suggestion message ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason'))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ embeds: [E.error('Permission Denied', 'Need `Manage Server`.')] });
      const ch = interaction.options.getChannel('channel');
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: { 'channels.suggestions': ch.id } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Suggestions Setup', `Suggestions will be sent to <#${ch.id}>.`)] });
    }

    else if (sub === 'submit') {
      const idea = interaction.options.getString('idea');
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!cfg?.channels?.suggestions)
        return interaction.editReply({ embeds: [E.error('Not Setup', 'Ask an admin to run `/suggest setup`.')] });
      const ch = await client.channels.fetch(cfg.channels.suggestions).catch(() => null);
      if (!ch) return interaction.editReply({ embeds: [E.error('Channel Not Found', 'Suggestion channel is invalid.')] });
      const embed = E.make(E.C.INFO)
        .setTitle('💡  New Suggestion')
        .setDescription(idea)
        .addFields(
          { name: '👤 Submitted by', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📊 Status', value: '⏳ Pending', inline: true },
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp();
      const msg = await ch.send({ embeds: [embed] });
      await msg.react('✅');
      await msg.react('❌');
      await interaction.editReply({ embeds: [E.success('Suggestion Submitted!', `Your idea has been posted in <#${ch.id}>!`)] });
    }

    else if (sub === 'approve') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ embeds: [E.error('Permission Denied', 'Need `Manage Server`.')] });
      const msgId = interaction.options.getString('message-id');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      try {
        const cfg = await Guild.findOne({ guildId: interaction.guildId });
        const ch = await client.channels.fetch(cfg?.channels?.suggestions);
        const msg = await ch.messages.fetch(msgId);
        const oldEmbed = msg.embeds[0];
        const newEmbed = E.make(E.C.SUCCESS)
          .setTitle('✅  Suggestion Approved')
          .setDescription(oldEmbed?.description || '*No content*')
          .addFields(
            { name: '✅ Approved by', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📋 Reason', value: reason, inline: true },
            { name: '📊 Status', value: '✅ Approved', inline: true },
          )
          .setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp();
        await msg.edit({ embeds: [newEmbed] });
        await interaction.editReply({ embeds: [E.success('Suggestion Approved', `Message \`${msgId}\` approved.`)] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Error', e.message)] }); }
    }

    else if (sub === 'deny') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ embeds: [E.error('Permission Denied', 'Need `Manage Server`.')] });
      const msgId = interaction.options.getString('message-id');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      try {
        const cfg = await Guild.findOne({ guildId: interaction.guildId });
        const ch = await client.channels.fetch(cfg?.channels?.suggestions);
        const msg = await ch.messages.fetch(msgId);
        const oldEmbed = msg.embeds[0];
        const newEmbed = E.make(E.C.ERROR)
          .setTitle('❌  Suggestion Denied')
          .setDescription(oldEmbed?.description || '*No content*')
          .addFields(
            { name: '❌ Denied by', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📋 Reason', value: reason, inline: true },
            { name: '📊 Status', value: '❌ Denied', inline: true },
          )
          .setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp();
        await msg.edit({ embeds: [newEmbed] });
        await interaction.editReply({ embeds: [E.success('Suggestion Denied', `Message \`${msgId}\` denied.`)] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Error', e.message)] }); }
    }
  }
};

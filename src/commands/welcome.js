const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { requirePerm } = require('../utils/helpers');
const { Guild } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome').setDescription('👋 Welcome & farewell system')
    .addSubcommand(s => s.setName('setup').setDescription('Configure welcome messages')
      .addChannelOption(o => o.setName('channel').setDescription('Welcome channel').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Message — use {user} {server} {count}'))
      .addBooleanOption(o => o.setName('ping').setDescription('Ping new members'))
      .addBooleanOption(o => o.setName('dm').setDescription('DM new members'))
      .addStringOption(o => o.setName('dm-message').setDescription('DM message'))
      .addStringOption(o => o.setName('banner').setDescription('Banner image URL')))
    .addSubcommand(s => s.setName('disable').setDescription('Disable welcome messages'))
    .addSubcommand(s => s.setName('test').setDescription('Send a test welcome message'))
    .addSubcommand(s => s.setName('farewell').setDescription('Configure farewell messages')
      .addChannelOption(o => o.setName('channel').setDescription('Farewell channel').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Message — use {user} {server} {count}')))
    .addSubcommand(s => s.setName('farewell-disable').setDescription('Disable farewell messages'))
    .addSubcommand(s => s.setName('farewell-test').setDescription('Send a test farewell message'))
    .addSubcommand(s => s.setName('config').setDescription('View welcome/farewell config')),

  async execute(interaction, client) {
    if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'setup') {
      const ch = interaction.options.getChannel('channel');
      const msg = interaction.options.getString('message') || 'Welcome {user} to **{server}**! You are member **#{count}**! 🎮';
      const ping = interaction.options.getBoolean('ping') ?? false;
      const dm = interaction.options.getBoolean('dm') ?? false;
      const dmMsg = interaction.options.getString('dm-message');
      const banner = interaction.options.getString('banner');
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: {
        'channels.welcome': ch.id,
        'welcome.enabled': true,
        'welcome.message': msg,
        'welcome.ping': ping,
        'welcome.dm': dm,
        'welcome.dmMsg': dmMsg,
        'welcome.banner': banner,
      }}, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Welcome Setup', '', [
        { name: '📢 Channel', value: `<#${ch.id}>`, inline: true },
        { name: '🔔 Ping', value: ping ? 'Yes' : 'No', inline: true },
        { name: '📩 DM', value: dm ? 'Yes' : 'No', inline: true },
        { name: '📝 Message', value: `\`${msg.slice(0, 100)}\``, inline: false },
      ])] });
    }

    else if (sub === 'disable') {
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: { 'welcome.enabled': false } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Welcome Disabled', 'Welcome messages are now off.')] });
    }

    else if (sub === 'test') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!cfg?.welcome?.enabled || !cfg?.channels?.welcome)
        return interaction.editReply({ embeds: [E.error('Not Configured', 'Run `/welcome setup` first.')] });
      const ch = await client.channels.fetch(cfg.channels.welcome).catch(() => null);
      if (!ch) return interaction.editReply({ embeds: [E.error('Invalid Channel', 'Welcome channel not found.')] });
      await ch.send({ embeds: [E.welcome(interaction.member, cfg.welcome)] });
      await interaction.editReply({ embeds: [E.success('Test Sent', `Welcome test sent to <#${ch.id}>.`)] });
    }

    else if (sub === 'farewell') {
      const ch = interaction.options.getChannel('channel');
      const msg = interaction.options.getString('message') || '**{user}** has left **{server}**.';
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: {
        'channels.farewell': ch.id,
        'farewell.enabled': true,
        'farewell.message': msg,
      }}, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Farewell Setup', '', [
        { name: '📢 Channel', value: `<#${ch.id}>`, inline: true },
        { name: '📝 Message', value: `\`${msg.slice(0, 100)}\``, inline: false },
      ])] });
    }

    else if (sub === 'farewell-disable') {
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: { 'farewell.enabled': false } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Farewell Disabled', 'Farewell messages are now off.')] });
    }

    else if (sub === 'farewell-test') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!cfg?.farewell?.enabled || !cfg?.channels?.farewell)
        return interaction.editReply({ embeds: [E.error('Not Configured', 'Run `/welcome farewell` first.')] });
      const ch = await client.channels.fetch(cfg.channels.farewell).catch(() => null);
      if (!ch) return interaction.editReply({ embeds: [E.error('Invalid Channel', 'Farewell channel not found.')] });
      await ch.send({ embeds: [E.bye(interaction.member, cfg.farewell)] });
      await interaction.editReply({ embeds: [E.success('Test Sent', `Farewell test sent to <#${ch.id}>.`)] });
    }

    else if (sub === 'config') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      await interaction.editReply({ embeds: [E.info('Welcome/Farewell Config', '', [
        { name: '👋 Welcome', value: cfg?.welcome?.enabled ? `✅ <#${cfg.channels?.welcome || 'unset'}>` : '❌ Disabled', inline: true },
        { name: '👋 Farewell', value: cfg?.farewell?.enabled ? `✅ <#${cfg.channels?.farewell || 'unset'}>` : '❌ Disabled', inline: true },
        { name: '🔔 Ping', value: cfg?.welcome?.ping ? '✅' : '❌', inline: true },
        { name: '📩 DM', value: cfg?.welcome?.dm ? '✅' : '❌', inline: true },
      ])] });
    }
  }
};

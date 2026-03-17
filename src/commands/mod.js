const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { requirePerm } = require('../utils/helpers');
const { Modlog, Guild } = require('../models/index');
const ms = require('ms');

async function nextCase(gid) { return (await Modlog.countDocuments({ guildId: gid })) + 1; }
async function logMod(guild, embed, client) {
  try {
    const cfg = await Guild.findOne({ guildId: guild.id });
    if (cfg?.channels?.modLogs) {
      const ch = await client.channels.fetch(cfg.channels.modLogs).catch(() => null);
      if (ch) ch.send({ embeds: [embed] });
    }
  } catch {}
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod').setDescription('🛡️ Moderation suite')
    .addSubcommand(s => s.setName('ban').setDescription('Ban a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason'))
      .addIntegerOption(o => o.setName('delete-days').setDescription('Message delete days (0-7)').setMinValue(0).setMaxValue(7)))
    .addSubcommand(s => s.setName('unban').setDescription('Unban a user by ID')
      .addStringOption(o => o.setName('user-id').setDescription('User ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('kick').setDescription('Kick a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('mute').setDescription('Timeout a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Duration e.g. 10m 1h 1d').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('unmute').setDescription('Remove timeout')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('warn').setDescription('Warn a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)))
    .addSubcommand(s => s.setName('warnings').setDescription('View warnings')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('clearwarns').setDescription('Clear all warnings')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('purge').setDescription('Bulk delete messages')
      .addIntegerOption(o => o.setName('amount').setDescription('1-100').setMinValue(1).setMaxValue(100).setRequired(true))
      .addUserOption(o => o.setName('user').setDescription('Filter by user')))
    .addSubcommand(s => s.setName('slowmode').setDescription('Set channel slowmode')
      .addIntegerOption(o => o.setName('seconds').setDescription('0 to disable').setMinValue(0).setMaxValue(21600).setRequired(true)))
    .addSubcommand(s => s.setName('lock').setDescription('Lock a channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel (default: current)'))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('unlock').setDescription('Unlock a channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel (default: current)')))
    .addSubcommand(s => s.setName('nick').setDescription('Change nickname')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('name').setDescription('New nickname (empty = reset)')))
    .addSubcommand(s => s.setName('cases').setDescription('View mod cases')
      .addUserOption(o => o.setName('user').setDescription('Filter by user'))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const permMap = {
      ban: PermissionFlagsBits.BanMembers, unban: PermissionFlagsBits.BanMembers,
      kick: PermissionFlagsBits.KickMembers, mute: PermissionFlagsBits.ModerateMembers,
      unmute: PermissionFlagsBits.ModerateMembers, warn: PermissionFlagsBits.ModerateMembers,
      warnings: PermissionFlagsBits.ModerateMembers, clearwarns: PermissionFlagsBits.ModerateMembers,
      purge: PermissionFlagsBits.ManageMessages, slowmode: PermissionFlagsBits.ManageChannels,
      lock: PermissionFlagsBits.ManageChannels, unlock: PermissionFlagsBits.ManageChannels,
      nick: PermissionFlagsBits.ManageNicknames, cases: PermissionFlagsBits.ModerateMembers,
    };
    if (!(await requirePerm(interaction, permMap[sub]))) return;
    await interaction.deferReply();

    if (sub === 'ban') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const days = interaction.options.getInteger('delete-days') || 0;
      try {
        await interaction.guild.members.ban(user.id, { reason, deleteMessageDays: days });
        const cid = await nextCase(interaction.guildId);
        await Modlog.create({ caseId: cid, guildId: interaction.guildId, type: 'ban', userId: user.id, userTag: user.tag, modId: interaction.user.id, modTag: interaction.user.tag, reason });
        const emb = E.mod('ban', user, interaction.user, reason, [{ name: '🔢 Case', value: `#${cid}`, inline: true }]);
        await logMod(interaction.guild, emb, client);
        await interaction.editReply({ embeds: [emb] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Ban Failed', e.message)] }); }
    }

    else if (sub === 'unban') {
      const uid = interaction.options.getString('user-id');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      try {
        const ban = await interaction.guild.bans.fetch(uid).catch(() => null);
        if (!ban) return interaction.editReply({ embeds: [E.error('Not Banned', 'That user is not banned.')] });
        await interaction.guild.members.unban(uid, reason);
        const emb = E.mod('unban', { id: uid, username: ban.user.username, tag: ban.user.tag }, interaction.user, reason);
        await logMod(interaction.guild, emb, client);
        await interaction.editReply({ embeds: [emb] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Unban Failed', e.message)] }); }
    }

    else if (sub === 'kick') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.editReply({ embeds: [E.error('Not Found', 'Member not found in server.')] });
      try {
        await member.kick(reason);
        const cid = await nextCase(interaction.guildId);
        await Modlog.create({ caseId: cid, guildId: interaction.guildId, type: 'kick', userId: user.id, userTag: user.tag, modId: interaction.user.id, modTag: interaction.user.tag, reason });
        const emb = E.mod('kick', user, interaction.user, reason, [{ name: '🔢 Case', value: `#${cid}`, inline: true }]);
        await logMod(interaction.guild, emb, client);
        await interaction.editReply({ embeds: [emb] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Kick Failed', e.message)] }); }
    }

    else if (sub === 'mute') {
      const user = interaction.options.getUser('user');
      const dur = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.editReply({ embeds: [E.error('Not Found', 'Member not found.')] });
      const msVal = ms(dur);
      if (!msVal || msVal > 2419200000) return interaction.editReply({ embeds: [E.error('Invalid Duration', 'Max is 28 days. Format: `10m`, `1h`, `1d`')] });
      try {
        await member.timeout(msVal, reason);
        const cid = await nextCase(interaction.guildId);
        await Modlog.create({ caseId: cid, guildId: interaction.guildId, type: 'mute', userId: user.id, userTag: user.tag, modId: interaction.user.id, modTag: interaction.user.tag, reason, duration: dur });
        const emb = E.mod('mute', user, interaction.user, reason, [{ name: '⏱️ Duration', value: dur, inline: true }, { name: '🔢 Case', value: `#${cid}`, inline: true }]);
        await logMod(interaction.guild, emb, client);
        await interaction.editReply({ embeds: [emb] });
        try { await user.send({ embeds: [E.warn(`You were muted in ${interaction.guild.name}`, `**Reason:** ${reason}\n**Duration:** ${dur}`)] }); } catch {}
      } catch (e) { await interaction.editReply({ embeds: [E.error('Mute Failed', e.message)] }); }
    }

    else if (sub === 'unmute') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.editReply({ embeds: [E.error('Not Found', 'Member not found.')] });
      await member.timeout(null, reason);
      const emb = E.mod('unmute', user, interaction.user, reason);
      await logMod(interaction.guild, emb, client);
      await interaction.editReply({ embeds: [emb] });
    }

    else if (sub === 'warn') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      const { User } = require('../models/index');
      await User.findOneAndUpdate({ userId: user.id }, { $push: { warnings: { reason, modId: interaction.user.id, guildId: interaction.guildId } } }, { upsert: true });
      const dbUser = await User.findOne({ userId: user.id });
      const count = dbUser?.warnings?.filter(w => w.guildId === interaction.guildId).length || 1;
      const cid = await nextCase(interaction.guildId);
      await Modlog.create({ caseId: cid, guildId: interaction.guildId, type: 'warn', userId: user.id, userTag: user.tag, modId: interaction.user.id, modTag: interaction.user.tag, reason });
      const emb = E.mod('warn', user, interaction.user, reason, [{ name: '⚠️ Warnings', value: `${count} total`, inline: true }, { name: '🔢 Case', value: `#${cid}`, inline: true }]);
      await logMod(interaction.guild, emb, client);
      await interaction.editReply({ embeds: [emb] });
      try { await user.send({ embeds: [E.warn(`Warning in ${interaction.guild.name}`, `**Reason:** ${reason}\n**Warnings:** ${count}`)] }); } catch {}
    }

    else if (sub === 'warnings') {
      const user = interaction.options.getUser('user');
      const { User } = require('../models/index');
      const dbUser = await User.findOne({ userId: user.id });
      const warns = dbUser?.warnings?.filter(w => w.guildId === interaction.guildId) || [];
      if (!warns.length) return interaction.editReply({ embeds: [E.info('No Warnings', `${user.username} has no warnings in this server.`)] });
      const fields = warns.slice(0, 10).map((w, i) => ({ name: `#${i + 1}`, value: `📋 ${w.reason}\n🛡️ <@${w.modId}> • <t:${Math.floor(new Date(w.at).getTime() / 1000)}:R>`, inline: false }));
      await interaction.editReply({ embeds: [E.warn(`Warnings — ${user.username}`, `**${warns.length}** warning(s)`, fields)] });
    }

    else if (sub === 'clearwarns') {
      const user = interaction.options.getUser('user');
      const { User } = require('../models/index');
      await User.findOneAndUpdate({ userId: user.id }, { $pull: { warnings: { guildId: interaction.guildId } } });
      await interaction.editReply({ embeds: [E.success('Warnings Cleared', `All warnings removed for **${user.username}**.`)] });
    }

    else if (sub === 'purge') {
      const amount = interaction.options.getInteger('amount');
      const filterUser = interaction.options.getUser('user');
      let msgs = await interaction.channel.messages.fetch({ limit: 100 });
      if (filterUser) msgs = msgs.filter(m => m.author.id === filterUser.id);
      const bulk = msgs.filter(m => Date.now() - m.createdTimestamp < 1209600000).first(amount);
      try {
        await interaction.channel.bulkDelete(bulk, true);
        const emb = E.success('Purged', `Deleted **${bulk.length}** message(s)${filterUser ? ` from **${filterUser.username}**` : ''}.`);
        await interaction.editReply({ embeds: [emb] });
        setTimeout(() => interaction.deleteReply().catch(() => {}), 4000);
      } catch (e) { await interaction.editReply({ embeds: [E.error('Purge Failed', e.message)] }); }
    }

    else if (sub === 'slowmode') {
      const secs = interaction.options.getInteger('seconds');
      await interaction.channel.setRateLimitPerUser(secs);
      await interaction.editReply({ embeds: [E.success('Slowmode', secs === 0 ? 'Slowmode disabled.' : `Set to **${secs}s**.`)] });
    }

    else if (sub === 'lock') {
      const ch = interaction.options.getChannel('channel') || interaction.channel;
      const reason = interaction.options.getString('reason') || 'Channel locked';
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.editReply({ embeds: [E.warn('Channel Locked', `🔒 <#${ch.id}> has been locked.\n**Reason:** ${reason}`)] });
    }

    else if (sub === 'unlock') {
      const ch = interaction.options.getChannel('channel') || interaction.channel;
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      await interaction.editReply({ embeds: [E.success('Channel Unlocked', `🔓 <#${ch.id}> has been unlocked.`)] });
    }

    else if (sub === 'nick') {
      const user = interaction.options.getUser('user');
      const name = interaction.options.getString('name') || null;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.editReply({ embeds: [E.error('Not Found', 'Member not found.')] });
      await member.setNickname(name, `By ${interaction.user.tag}`);
      await interaction.editReply({ embeds: [E.success('Nickname Updated', name ? `Set to **${name}**.` : `Reset for **${user.username}**.`)] });
    }

    else if (sub === 'cases') {
      const user = interaction.options.getUser('user');
      const query = { guildId: interaction.guildId };
      if (user) query.userId = user.id;
      const cases = await Modlog.find(query).sort({ timestamp: -1 }).limit(10);
      if (!cases.length) return interaction.editReply({ embeds: [E.info('No Cases', 'No moderation cases found.')] });
      const fields = cases.map(c => ({ name: `Case #${c.caseId} — ${c.type.toUpperCase()}`, value: `👤 <@${c.userId}>  🛡️ <@${c.modId}>\n📋 ${c.reason}\n🕐 <t:${Math.floor(new Date(c.timestamp).getTime() / 1000)}:R>`, inline: false }));
      await interaction.editReply({ embeds: [E.make(E.C.MOD).setTitle('📋  Moderation Cases').addFields(fields).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    }
  }
};

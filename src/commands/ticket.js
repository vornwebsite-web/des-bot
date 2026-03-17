const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { requirePerm } = require('../utils/helpers');
const { Ticket, Guild } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket').setDescription('🎫 Ticket support system')
    .addSubcommand(s => s.setName('setup').setDescription('Configure the ticket system')
      .addChannelOption(o => o.setName('panel-channel').setDescription('Where to post the ticket panel').setRequired(true))
      .addRoleOption(o => o.setName('support-role').setDescription('Support staff role').setRequired(true))
      .addChannelOption(o => o.setName('log-channel').setDescription('Where to log closed tickets')))
    .addSubcommand(s => s.setName('panel').setDescription('Post the ticket opening panel'))
    .addSubcommand(s => s.setName('create').setDescription('Open a support ticket')
      .addStringOption(o => o.setName('subject').setDescription('Ticket subject').setRequired(true))
      .addStringOption(o => o.setName('type').setDescription('Type').addChoices(
        { name: '🎮 Game Support', value: 'game' },
        { name: '🏆 Tournament', value: 'tournament' },
        { name: '💎 Premium', value: 'premium' },
        { name: '🐛 Bug Report', value: 'bug' },
        { name: '💬 General', value: 'general' },
        { name: '🚨 Report', value: 'report' })))
    .addSubcommand(s => s.setName('close').setDescription('Close this ticket')
      .addStringOption(o => o.setName('reason').setDescription('Close reason')))
    .addSubcommand(s => s.setName('claim').setDescription('Claim this ticket'))
    .addSubcommand(s => s.setName('unclaim').setDescription('Unclaim this ticket'))
    .addSubcommand(s => s.setName('add').setDescription('Add user to ticket')
      .addUserOption(o => o.setName('user').setDescription('User to add').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove user from ticket')
      .addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true)))
    .addSubcommand(s => s.setName('priority').setDescription('Set ticket priority')
      .addStringOption(o => o.setName('level').setDescription('Priority').setRequired(true).addChoices(
        { name: '🟢 Low', value: 'low' }, { name: '🟡 Normal', value: 'normal' },
        { name: '🔴 High', value: 'high' }, { name: '🚨 Critical', value: 'critical' })))
    .addSubcommand(s => s.setName('list').setDescription('List all open tickets'))
    .addSubcommand(s => s.setName('transcript').setDescription('Save a ticket transcript')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
      await interaction.deferReply({ ephemeral: true });
      const panelCh = interaction.options.getChannel('panel-channel');
      const supRole = interaction.options.getRole('support-role');
      const logCh = interaction.options.getChannel('log-channel');
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, {
        $set: { 'tickets.enabled': true, 'tickets.supportRole': supRole.id, 'channels.ticketLogs': logCh?.id }
      }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Ticket System Ready', `Panel channel: <#${panelCh.id}>\nSupport role: <@&${supRole.id}>\nLogs: ${logCh ? `<#${logCh.id}>` : 'None'}`)] });
    }

    else if (sub === 'panel') {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
      await interaction.deferReply({ ephemeral: true });
      const panelEmbed = E.ticket('🎫 Support Tickets — DOT Esport',
        '> Need assistance? Open a ticket and our team will help you promptly.\n\n' +
        '`🎮` **Game Support** — In-game or bot issues\n`🏆` **Tournament** — Tournament questions\n' +
        '`💎` **Premium** — Subscription support\n`🐛` **Bug Report** — Report a bug\n' +
        '`💬` **General** — Any other question\n`🚨` **Report** — Report a user',
        [{ name: '📋 Please Note', value: '• Be respectful to staff\n• Provide as much detail as possible\n• One ticket at a time', inline: false }]
      );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_open_general').setLabel('Open a Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
      );
      await interaction.channel.send({ embeds: [panelEmbed], components: [row] });
      await interaction.editReply({ embeds: [E.success('Panel Posted', 'Ticket panel has been sent!')] });
    }

    else if (sub === 'create') {
      await interaction.deferReply({ ephemeral: true });
      const subject = interaction.options.getString('subject');
      const type = interaction.options.getString('type') || 'general';
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!cfg?.tickets?.enabled) return interaction.editReply({ embeds: [E.error('Not Setup', 'Ticket system not configured. Ask an admin to run `/ticket setup`.')] });
      const existing = await Ticket.findOne({ userId: interaction.user.id, guildId: interaction.guildId, status: { $in: ['open', 'claimed'] } });
      if (existing) return interaction.editReply({ embeds: [E.warn('Active Ticket', `You already have an open ticket: <#${existing.channelId}>`)] });
      cfg.tickets.counter = (cfg.tickets.counter || 0) + 1;
      await cfg.save();
      const ticketId = `ticket-${String(cfg.tickets.counter).padStart(4, '0')}`;
      const perms = [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
      ];
      if (cfg.tickets.supportRole) perms.push({ id: cfg.tickets.supportRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] });
      const ch = await interaction.guild.channels.create({
        name: ticketId, type: ChannelType.GuildText,
        permissionOverwrites: perms,
        topic: `Ticket by ${interaction.user.tag} | ${subject} | ${type}`,
      });
      await Ticket.create({ ticketId, guildId: interaction.guildId, channelId: ch.id, userId: interaction.user.id, type, subject });
      const typeEmoji = { game: '🎮', tournament: '🏆', premium: '💎', bug: '🐛', general: '💬', report: '🚨' };
      const openEmbed = E.ticket(`Ticket: ${subject}`,
        `Welcome <@${interaction.user.id}>! Support will assist you shortly.\n\n**Please describe your issue in detail.**`,
        [
          { name: '🏷️ ID', value: `\`${ticketId}\``, inline: true },
          { name: `${typeEmoji[type]} Type`, value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
          { name: '📊 Priority', value: '🟡 Normal', inline: true },
        ]
      );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`t_claim_${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId(`t_close_${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
      );
      await ch.send({ content: `<@${interaction.user.id}>${cfg.tickets.supportRole ? ` <@&${cfg.tickets.supportRole}>` : ''}`, embeds: [openEmbed], components: [row] });
      await interaction.editReply({ embeds: [E.success('Ticket Created!', `Your ticket: <#${ch.id}>`)] });
    }

    else if (sub === 'close') {
      await interaction.deferReply();
      const reason = interaction.options.getString('reason') || 'No reason';
      const t = await Ticket.findOne({ channelId: interaction.channelId, status: { $in: ['open', 'claimed'] } });
      if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'This is not an active ticket channel.')] });
      t.status = 'closed'; t.closedAt = new Date(); t.closedBy = interaction.user.id; t.reason = reason;
      await t.save();
      await interaction.editReply({ embeds: [E.ticket('Closing Ticket', `Closing in **5s**...\n**Reason:** ${reason}`)] });
      setTimeout(async () => { try { await interaction.channel.delete(`Closed by ${interaction.user.tag}: ${reason}`); } catch {} }, 5000);
    }

    else if (sub === 'claim') {
      await interaction.deferReply();
      const t = await Ticket.findOne({ channelId: interaction.channelId, status: { $in: ['open', 'claimed'] } });
      if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'This is not an active ticket channel.')] });
      if (t.claimedBy) return interaction.editReply({ embeds: [E.warn('Already Claimed', `Claimed by <@${t.claimedBy}>.`)] });
      t.claimedBy = interaction.user.id; t.status = 'claimed';
      await t.save();
      await interaction.editReply({ embeds: [E.ticket('Ticket Claimed', `<@${interaction.user.id}> is now handling this ticket.`)] });
    }

    else if (sub === 'unclaim') {
      await interaction.deferReply();
      const t = await Ticket.findOne({ channelId: interaction.channelId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'This is not a ticket channel.')] });
      t.claimedBy = null; t.status = 'open';
      await t.save();
      await interaction.editReply({ embeds: [E.ticket('Ticket Unclaimed', 'Available for any staff to claim.')] });
    }

    else if (sub === 'add') {
      await interaction.deferReply();
      const user = interaction.options.getUser('user');
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true });
      await interaction.editReply({ embeds: [E.ticket('User Added', `<@${user.id}> has been added to this ticket.`)] });
    }

    else if (sub === 'remove') {
      await interaction.deferReply();
      const user = interaction.options.getUser('user');
      const t = await Ticket.findOne({ channelId: interaction.channelId });
      if (t?.userId === user.id) return interaction.editReply({ embeds: [E.error('Cannot Remove', 'Cannot remove the ticket creator.')] });
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
      await interaction.editReply({ embeds: [E.ticket('User Removed', `<@${user.id}> removed from this ticket.`)] });
    }

    else if (sub === 'priority') {
      await interaction.deferReply();
      const level = interaction.options.getString('level');
      const t = await Ticket.findOne({ channelId: interaction.channelId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'Run this inside a ticket channel.')] });
      t.priority = level; await t.save();
      const icons = { low: '🟢', normal: '🟡', high: '🔴', critical: '🚨' };
      await interaction.editReply({ embeds: [E.ticket('Priority Updated', `Priority set to ${icons[level]} **${level.toUpperCase()}**.`)] });
    }

    else if (sub === 'list') {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageChannels))) return;
      await interaction.deferReply({ ephemeral: true });
      const tickets = await Ticket.find({ guildId: interaction.guildId, status: { $in: ['open', 'claimed'] } });
      if (!tickets.length) return interaction.editReply({ embeds: [E.info('No Open Tickets', 'All clear!')] });
      const fields = tickets.slice(0, 10).map(t => ({ name: `🎫 ${t.ticketId} — ${t.type}`, value: `👤 <@${t.userId}> • ${t.claimedBy ? `🎫 <@${t.claimedBy}>` : '⏳ Unclaimed'} • <t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:R>`, inline: false }));
      await interaction.editReply({ embeds: [E.ticket(`Open Tickets (${tickets.length})`, '', fields)] });
    }

    else if (sub === 'transcript') {
      await interaction.deferReply();
      const msgs = await interaction.channel.messages.fetch({ limit: 100 });
      const sorted = [...msgs.values()].reverse();
      const text = sorted.map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || '[Embed/Attachment]'}`).join('\n');
      const { AttachmentBuilder } = require('discord.js');
      const att = new AttachmentBuilder(Buffer.from(text, 'utf-8'), { name: `transcript-${interaction.channel.name}.txt` });
      await interaction.editReply({ embeds: [E.ticket('Transcript Saved', `Transcript for **${interaction.channel.name}** attached.`)], files: [att] });
    }
  }
};

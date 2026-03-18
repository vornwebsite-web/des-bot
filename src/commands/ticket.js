// ═══════════════════════════════════════════════════════════════
//   DeS Bot™ — /ticket command
//   Full ticket system with multiple support roles
// ═══════════════════════════════════════════════════════════════

const {
SlashCommandBuilder, PermissionFlagsBits, ChannelType,
ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder,
} = require('discord.js');
const E = require('../utils/embeds');
const { requirePerm } = require('../utils/helpers');
const { Ticket, Guild } = require('../models/index');

// ── Helper: build permission overwrites for a new ticket channel ─
function buildPerms(guild, userId, supportRoles) {
const perms = [
{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
{ id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
];
for (const roleId of supportRoles) {
if (roleId && guild.roles.cache.has(roleId)) {
perms.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] });
}
}
return perms;
}

// ── Helper: ping string for all support roles ────────────────────
function pingRoles(supportRoles) {
return supportRoles.filter(Boolean).map(r => `<@&${r}>`).join(’ ’);
}

// ── Helper: check if user is support staff ───────────────────────
async function isStaff(member, cfg) {
if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
const roles = cfg?.tickets?.supportRoles || (cfg?.tickets?.supportRole ? [cfg.tickets.supportRole] : []);
return roles.some(r => member.roles.cache.has(r));
}

module.exports = {
data: new SlashCommandBuilder()
.setName('ticket').setDescription('🎫 Ticket support system')

.addSubcommand(s => s
  .setName('setup')
  .setDescription('Configure the ticket system')
  .addRoleOption(o => o.setName('support-role-1').setDescription('Support staff role #1').setRequired(true))
  .addRoleOption(o => o.setName('support-role-2').setDescription('Support staff role #2'))
  .addRoleOption(o => o.setName('support-role-3').setDescription('Support staff role #3'))
  .addRoleOption(o => o.setName('support-role-4').setDescription('Support staff role #4'))
  .addRoleOption(o => o.setName('support-role-5').setDescription('Support staff role #5'))
  .addChannelOption(o => o.setName('log-channel').setDescription('Channel for ticket logs/transcripts'))
  .addChannelOption(o => o.setName('category').setDescription('Category to create ticket channels in'))
  .addIntegerOption(o => o.setName('max-open').setDescription('Max open tickets per user (default 1)').setMinValue(1).setMaxValue(5))
)

.addSubcommand(s => s
  .setName('addrole')
  .setDescription('Add a support role without reconfiguring everything')
  .addRoleOption(o => o.setName('role').setDescription('Role to add').setRequired(true))
)

.addSubcommand(s => s
  .setName('removerole')
  .setDescription('Remove a support role')
  .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true))
)

.addSubcommand(s => s
  .setName('roles')
  .setDescription('View all current support roles')
)

.addSubcommand(s => s
  .setName('panel')
  .setDescription('Post the ticket opening panel in this channel')
)

.addSubcommand(s => s
  .setName('create')
  .setDescription('Open a support ticket')
  .addStringOption(o => o.setName('subject').setDescription('Ticket subject').setRequired(true))
  .addStringOption(o => o.setName('type').setDescription('Ticket type').addChoices(
    { name: '🎮 Game Support',  value: 'game' },
    { name: '🏆 Tournament',    value: 'tournament' },
    { name: '💎 Premium',       value: 'premium' },
    { name: '🐛 Bug Report',    value: 'bug' },
    { name: '💬 General',       value: 'general' },
    { name: '🚨 Report User',   value: 'report' },
  ))
)

.addSubcommand(s => s
  .setName('close')
  .setDescription('Close this ticket channel')
  .addStringOption(o => o.setName('reason').setDescription('Reason for closing'))
)

.addSubcommand(s => s
  .setName('claim')
  .setDescription('Claim this ticket (support staff only)')
)

.addSubcommand(s => s
  .setName('unclaim')
  .setDescription('Unclaim this ticket')
)

.addSubcommand(s => s
  .setName('add')
  .setDescription('Add a user to this ticket')
  .addUserOption(o => o.setName('user').setDescription('User to add').setRequired(true))
)

.addSubcommand(s => s
  .setName('remove')
  .setDescription('Remove a user from this ticket')
  .addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true))
)

.addSubcommand(s => s
  .setName('rename')
  .setDescription('Rename this ticket channel')
  .addStringOption(o => o.setName('name').setDescription('New channel name').setRequired(true))
)

.addSubcommand(s => s
  .setName('priority')
  .setDescription('Set ticket priority')
  .addStringOption(o => o.setName('level').setDescription('Priority level').setRequired(true).addChoices(
    { name: '🟢 Low',      value: 'low' },
    { name: '🟡 Normal',   value: 'normal' },
    { name: '🔴 High',     value: 'high' },
    { name: '🚨 Critical', value: 'critical' },
  ))
)

.addSubcommand(s => s
  .setName('transcript')
  .setDescription('Save and attach a transcript of this ticket')
)

.addSubcommand(s => s
  .setName('list')
  .setDescription('List all open tickets in this server')
)

.addSubcommand(s => s
  .setName('info')
  .setDescription('View info about this ticket channel')
),
```

async execute(interaction, client) {
const sub = interaction.options.getSubcommand();

```
// ── SETUP ─────────────────────────────────────────────────────
if (sub === 'setup') {
  if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
  await interaction.deferReply({ ephemeral: true });

  // Collect all provided support roles (up to 5)
  const supportRoles = [1, 2, 3, 4, 5]
    .map(n => interaction.options.getRole(`support-role-${n}`)?.id)
    .filter(Boolean);
  // Deduplicate
  const uniqueRoles = [...new Set(supportRoles)];

  const logCh    = interaction.options.getChannel('log-channel');
  const category = interaction.options.getChannel('category');
  const maxOpen  = interaction.options.getInteger('max-open') || 1;

  await Guild.findOneAndUpdate(
    { guildId: interaction.guildId },
    {
      $set: {
        'tickets.enabled':      true,
        'tickets.supportRoles': uniqueRoles,
        'tickets.supportRole':  uniqueRoles[0], // backwards compat
        'tickets.maxOpen':      maxOpen,
        'tickets.categoryId':   category?.id || null,
        'tickets.logChannel':   logCh?.id || null,
        'channels.ticketLogs':  logCh?.id || null,
      }
    },
    { upsert: true }
  );

  const roleList = uniqueRoles.map(r => `<@&${r}>`).join('\n') || '*None*';

  await interaction.editReply({
    embeds: [E.success('Ticket System Configured ✅', '', [
      { name: '🛡️ Support Roles', value: roleList, inline: false },
      { name: '📂 Category', value: category ? `<#${category.id}>` : 'Auto (no category)', inline: true },
      { name: '📋 Ticket Logs', value: logCh ? `<#${logCh.id}>` : 'None', inline: true },
      { name: '🔢 Max Open/User', value: `${maxOpen}`, inline: true },
      { name: '💡 Next Step', value: 'Run `/ticket panel` in the channel where you want the ticket button.', inline: false },
    ])]
  });
}

// ── ADD ROLE ──────────────────────────────────────────────────
else if (sub === 'addrole') {
  if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
  await interaction.deferReply({ ephemeral: true });

  const role = interaction.options.getRole('role');
  const cfg = await Guild.findOne({ guildId: interaction.guildId });
  const current = cfg?.tickets?.supportRoles || (cfg?.tickets?.supportRole ? [cfg.tickets.supportRole] : []);

  if (current.includes(role.id)) {
    return interaction.editReply({ embeds: [E.warn('Already Added', `<@&${role.id}> is already a support role.`)] });
  }
  if (current.length >= 10) {
    return interaction.editReply({ embeds: [E.error('Too Many Roles', 'Maximum of 10 support roles.')] });
  }

  const updated = [...current, role.id];
  await Guild.findOneAndUpdate(
    { guildId: interaction.guildId },
    { $set: { 'tickets.supportRoles': updated, 'tickets.supportRole': updated[0] } },
    { upsert: true }
  );

  await interaction.editReply({
    embeds: [E.success('Support Role Added', `<@&${role.id}> is now a support role.\n\n**All support roles:**\n${updated.map(r => `<@&${r}>`).join('\n')}`)]
  });
}

// ── REMOVE ROLE ───────────────────────────────────────────────
else if (sub === 'removerole') {
  if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
  await interaction.deferReply({ ephemeral: true });

  const role = interaction.options.getRole('role');
  const cfg = await Guild.findOne({ guildId: interaction.guildId });
  const current = cfg?.tickets?.supportRoles || [];

  if (!current.includes(role.id)) {
    return interaction.editReply({ embeds: [E.warn('Not Found', `<@&${role.id}> is not a support role.`)] });
  }

  const updated = current.filter(r => r !== role.id);
  await Guild.findOneAndUpdate(
    { guildId: interaction.guildId },
    { $set: { 'tickets.supportRoles': updated, 'tickets.supportRole': updated[0] || null } },
    { upsert: true }
  );

  await interaction.editReply({
    embeds: [E.success('Support Role Removed', `<@&${role.id}> removed.\n\n**Remaining roles:**\n${updated.length ? updated.map(r => `<@&${r}>`).join('\n') : '*None*'}`)]
  });
}

// ── VIEW ROLES ────────────────────────────────────────────────
else if (sub === 'roles') {
  await interaction.deferReply({ ephemeral: true });
  const cfg = await Guild.findOne({ guildId: interaction.guildId });
  const roles = cfg?.tickets?.supportRoles || (cfg?.tickets?.supportRole ? [cfg.tickets.supportRole] : []);

  if (!roles.length) {
    return interaction.editReply({ embeds: [E.info('No Support Roles', 'Run `/ticket setup` to configure support roles.')] });
  }

  const fields = roles.map((r, i) => ({
    name: `Role #${i + 1}`,
    value: `<@&${r}> \`(${r})\``,
    inline: true,
  }));

  await interaction.editReply({
    embeds: [E.ticket(`Support Roles (${roles.length})`, 'These roles can see and manage all tickets.', fields)]
  });
}

// ── PANEL ─────────────────────────────────────────────────────
else if (sub === 'panel') {
  if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
  await interaction.deferReply({ ephemeral: true });

  const panelEmbed = E.ticket(
    '🎫 Support Tickets — DOT Esport',
    '> Need help? Click the button below to open a support ticket.\n> Our team will assist you as soon as possible.\n\n' +
    '`🎮` **Game Support**  •  In-game or bot issues\n' +
    '`🏆` **Tournament**  •  Bracket and registration help\n' +
    '`💎` **Premium**  •  Subscription and billing\n' +
    '`🐛` **Bug Report**  •  Found something broken?\n' +
    '`💬` **General**  •  Any other question\n' +
    '`🚨` **Report User**  •  Report a member',
    [{ name: '📋 Rules', value: '• Be respectful to staff\n• One ticket at a time\n• Describe your issue clearly', inline: false }]
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_open_general')
      .setLabel('Open a Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫')
  );

  await interaction.channel.send({ embeds: [panelEmbed], components: [row] });
  await interaction.editReply({ embeds: [E.success('Panel Posted ✅', `Ticket panel sent to <#${interaction.channelId}>.`)] });
}

// ── CREATE ────────────────────────────────────────────────────
else if (sub === 'create') {
  await interaction.deferReply({ ephemeral: true });

  const subject = interaction.options.getString('subject');
  const type    = interaction.options.getString('type') || 'general';

  const cfg = await Guild.findOne({ guildId: interaction.guildId });
  if (!cfg?.tickets?.enabled) {
    return interaction.editReply({ embeds: [E.error('Not Configured', 'Ticket system is not set up. Ask an admin to run `/ticket setup`.')] });
  }

  // Check max open tickets
  const maxOpen  = cfg.tickets.maxOpen || 1;
  const existing = await Ticket.find({ userId: interaction.user.id, guildId: interaction.guildId, status: { $in: ['open', 'claimed'] } });
  if (existing.length >= maxOpen) {
    const links = existing.map(t => `<#${t.channelId}>`).join(', ');
    return interaction.editReply({ embeds: [E.warn('Ticket Limit Reached', `You already have ${existing.length} open ticket(s): ${links}\n\nMax allowed: **${maxOpen}**`)] });
  }

  // Get all support roles
  const supportRoles = cfg.tickets.supportRoles?.length
    ? cfg.tickets.supportRoles
    : cfg.tickets.supportRole ? [cfg.tickets.supportRole] : [];

  // Increment counter
  cfg.tickets.counter = (cfg.tickets.counter || 0) + 1;
  await cfg.save();

  const ticketId = `ticket-${String(cfg.tickets.counter).padStart(4, '0')}`;

  // Create channel with all support roles as overwrites
  const ch = await interaction.guild.channels.create({
    name: ticketId,
    type: ChannelType.GuildText,
    parent: cfg.tickets.categoryId || null,
    permissionOverwrites: buildPerms(interaction.guild, interaction.user.id, supportRoles),
    topic: `🎫 ${subject} | ${type} | Opened by ${interaction.user.tag}`,
  });

  await Ticket.create({
    ticketId,
    guildId:   interaction.guildId,
    channelId: ch.id,
    userId:    interaction.user.id,
    type,
    subject,
    status: 'open',
  });

  const typeEmoji = { game: '🎮', tournament: '🏆', premium: '💎', bug: '🐛', general: '💬', report: '🚨' };

  const openEmbed = E.ticket(
    `${typeEmoji[type] || '💬'} ${subject}`,
    `Welcome <@${interaction.user.id}>!\nOur support team will be with you shortly.\n\n**Please describe your issue in detail below.**`,
    [
      { name: '🏷️ Ticket ID', value: `\`${ticketId}\``, inline: true },
      { name: `${typeEmoji[type]} Type`, value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
      { name: '📊 Priority', value: '🟡 Normal', inline: true },
    ]
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`t_claim_${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
    new ButtonBuilder().setCustomId(`t_close_${ticketId}`).setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
  );

  const pingContent = [
    `<@${interaction.user.id}>`,
    ...supportRoles.map(r => `<@&${r}>`),
  ].join(' ');

  await ch.send({ content: pingContent, embeds: [openEmbed], components: [row] });
  await interaction.editReply({ embeds: [E.success('Ticket Created! 🎫', `Your ticket is ready: <#${ch.id}>`)] });
}

// ── CLOSE ─────────────────────────────────────────────────────
else if (sub === 'close') {
  await interaction.deferReply();

  const reason = interaction.options.getString('reason') || 'No reason provided';
  const t = await Ticket.findOne({ channelId: interaction.channelId, status: { $in: ['open', 'claimed'] } });

  if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'This command must be run inside an active ticket channel.')] });

  const cfg = await Guild.findOne({ guildId: interaction.guildId });
  const canClose = t.userId === interaction.user.id || await isStaff(interaction.member, cfg);
  if (!canClose) return interaction.editReply({ embeds: [E.error('No Permission', 'Only the ticket creator or support staff can close this ticket.')] });

  t.status   = 'closed';
  t.closedAt = new Date();
  t.closedBy = interaction.user.id;
  t.reason   = reason;
  await t.save();

  // Save transcript to log channel before deleting
  if (cfg?.tickets?.logChannel || cfg?.channels?.ticketLogs) {
    try {
      const msgs   = await interaction.channel.messages.fetch({ limit: 100 });
      const sorted = [...msgs.values()].reverse();
      const text   = sorted.map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || '[Embed/Attachment]'}`).join('\n');
      const att    = new AttachmentBuilder(Buffer.from(text, 'utf-8'), { name: `transcript-${t.ticketId}.txt` });
      const logCh  = await client.channels.fetch(cfg.tickets.logChannel || cfg.channels.ticketLogs).catch(() => null);
      if (logCh) {
        await logCh.send({
          embeds: [E.ticket(
            `Ticket Closed — ${t.ticketId}`,
            `**Subject:** ${t.subject || 'N/A'}`,
            [
              { name: '👤 Opened by', value: `<@${t.userId}>`, inline: true },
              { name: '🔒 Closed by', value: `<@${interaction.user.id}>`, inline: true },
              { name: '📋 Reason', value: reason, inline: false },
              { name: '⏰ Duration', value: `<t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:R>`, inline: true },
            ]
          )],
          files: [att],
        });
      }
    } catch {}
  }

  await interaction.editReply({ embeds: [E.ticket('🔒 Closing Ticket', `This ticket will be deleted in **5 seconds**.\n**Reason:** ${reason}`)] });
  setTimeout(async () => {
    try { await interaction.channel.delete(`Ticket closed by ${interaction.user.tag}: ${reason}`); } catch {}
  }, 5000);
}

// ── CLAIM ─────────────────────────────────────────────────────
else if (sub === 'claim') {
  await interaction.deferReply();

  const t = await Ticket.findOne({ channelId: interaction.channelId, status: { $in: ['open', 'claimed'] } });
  if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'Run this inside a ticket channel.')] });

  const cfg = await Guild.findOne({ guildId: interaction.guildId });
  if (!(await isStaff(interaction.member, cfg))) {
    return interaction.editReply({ embeds: [E.error('Staff Only', 'Only support staff can claim tickets.')] });
  }
  if (t.claimedBy) {
    return interaction.editReply({ embeds: [E.warn('Already Claimed', `This ticket is already claimed by <@${t.claimedBy}>.`)] });
  }

  t.claimedBy = interaction.user.id;
  t.status    = 'claimed';
  await t.save();

  await interaction.editReply({
    embeds: [E.ticket('Ticket Claimed 🎫', `<@${interaction.user.id}> has claimed this ticket and will assist you.`)]
  });
}

// ── UNCLAIM ───────────────────────────────────────────────────
else if (sub === 'unclaim') {
  await interaction.deferReply();

  const t = await Ticket.findOne({ channelId: interaction.channelId });
  if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'Run this inside a ticket channel.')] });
  if (t.claimedBy !== interaction.user.id && !(await requirePerm(interaction, PermissionFlagsBits.ManageChannels, true))) {
    return interaction.editReply({ embeds: [E.error('No Permission', 'You can only unclaim tickets you claimed.')] });
  }

  t.claimedBy = null;
  t.status    = 'open';
  await t.save();

  await interaction.editReply({ embeds: [E.ticket('Ticket Unclaimed', 'This ticket is now available for any staff member to claim.')] });
}

// ── ADD USER ──────────────────────────────────────────────────
else if (sub === 'add') {
  await interaction.deferReply();

  const user = interaction.options.getUser('user');
  await interaction.channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    AttachFiles: true,
    ReadMessageHistory: true,
  });
  await interaction.editReply({ embeds: [E.ticket('User Added ✅', `<@${user.id}> has been added to this ticket.`)] });
}

// ── REMOVE USER ───────────────────────────────────────────────
else if (sub === 'remove') {
  await interaction.deferReply();

  const user = interaction.options.getUser('user');
  const t    = await Ticket.findOne({ channelId: interaction.channelId });

  if (t?.userId === user.id) {
    return interaction.editReply({ embeds: [E.error('Cannot Remove', 'Cannot remove the ticket creator.')] });
  }

  await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
  await interaction.editReply({ embeds: [E.ticket('User Removed', `<@${user.id}> has been removed from this ticket.`)] });
}

// ── RENAME ────────────────────────────────────────────────────
else if (sub === 'rename') {
  await interaction.deferReply();

  const name = interaction.options.getString('name').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100);
  await interaction.channel.setName(name, `Renamed by ${interaction.user.tag}`);
  await interaction.editReply({ embeds: [E.ticket('Channel Renamed', `Ticket channel renamed to **${name}**.`)] });
}

// ── PRIORITY ──────────────────────────────────────────────────
else if (sub === 'priority') {
  await interaction.deferReply();

  const level = interaction.options.getString('level');
  const t     = await Ticket.findOne({ channelId: interaction.channelId });
  if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'Run this inside a ticket channel.')] });

  t.priority = level;
  await t.save();

  const icons = { low: '🟢', normal: '🟡', high: '🔴', critical: '🚨' };
  await interaction.editReply({
    embeds: [E.ticket('Priority Updated', `Ticket priority set to ${icons[level]} **${level.toUpperCase()}**.`)]
  });
}

// ── TRANSCRIPT ────────────────────────────────────────────────
else if (sub === 'transcript') {
  await interaction.deferReply();

  const msgs   = await interaction.channel.messages.fetch({ limit: 100 });
  const sorted = [...msgs.values()].reverse();
  const header = `Ticket Transcript — ${interaction.channel.name}\nGenerated: ${new Date().toISOString()}\nMessages: ${sorted.length}\n${'─'.repeat(60)}\n\n`;
  const body   = sorted.map(m =>
    `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}\n${m.content || '[Embed/Attachment]'}\n`
  ).join('\n');

  const att = new AttachmentBuilder(Buffer.from(header + body, 'utf-8'), {
    name: `transcript-${interaction.channel.name}.txt`,
  });

  await interaction.editReply({
    embeds: [E.ticket('Transcript Saved 📄', `**${sorted.length}** messages saved from **${interaction.channel.name}**.`)],
    files: [att],
  });
}

// ── LIST ──────────────────────────────────────────────────────
else if (sub === 'list') {
  if (!(await requirePerm(interaction, PermissionFlagsBits.ManageChannels))) return;
  await interaction.deferReply({ ephemeral: true });

  const tickets = await Ticket.find({ guildId: interaction.guildId, status: { $in: ['open', 'claimed'] } }).sort({ createdAt: -1 });
  if (!tickets.length) return interaction.editReply({ embeds: [E.info('No Open Tickets 🎉', 'All tickets are closed.')] });

  const priorityIcon = { low: '🟢', normal: '🟡', high: '🔴', critical: '🚨' };
  const fields = tickets.slice(0, 10).map(t => ({
    name: `${priorityIcon[t.priority] || '🟡'} ${t.ticketId} — ${t.type}`,
    value: [
      `👤 <@${t.userId}>`,
      t.claimedBy ? `🎫 Claimed by <@${t.claimedBy}>` : '⏳ Unclaimed',
      `📝 ${t.subject?.slice(0, 50) || 'No subject'}`,
      `🕐 <t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:R>`,
    ].join('  •  '),
    inline: false,
  }));

  await interaction.editReply({
    embeds: [E.ticket(
      `Open Tickets — ${tickets.length}`,
      tickets.length > 10 ? `Showing 10 of ${tickets.length} tickets.` : null,
      fields
    )]
  });
}

// ── INFO ──────────────────────────────────────────────────────
else if (sub === 'info') {
  await interaction.deferReply({ ephemeral: true });

  const t = await Ticket.findOne({ channelId: interaction.channelId });
  if (!t) return interaction.editReply({ embeds: [E.error('Not a Ticket', 'This is not a ticket channel.')] });

  const priorityIcon = { low: '🟢', normal: '🟡', high: '🔴', critical: '🚨' };
  const statusIcon   = { open: '🟢', claimed: '🔵', closed: '🔴' };

  await interaction.editReply({
    embeds: [E.ticket(`Ticket Info — ${t.ticketId}`, t.subject || 'No subject', [
      { name: '🏷️ ID',         value: `\`${t.ticketId}\``,                                    inline: true },
      { name: '📊 Status',      value: `${statusIcon[t.status] || '⚪'} ${t.status}`,           inline: true },
      { name: '📌 Priority',    value: `${priorityIcon[t.priority] || '🟡'} ${t.priority || 'normal'}`, inline: true },
      { name: '💬 Type',        value: t.type || 'general',                                    inline: true },
      { name: '👤 Opened by',   value: `<@${t.userId}>`,                                       inline: true },
      { name: '🎫 Claimed by',  value: t.claimedBy ? `<@${t.claimedBy}>` : 'Unclaimed',        inline: true },
      { name: '🕐 Opened',      value: `<t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:F>`, inline: false },
    ])]
  });
}

}
};

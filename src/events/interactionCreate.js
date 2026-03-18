const logger = require(’../utils/logger’);
const E = require(’../utils/embeds’);
const { User } = require(’../models/index’);

module.exports = {
name: ‘interactionCreate’,
async execute(interaction, client) {

```
// ── Button interactions ───────────────────────────────────────
if (interaction.isButton()) {
  try {
    const id = interaction.customId;

    // ticket_open_general — open ticket panel button
    if (id === 'ticket_open_general' || id.startsWith('ticket_open_')) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
      }
      const ticketCmd = client.commands.get('ticket');
      if (ticketCmd) {
        // Fake the subcommand as 'create' with type 'general'
        await handleTicketOpen(interaction, client);
      }
      return;
    }

    // t_claim_ticket-0001 — claim button inside ticket channel
    if (id.startsWith('t_claim_')) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false }).catch(() => {});
      }
      await handleTicketClaim(interaction, client, id.replace('t_claim_', ''));
      return;
    }

    // t_close_ticket-0001 — close button inside ticket channel
    if (id.startsWith('t_close_')) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false }).catch(() => {});
      }
      await handleTicketClose(interaction, client, id.replace('t_close_', ''));
      return;
    }

    // t_join_xxxx — tournament join button
    if (id.startsWith('t_join_')) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
      }
      await handleTournamentJoin(interaction, client, id.replace('t_join_', ''));
      return;
    }

    // t_info_xxxx — tournament info button
    if (id.startsWith('t_info_')) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
      }
      await handleTournamentInfo(interaction, client, id.replace('t_info_', ''));
      return;
    }

    // Fallback: try command handleButton if using colon format
    const commandName = id.split(':')[0];
    const command = client.commands.get(commandName);
    if (command?.handleButton) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(() => {});
      }
      await command.handleButton(interaction, client);
      return;
    }

    logger.warn(`[BUTTON] No handler for: ${id}`);

  } catch (error) {
    logger.error(`[BUTTON] Error: ${error.message}`);
    try {
      const msg = { embeds: [E.error('Error', 'Failed to process this button.')], ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    } catch {}
  }
  return;
}

// ── Select menu interactions ──────────────────────────────────
if (interaction.isAnySelectMenu()) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate().catch(() => {});
    }
    const commandName = interaction.customId.split(':')[0];
    const command = client.commands.get(commandName);
    if (command?.handleSelectMenu) {
      await command.handleSelectMenu(interaction, client);
    }
  } catch (error) {
    logger.error(`[SELECT] Error: ${error.message}`);
    try {
      if (!interaction.replied) {
        await interaction.followUp({ embeds: [E.error('Error', 'Failed to process selection.')], ephemeral: true }).catch(() => {});
      }
    } catch {}
  }
  return;
}

// ── Modal submissions ─────────────────────────────────────────
if (interaction.isModalSubmit()) {
  try {
    const commandName = interaction.customId.split(':')[0];
    const command = client.commands.get(commandName);
    if (command?.handleModal) {
      await command.handleModal(interaction, client);
    }
  } catch (error) {
    logger.error(`[MODAL] Error: ${error.message}`);
    try {
      if (!interaction.replied) {
        await interaction.reply({ embeds: [E.error('Error', 'Failed to process form.')], ephemeral: true }).catch(() => {});
      }
    } catch {}
  }
  return;
}

// ── Slash commands ────────────────────────────────────────────
if (!interaction.isChatInputCommand()) return;

// Maintenance mode
if (global.maintenanceMode) {
  const owners = (process.env.OWNER_IDS || '').split(',').map(s => s.trim());
  if (!owners.includes(interaction.user.id)) {
    return interaction.reply({
      embeds: [E.warn('🔧 Maintenance Mode',
        `DeS Bot™ is currently under maintenance.\n**Reason:** ${global.maintenanceReason || 'Scheduled maintenance'}\n\nPlease check back soon!`
      )],
      ephemeral: true,
    });
  }
}

// Blacklist check
try {
  const u = await User.findOne({ userId: interaction.user.id });
  if (u?.blacklisted) {
    return interaction.reply({
      embeds: [E.error('Blacklisted',
        `You are blacklisted from DeS Bot™.\n**Reason:** ${u.blacklistReason || 'No reason'}\n\nContact support at [dotsbot.site](http://www.dotsbot.site) to appeal.`
      )],
      ephemeral: true,
    });
  }
} catch (e) {
  logger.error(`Blacklist check error: ${e.message}`);
}

const command = client.commands.get(interaction.commandName);
if (!command) {
  logger.warn(`Command not found: ${interaction.commandName}`);
  return;
}

try {
  await command.execute(interaction, client);
  try {
    await User.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { xp: 5 } }, { upsert: true });
  } catch {}
  logger.info(`[CMD] ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name || 'DM'}`);
} catch (error) {
  logger.error(`Command error [/${interaction.commandName}]: ${error.message}`);
  const errEmbed = E.error('Something Went Wrong', `\`\`\`${error.message.slice(0, 200)}\`\`\``);
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [errEmbed] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
    }
  } catch {}
}
```

}
};

// ── Button handler functions ───────────────────────────────────────

async function handleTicketOpen(interaction, client) {
const { Guild, Ticket } = require(’../models/index’);
const { ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require(‘discord.js’);

const cfg = await Guild.findOne({ guildId: interaction.guildId });
if (!cfg?.tickets?.enabled) {
return interaction.editReply({ embeds: [E.error(‘Not Configured’, ‘The ticket system is not set up. Ask an admin to run `/ticket setup`.’)] });
}

const maxOpen = cfg.tickets.maxOpen || 1;
const existing = await Ticket.find({ userId: interaction.user.id, guildId: interaction.guildId, status: { $in: [‘open’, ‘claimed’] } });
if (existing.length >= maxOpen) {
const links = existing.map(t => `<#${t.channelId}>`).join(’, ’);
return interaction.editReply({ embeds: [E.warn(‘Ticket Limit’, `You already have ${existing.length} open ticket(s): ${links}`)] });
}

const supportRoles = cfg.tickets.supportRoles?.length
? cfg.tickets.supportRoles
: cfg.tickets.supportRole ? [cfg.tickets.supportRole] : [];

cfg.tickets.counter = (cfg.tickets.counter || 0) + 1;
await cfg.save();

const ticketId = `ticket-${String(cfg.tickets.counter).padStart(4, '0')}`;

const perms = [
{ id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
{ id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
];
for (const roleId of supportRoles) {
if (roleId && interaction.guild.roles.cache.has(roleId)) {
perms.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] });
}
}

const ch = await interaction.guild.channels.create({
name: ticketId,
type: ChannelType.GuildText,
parent: cfg.tickets.categoryId || null,
permissionOverwrites: perms,
topic: `🎫 General support | Opened by ${interaction.user.tag}`,
});

await Ticket.create({
ticketId,
guildId: interaction.guildId,
channelId: ch.id,
userId: interaction.user.id,
type: ‘general’,
subject: ‘Support Request’,
status: ‘open’,
});

const openEmbed = E.ticket(
`💬 Support Request`,
`Welcome <@${interaction.user.id}>! Support will be with you shortly.\n\n**Please describe your issue in detail.**`,
[
{ name: ‘🏷️ Ticket ID’, value: `\`${ticketId}``, inline: true },
{ name: ‘💬 Type’, value: ‘General’, inline: true },
{ name: ‘📊 Priority’, value: ‘🟡 Normal’, inline: true },
]
);

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`t_claim_${ticketId}`).setLabel(‘Claim’).setStyle(ButtonStyle.Primary).setEmoji(‘🎫’),
new ButtonBuilder().setCustomId(`t_close_${ticketId}`).setLabel(‘Close’).setStyle(ButtonStyle.Danger).setEmoji(‘🔒’)
);

const pingContent = [`<@${interaction.user.id}>`, …supportRoles.map(r => `<@&${r}>`)].join(’ ’);
await ch.send({ content: pingContent, embeds: [openEmbed], components: [row] });
await interaction.editReply({ embeds: [E.success(‘Ticket Created! 🎫’, `Your ticket is ready: <#${ch.id}>`)] });
}

async function handleTicketClaim(interaction, client, ticketId) {
const { Ticket, Guild } = require(’../models/index’);
const { PermissionFlagsBits } = require(‘discord.js’);

const t = await Ticket.findOne({ ticketId, guildId: interaction.guildId });
if (!t) return interaction.editReply({ embeds: [E.error(‘Not Found’, ‘Ticket not found.’)] });
if (t.claimedBy) return interaction.editReply({ embeds: [E.warn(‘Already Claimed’, `Already claimed by <@${t.claimedBy}>.`)] });

const cfg = await Guild.findOne({ guildId: interaction.guildId });
const supportRoles = cfg?.tickets?.supportRoles?.length
? cfg.tickets.supportRoles
: cfg?.tickets?.supportRole ? [cfg.tickets.supportRole] : [];
const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
|| supportRoles.some(r => interaction.member.roles.cache.has(r));

if (!isStaff) return interaction.editReply({ embeds: [E.error(‘Staff Only’, ‘Only support staff can claim tickets.’)] });

t.claimedBy = interaction.user.id;
t.status = ‘claimed’;
await t.save();

await interaction.editReply({ embeds: [E.ticket(‘Ticket Claimed 🎫’, `<@${interaction.user.id}> has claimed this ticket.`)] });
}

async function handleTicketClose(interaction, client, ticketId) {
const { Ticket, Guild } = require(’../models/index’);
const { AttachmentBuilder } = require(‘discord.js’);

const t = await Ticket.findOne({ ticketId, guildId: interaction.guildId });
if (!t) return interaction.editReply({ embeds: [E.error(‘Not Found’, ‘Ticket not found.’)] });

const cfg = await Guild.findOne({ guildId: interaction.guildId });
const supportRoles = cfg?.tickets?.supportRoles?.length
? cfg.tickets.supportRoles
: cfg?.tickets?.supportRole ? [cfg.tickets.supportRole] : [];
const { PermissionFlagsBits } = require(‘discord.js’);
const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
|| supportRoles.some(r => interaction.member.roles.cache.has(r));
const isOwner = t.userId === interaction.user.id;

if (!isStaff && !isOwner) {
return interaction.editReply({ embeds: [E.error(‘No Permission’, ‘Only the ticket creator or support staff can close this.’)] });
}

t.status = ‘closed’;
t.closedAt = new Date();
t.closedBy = interaction.user.id;
t.reason = ‘Closed via button’;
await t.save();

// Auto-transcript to log channel
const logChannelId = cfg?.tickets?.logChannel || cfg?.channels?.ticketLogs;
if (logChannelId) {
try {
const msgs = await interaction.channel.messages.fetch({ limit: 100 });
const sorted = […msgs.values()].reverse();
const text = sorted.map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || '[Embed/Attachment]'}`).join(’\n’);
const att = new AttachmentBuilder(Buffer.from(text, ‘utf-8’), { name: `transcript-${t.ticketId}.txt` });
const logCh = await client.channels.fetch(logChannelId).catch(() => null);
if (logCh) {
await logCh.send({
embeds: [E.ticket(`Ticket Closed — ${t.ticketId}`, `**Subject:** ${t.subject || 'N/A'}`, [
{ name: ‘👤 Opened by’, value: `<@${t.userId}>`, inline: true },
{ name: ‘🔒 Closed by’, value: `<@${interaction.user.id}>`, inline: true },
])],
files: [att],
});
}
} catch {}
}

await interaction.editReply({ embeds: [E.ticket(‘🔒 Closing Ticket’, ‘This ticket will be deleted in **5 seconds**.’)] });
setTimeout(async () => {
try { await interaction.channel.delete(`Closed by ${interaction.user.tag}`); } catch {}
}, 5000);
}

async function handleTournamentJoin(interaction, client, tournamentId) {
const { Tournament } = require(’../models/index’);
const crypto = require(‘crypto’);
const genId = () => crypto.randomBytes(4).toString(‘hex’);

const t = await Tournament.findOne({ id: tournamentId, guildId: interaction.guildId });
if (!t) return interaction.editReply({ embeds: [E.error(‘Not Found’, `Tournament not found.`)] });
if (t.status !== ‘open’) return interaction.editReply({ embeds: [E.error(‘Closed’, ‘Registration is closed.’)] });
if (t.teams.length >= t.maxTeams) return interaction.editReply({ embeds: [E.error(‘Full’, ‘Tournament is full.’)] });
if (t.teams.some(tm => tm.captainId === interaction.user.id || tm.members.includes(interaction.user.id))) {
return interaction.editReply({ embeds: [E.warn(‘Already Registered’, ‘You are already in this tournament.’)] });
}

const teamId = genId();
t.teams.push({ teamId, name: `${interaction.user.username}'s Team`, captainId: interaction.user.id, members: [interaction.user.id] });
await t.save();

await interaction.editReply({ embeds: [E.success(‘Registered! ✅’, `You joined **${t.name}**`, [
{ name: ‘👥 Teams’, value: `${t.teams.length}/${t.maxTeams}`, inline: true },
])] });
}

async function handleTournamentInfo(interaction, client, tournamentId) {
const { Tournament } = require(’../models/index’);
const t = await Tournament.findOne({ id: tournamentId, guildId: interaction.guildId });
if (!t) return interaction.editReply({ embeds: [E.error(‘Not Found’, ‘Tournament not found.’)] });

await interaction.editReply({ embeds: [E.tourney(`${t.name}`, t.rules || ‘’, [
{ name: ‘🏷️ ID’, value: `\`${t.id}``, inline: true }, { name: '🎮 Game', value: t.game, inline: true }, { name: '👥 Teams', value: `${t.teams.length}/${t.maxTeams}`, inline: true },
{ name: ‘🏆 Prize’, value: t.prize || ‘None’, inline: true },
{ name: ‘📊 Status’, value: t.status, inline: true },
])] });
}
const logger = require('../utils/logger');
const E = require('../utils/embeds');
const { User } = require('../models/index');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── Button interactions ───────────────────────────────────────
    if (interaction.isButton()) {
      try {
        const id = interaction.customId;

        if (id === 'ticket_open_general' || id.startsWith('ticket_open_')) {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});
          }
          await handleTicketOpen(interaction, client);
          return;
        }

        if (id.startsWith('t_claim_')) {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false }).catch(() => {});
          }
          await handleTicketClaim(interaction, client, id.replace('t_claim_', ''));
          return;
        }

        if (id.startsWith('t_close_')) {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false }).catch(() => {});
          }
          await handleTicketClose(interaction, client, id.replace('t_close_', ''));
          return;
        }

        if (id.startsWith('t_join_')) {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});
          }
          await handleTournamentJoin(interaction, client, id.replace('t_join_', ''));
          return;
        }

        if (id.startsWith('t_info_')) {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});
          }
          await handleTournamentInfo(interaction, client, id.replace('t_info_', ''));
          return;
        }

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
      }
      return;
    }

    // ── Slash commands ────────────────────────────────────────────
    if (!interaction.isChatInputCommand()) return;

    if (global.maintenanceMode) {
      const owners = (process.env.OWNER_IDS || '').split(',').map(s => s.trim());
      if (!owners.includes(interaction.user.id)) {
        return interaction.reply({
          embeds: [E.warn('🔧 Maintenance Mode', `DeS Bot™ is under maintenance.`)],
          ephemeral: true,
        });
      }
    }

    try {
      const u = await User.findOne({ userId: interaction.user.id });
      if (u?.blacklisted) {
        return interaction.reply({
          embeds: [E.error('Blacklisted', `You are blacklisted.`)],
          ephemeral: true,
        });
      }
    } catch (e) {
      logger.error(`Blacklist error: ${e.message}`);
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
      await User.findOneAndUpdate(
        { userId: interaction.user.id },
        { $inc: { xp: 5 } },
        { upsert: true }
      );
    } catch (error) {
      logger.error(`Command error: ${error.message}`);
    }
  }
};

// ── HANDLERS ─────────────────────────────────────────────────

async function handleTicketOpen(interaction, client) {
  const { Guild, Ticket } = require('../models/index');
  const { ChannelType, PermissionFlagsBits } = require('discord.js');

  const cfg = await Guild.findOne({ guildId: interaction.guildId });
  if (!cfg?.tickets?.enabled) {
    return interaction.editReply({ embeds: [E.error('Not Configured', 'Ticket system not set up.')] });
  }

  cfg.tickets.counter = (cfg.tickets.counter || 0) + 1;
  await cfg.save();

  const ticketId = `ticket-${String(cfg.tickets.counter).padStart(4, '0')}`;

  const ch = await interaction.guild.channels.create({
    name: ticketId,
    type: ChannelType.GuildText,
  });

  await Ticket.create({
    ticketId,
    guildId: interaction.guildId,
    channelId: ch.id,
    userId: interaction.user.id,
    type: 'general',
    status: 'open',
  });

  await interaction.editReply({
    embeds: [E.success('Ticket Created', `<#${ch.id}>`)]
  });
}

async function handleTicketClaim() {}
async function handleTicketClose() {}
async function handleTournamentJoin() {}
async function handleTournamentInfo() {}
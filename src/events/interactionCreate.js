const logger = require('../utils/logger');
const E = require('../utils/embeds');
const { User } = require('../models/index');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ── Button interactions ───────────────────────────────────
    if (interaction.isButton()) {
      try {
        // Parse button customId to find command: "commandName:action:data"
        const [commandName] = interaction.customId.split(':');
        const command = client.commands.get(commandName);
        
        if (command?.handleButton) {
          await command.handleButton(interaction, client);
        } else {
          // Silently ignore unknown buttons (they might be from old commands)
          await interaction.deferUpdate().catch(() => {});
        }
      } catch (error) {
        logger.error(`[BUTTON] Error: ${error.message}`);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [E.error('Error', 'Failed to process button.')], ephemeral: true });
          }
        } catch {}
      }
      return;
    }

    // ── Select menu interactions ──────────────────────────────
    if (interaction.isAnySelectMenu()) {
      try {
        const [commandName] = interaction.customId.split(':');
        const command = client.commands.get(commandName);
        
        if (command?.handleSelectMenu) {
          await command.handleSelectMenu(interaction, client);
        } else {
          await interaction.deferUpdate().catch(() => {});
        }
      } catch (error) {
        logger.error(`[SELECT] Error: ${error.message}`);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [E.error('Error', 'Failed to process selection.')], ephemeral: true });
          }
        } catch {}
      }
      return;
    }

    // ── Modal submissions ─────────────────────────────────────
    if (interaction.isModalSubmit()) {
      try {
        const [commandName] = interaction.customId.split(':');
        const command = client.commands.get(commandName);
        
        if (command?.handleModal) {
          await command.handleModal(interaction, client);
        } else {
          await interaction.deferUpdate().catch(() => {});
        }
      } catch (error) {
        logger.error(`[MODAL] Error: ${error.message}`);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [E.error('Error', 'Failed to process form.')], ephemeral: true });
          }
        } catch {}
      }
      return;
    }

    // ── Chat input commands ───────────────────────────────────
    if (!interaction.isChatInputCommand()) return;

    // Maintenance mode
    if (global.maintenanceMode) {
      const owners = (process.env.OWNER_IDS || '').split(',').map(s => s.trim());
      if (!owners.includes(interaction.user.id)) {
        return interaction.reply({ embeds: [E.warn('🔧 Maintenance Mode', `DeS Bot™ is currently under maintenance.\n**Reason:** ${global.maintenanceReason || 'Scheduled maintenance'}\n\nPlease check back soon!`)], ephemeral: true });
      }
    }

    // Blacklist check
    try {
      const u = await User.findOne({ userId: interaction.user.id });
      if (u?.blacklisted) {
        return interaction.reply({ embeds: [E.error('Blacklisted', `You are blacklisted from DeS Bot™.\n**Reason:** ${u.blacklistReason || 'No reason'}\n\nContact support at [dotsbot.site](http://www.dotsbot.site) to appeal.`)], ephemeral: true });
      }
    } catch {}

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
      // XP for command usage
      try {
        await User.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { xp: 5 } }, { upsert: true });
      } catch {}
      logger.info(`[CMD] ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name || 'DM'}`);
    } catch (error) {
      logger.error(`Command error [/${interaction.commandName}]: ${error.message}`);
      const errEmbed = E.error('Something Went Wrong', `An unexpected error occurred.\n\`\`\`${error.message.slice(0, 200)}\`\`\``);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errEmbed] });
        } else {
          await interaction.reply({ embeds: [errEmbed], ephemeral: true });
        }
      } catch {}
    }
  }
};

const logger = require('../utils/logger');
const E = require('../utils/embeds');
const { User } = require('../models/index');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ── Button interactions ───────────────────────────────────
    if (interaction.isButton()) {
      try {
        // Always defer/acknowledge first
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferUpdate().catch(() => {});
        }

        // Parse customId: "commandName:action:data"
        const customId = interaction.customId;
        const parts = customId.split(':');
        const commandName = parts[0];
        
        const command = client.commands.get(commandName);
        
        if (command?.handleButton) {
          const result = await command.handleButton(interaction, client);
          if (result) {
            logger.info(`[BUTTON] ${interaction.user.tag} clicked ${customId}`);
          }
        } else {
          logger.warn(`[BUTTON] No handler for: ${customId}`);
        }
      } catch (error) {
        logger.error(`[BUTTON] Error: ${error.message}`);
        try {
          if (!interaction.replied) {
            await interaction.followUp({ embeds: [E.error('Error', 'Failed to process button.')], ephemeral: true }).catch(() => {});
          }
        } catch (e) {
          logger.error(`[BUTTON] Failed to send error message: ${e.message}`);
        }
      }
      return;
    }

    // ── Select menu interactions ──────────────────────────────
    if (interaction.isAnySelectMenu()) {
      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferUpdate().catch(() => {});
        }

        const customId = interaction.customId;
        const parts = customId.split(':');
        const commandName = parts[0];
        
        const command = client.commands.get(commandName);
        
        if (command?.handleSelectMenu) {
          const result = await command.handleSelectMenu(interaction, client);
          if (result) {
            logger.info(`[SELECT] ${interaction.user.tag} selected in ${customId}`);
          }
        } else {
          logger.warn(`[SELECT] No handler for: ${customId}`);
        }
      } catch (error) {
        logger.error(`[SELECT] Error: ${error.message}`);
        try {
          if (!interaction.replied) {
            await interaction.followUp({ embeds: [E.error('Error', 'Failed to process selection.')], ephemeral: true }).catch(() => {});
          }
        } catch (e) {
          logger.error(`[SELECT] Failed to send error message: ${e.message}`);
        }
      }
      return;
    }

    // ── Modal submissions ─────────────────────────────────────
    if (interaction.isModalSubmit()) {
      try {
        const customId = interaction.customId;
        const parts = customId.split(':');
        const commandName = parts[0];
        
        const command = client.commands.get(commandName);
        
        if (command?.handleModal) {
          const result = await command.handleModal(interaction, client);
          if (result) {
            logger.info(`[MODAL] ${interaction.user.tag} submitted ${customId}`);
          }
        } else {
          logger.warn(`[MODAL] No handler for: ${customId}`);
        }
      } catch (error) {
        logger.error(`[MODAL] Error: ${error.message}`);
        try {
          if (!interaction.replied) {
            await interaction.reply({ embeds: [E.error('Error', 'Failed to process form.')], ephemeral: true }).catch(() => {});
          }
        } catch (e) {
          logger.error(`[MODAL] Failed to send error message: ${e.message}`);
        }
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
          await interaction.editReply({ embeds: [errEmbed] }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
        }
      } catch (e) {
        logger.error(`Failed to send error message: ${e.message}`);
      }
    }
  }
};

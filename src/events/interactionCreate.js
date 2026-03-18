const logger = require('../utils/logger');
const E = require('../utils/embeds');
const { User } = require('../models/index');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ── Button interactions ───────────────────────────────────
    if (interaction.isButton()) {
      try {
        // DEFER IMMEDIATELY - before any other code
        await interaction.deferUpdate().catch(() => {});

        const customId = interaction.customId;
        const parts = customId.split(':');
        const commandName = parts[0];
        
        const command = client.commands.get(commandName);
        
        if (command?.handleButton) {
          try {
            const result = await command.handleButton(interaction, client);
            if (result) {
              logger.info(`[BUTTON] ${interaction.user.tag} clicked ${customId}`);
            }
          } catch (error) {
            logger.error(`[BUTTON] Handler error: ${error.message}`);
          }
        } else {
          logger.warn(`[BUTTON] No handler for: ${commandName}`);
        }
      } catch (error) {
        logger.error(`[BUTTON] Error: ${error.message}`);
      }
      return;
    }

    // ── Select menu interactions ──────────────────────────────
    if (interaction.isAnySelectMenu()) {
      try {
        await interaction.deferUpdate().catch(() => {});

        const customId = interaction.customId;
        const parts = customId.split(':');
        const commandName = parts[0];
        
        console.log(`[DEBUG SELECT] customId: ${customId}, commandName: ${commandName}`);
        
        const command = client.commands.get(commandName);
        
        console.log(`[DEBUG SELECT] Command found:`, !!command, `handleSelectMenu exists:`, !!command?.handleSelectMenu);
        
        if (command?.handleSelectMenu) {
          try {
            console.log(`[DEBUG SELECT] Calling handleSelectMenu for ${commandName}`);
            const result = await command.handleSelectMenu(interaction, client);
            console.log(`[DEBUG SELECT] Result:`, result);
            if (result) {
              logger.info(`[SELECT] ${interaction.user.tag} selected in ${customId}`);
            }
          } catch (error) {
            logger.error(`[SELECT] Handler error: ${error.message}`);
          }
        } else {
          logger.warn(`[SELECT] No handler for: ${commandName}`);
        }
      } catch (error) {
        logger.error(`[SELECT] Error: ${error.message}`);
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
          try {
            const result = await command.handleModal(interaction, client);
            if (result) {
              logger.info(`[MODAL] ${interaction.user.tag} submitted ${customId}`);
            }
          } catch (error) {
            logger.error(`[MODAL] Handler error: ${error.message}`);
          }
        } else {
          logger.warn(`[MODAL] No handler for: ${commandName}`);
        }
      } catch (error) {
        logger.error(`[MODAL] Error: ${error.message}`);
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
        return interaction.reply({ embeds: [E.error('Blacklisted', `You are blacklisted from DeS Bot™.\n**Reason:** ${u.blacklistReason || 'No reason'}\n\nContact support to appeal.`)], ephemeral: true });
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

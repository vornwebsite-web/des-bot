const logger = require('../utils/logger');
const E = require('../utils/embeds');
const { User } = require('../models/index');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ── Button interactions ───────────────────────────────────
    if (interaction.isButton()) {
      const buttonId = interaction.customId;
      
      // Find the command that handles this button
      let handled = false;
      for (const [, command] of client.commands) {
        if (command.handleButton && await command.handleButton(interaction, client)) {
          handled = true;
          logger.info(`[BUTTON] ${interaction.user.tag} clicked ${buttonId}`);
          break;
        }
      }
      
      if (!handled) {
        logger.warn(`[BUTTON] Unhandled button: ${buttonId}`);
      }
      return;
    }

    // ── Select menu interactions ──────────────────────────────
    if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu() || interaction.isRoleSelectMenu() || interaction.isMentionableSelectMenu() || interaction.isChannelSelectMenu()) {
      let handled = false;
      for (const [, command] of client.commands) {
        if (command.handleSelectMenu && await command.handleSelectMenu(interaction, client)) {
          handled = true;
          logger.info(`[SELECT] ${interaction.user.tag} selected in ${interaction.customId}`);
          break;
        }
      }
      
      if (!handled) {
        logger.warn(`[SELECT] Unhandled menu: ${interaction.customId}`);
      }
      return;
    }

    // ── Modal submissions ─────────────────────────────────────
    if (interaction.isModalSubmit()) {
      let handled = false;
      for (const [, command] of client.commands) {
        if (command.handleModal && await command.handleModal(interaction, client)) {
          handled = true;
          logger.info(`[MODAL] ${interaction.user.tag} submitted ${interaction.customId}`);
          break;
        }
      }
      
      if (!handled) {
        logger.warn(`[MODAL] Unhandled modal: ${interaction.customId}`);
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

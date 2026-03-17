const logger = require('../utils/logger');
const E = require('../utils/embeds');
const { User } = require('../models/index');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
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

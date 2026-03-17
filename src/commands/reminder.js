const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { parseDur } = require('../utils/helpers');
const { Reminder } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminder').setDescription('⏰ Reminder system')
    .addSubcommand(s => s.setName('set').setDescription('Set a reminder')
      .addStringOption(o => o.setName('time').setDescription('When e.g. 10m 2h 1d').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Reminder message').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('View your reminders'))
    .addSubcommand(s => s.setName('delete').setDescription('Delete a reminder')
      .addStringOption(o => o.setName('id').setDescription('Reminder ID').setRequired(true))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'set') {
      const time = interaction.options.getString('time');
      const message = interaction.options.getString('message');
      const triggerAt = parseDur(time);
      if (!triggerAt) return interaction.editReply({ embeds: [E.error('Invalid Time', 'Use `10m`, `2h`, `1d`.')] });
      const r = await Reminder.create({ userId: interaction.user.id, channelId: interaction.channelId, guildId: interaction.guildId, message, triggerAt });
      await interaction.editReply({ embeds: [E.success('Reminder Set!', `I'll remind you <t:${Math.floor(triggerAt.getTime() / 1000)}:R>!\n**Message:** ${message}`, [
        { name: '🆔 ID', value: `\`${r._id}\``, inline: true },
      ])] });

      const ms = require('ms');
      const delay = triggerAt.getTime() - Date.now();
      setTimeout(async () => {
        try {
          const ch = await client.channels.fetch(r.channelId);
          await ch.send({ content: `<@${r.userId}>`, embeds: [E.gold('⏰ Reminder!', r.message)] });
          await Reminder.findByIdAndUpdate(r._id, { done: true });
        } catch {}
      }, delay);
    }

    else if (sub === 'list') {
      const reminders = await Reminder.find({ userId: interaction.user.id, done: false }).sort({ triggerAt: 1 }).limit(10);
      if (!reminders.length) return interaction.editReply({ embeds: [E.info('No Reminders', 'You have no active reminders.')] });
      const fields = reminders.map(r => ({ name: `⏰ <t:${Math.floor(new Date(r.triggerAt).getTime() / 1000)}:R>`, value: `${r.message}\nID: \`${r._id}\``, inline: false }));
      await interaction.editReply({ embeds: [E.gold(`Your Reminders (${reminders.length})`, '', fields)] });
    }

    else if (sub === 'delete') {
      const id = interaction.options.getString('id');
      const r = await Reminder.findOne({ _id: id, userId: interaction.user.id }).catch(() => null);
      if (!r) return interaction.editReply({ embeds: [E.error('Not Found', 'Reminder not found.')] });
      await Reminder.findByIdAndDelete(id);
      await interaction.editReply({ embeds: [E.success('Reminder Deleted', `Reminder removed: *${r.message}*`)] });
    }
  }
};

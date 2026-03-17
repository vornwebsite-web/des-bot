const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { requirePerm, parseDur } = require('../utils/helpers');
const { Giveaway } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway').setDescription('🎉 Giveaway system')
    .addSubcommand(s => s.setName('create').setDescription('Start a giveaway')
      .addStringOption(o => o.setName('prize').setDescription('Prize').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Duration e.g. 1h 1d').setRequired(true))
      .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(20))
      .addRoleOption(o => o.setName('required-role').setDescription('Role required to enter')))
    .addSubcommand(s => s.setName('end').setDescription('End a giveaway early')
      .addStringOption(o => o.setName('message-id').setDescription('Giveaway message ID').setRequired(true)))
    .addSubcommand(s => s.setName('reroll').setDescription('Reroll a giveaway')
      .addStringOption(o => o.setName('message-id').setDescription('Giveaway message ID').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('List active giveaways'))
    .addSubcommand(s => s.setName('cancel').setDescription('Cancel a giveaway')
      .addStringOption(o => o.setName('message-id').setDescription('Giveaway message ID').setRequired(true))),

  async execute(interaction, client) {
    if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'create') {
      const prize = interaction.options.getString('prize');
      const duration = interaction.options.getString('duration');
      const winners = interaction.options.getInteger('winners') || 1;
      const reqRole = interaction.options.getRole('required-role');
      const ms = require('ms');
      const msVal = ms(duration);
      if (!msVal) return interaction.editReply({ embeds: [E.error('Invalid Duration', 'Use `1h`, `2d`, etc.')] });
      const endAt = new Date(Date.now() + msVal);

      const embed = E.make(E.C.GOLD2)
        .setTitle(`🎉  GIVEAWAY`)
        .setDescription(`**Prize:** ${prize}\n\nReact with 🎉 to enter!\n${reqRole ? `\n**Required Role:** <@&${reqRole.id}>` : ''}`)
        .addFields(
          { name: '🏆 Winners', value: `${winners}`, inline: true },
          { name: '⏰ Ends', value: `<t:${Math.floor(endAt.getTime() / 1000)}:R>`, inline: true },
          { name: '🎤 Hosted by', value: `<@${interaction.user.id}>`, inline: true },
        )
        .setFooter({ text: `Ends at  ·  DeS Bot™  ·  DOT Esport` }).setTimestamp(endAt);

      const msg = await interaction.channel.send({ embeds: [embed] });
      await msg.react('🎉');
      await Giveaway.create({ messageId: msg.id, channelId: interaction.channelId, guildId: interaction.guildId, hostId: interaction.user.id, prize, winners, endAt, requirements: { role: reqRole?.id } });
      await interaction.editReply({ embeds: [E.success('Giveaway Started!', `[Jump to giveaway](${msg.url})\n**Prize:** ${prize}\n**Ends:** <t:${Math.floor(endAt.getTime() / 1000)}:R>`)] });

      // Auto-end
      setTimeout(async () => {
        try {
          const gw = await Giveaway.findOne({ messageId: msg.id });
          if (gw?.ended) return;
          const fresh = await interaction.channel.messages.fetch(msg.id);
          const reaction = fresh.reactions.cache.get('🎉');
          const users = (await reaction?.users.fetch())?.filter(u => !u.bot) || new Map();
          const winnerList = [...users.values()].sort(() => Math.random() - 0.5).slice(0, winners);
          gw.ended = true;
          gw.entries = [...users.keys()];
          gw.winnerIds = winnerList.map(u => u.id);
          await gw.save();
          const endEmbed = E.make(E.C.GOLD2).setTitle('🎉  GIVEAWAY ENDED')
            .setDescription(`**Prize:** ${prize}\n**Winner(s):** ${winnerList.map(u => `<@${u.id}>`).join(', ') || 'No valid entries.'}`)
            .setFooter({ text: 'Ended  ·  DeS Bot™  ·  DOT Esport' }).setTimestamp();
          await fresh.edit({ embeds: [endEmbed] });
          if (winnerList.length) await interaction.channel.send({ content: `🎉 Congratulations ${winnerList.map(u => `<@${u.id}>`).join(', ')}! You won **${prize}**!`, embeds: [E.success('🎉 Giveaway Winner', `**Prize:** ${prize}`)] });
        } catch {}
      }, msVal);
    }

    else if (sub === 'end') {
      const msgId = interaction.options.getString('message-id');
      const gw = await Giveaway.findOne({ messageId: msgId, guildId: interaction.guildId });
      if (!gw) return interaction.editReply({ embeds: [E.error('Not Found', 'Giveaway not found.')] });
      if (gw.ended) return interaction.editReply({ embeds: [E.warn('Already Ended', 'This giveaway has already ended.')] });
      try {
        const ch = await client.channels.fetch(gw.channelId);
        const msg = await ch.messages.fetch(msgId);
        const reaction = msg.reactions.cache.get('🎉');
        const users = (await reaction?.users.fetch())?.filter(u => !u.bot) || new Map();
        const winnerList = [...users.values()].sort(() => Math.random() - 0.5).slice(0, gw.winners);
        gw.ended = true; gw.winnerIds = winnerList.map(u => u.id);
        await gw.save();
        await msg.edit({ embeds: [E.make(E.C.GOLD2).setTitle('🎉  GIVEAWAY ENDED').setDescription(`**Prize:** ${gw.prize}\n**Winner(s):** ${winnerList.map(u => `<@${u.id}>`).join(', ') || 'No entries.'}`).setTimestamp()] });
        if (winnerList.length) await ch.send({ content: `🎉 ${winnerList.map(u => `<@${u.id}>`).join(', ')} won **${gw.prize}**!` });
        await interaction.editReply({ embeds: [E.success('Giveaway Ended', `Winners: ${winnerList.map(u => `<@${u.id}>`).join(', ') || 'None'}`)] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Error', e.message)] }); }
    }

    else if (sub === 'reroll') {
      const msgId = interaction.options.getString('message-id');
      const gw = await Giveaway.findOne({ messageId: msgId, guildId: interaction.guildId });
      if (!gw || !gw.ended) return interaction.editReply({ embeds: [E.error('Not Found / Not Ended', 'Giveaway not found or not ended.')] });
      const entries = gw.entries.filter(id => !gw.winnerIds.includes(id));
      if (!entries.length) return interaction.editReply({ embeds: [E.error('No Entries', 'No eligible entries to reroll.')] });
      const newWinner = entries[Math.floor(Math.random() * entries.length)];
      await interaction.editReply({ embeds: [E.success('🎉 Rerolled!', `New winner: <@${newWinner}>! Congratulations on winning **${gw.prize}**!`)] });
    }

    else if (sub === 'list') {
      const giveaways = await Giveaway.find({ guildId: interaction.guildId, ended: false });
      if (!giveaways.length) return interaction.editReply({ embeds: [E.info('No Active Giveaways', 'No giveaways running.')] });
      const fields = giveaways.map(g => ({ name: `🎉 ${g.prize}`, value: `Ends: <t:${Math.floor(new Date(g.endAt).getTime() / 1000)}:R> • ${g.winners} winner(s)`, inline: false }));
      await interaction.editReply({ embeds: [E.make(E.C.GOLD2).setTitle(`🎉  Active Giveaways (${giveaways.length})`).addFields(fields).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    }

    else if (sub === 'cancel') {
      const msgId = interaction.options.getString('message-id');
      const gw = await Giveaway.findOne({ messageId: msgId, guildId: interaction.guildId });
      if (!gw) return interaction.editReply({ embeds: [E.error('Not Found', 'Giveaway not found.')] });
      await Giveaway.deleteOne({ messageId: msgId });
      try {
        const ch = await client.channels.fetch(gw.channelId);
        const msg = await ch.messages.fetch(msgId);
        await msg.edit({ embeds: [E.error('GIVEAWAY CANCELLED', `This giveaway for **${gw.prize}** was cancelled.`)] });
      } catch {}
      await interaction.editReply({ embeds: [E.success('Giveaway Cancelled', `**${gw.prize}** giveaway has been cancelled.`)] });
    }
  }
};

const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { User } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy').setDescription('🪙 Economy system')
    .addSubcommand(s => s.setName('balance').setDescription('Check your balance')
      .addUserOption(o => o.setName('user').setDescription('User (default: you)')))
    .addSubcommand(s => s.setName('daily').setDescription('Claim your daily coins'))
    .addSubcommand(s => s.setName('weekly').setDescription('Claim your weekly coins'))
    .addSubcommand(s => s.setName('pay').setDescription('Send coins to another user')
      .addUserOption(o => o.setName('user').setDescription('Recipient').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('leaderboard').setDescription('Richest users'))
    .addSubcommand(s => s.setName('gamble').setDescription('Gamble your coins')
      .addIntegerOption(o => o.setName('amount').setDescription('Amount to gamble').setRequired(true).setMinValue(1))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'balance') {
      const target = interaction.options.getUser('user') || interaction.user;
      let u = await User.findOne({ userId: target.id });
      if (!u) u = await User.create({ userId: target.id, username: target.username });
      await interaction.editReply({ embeds: [E.gold(`🪙 ${target.username}'s Balance`, '', [
        { name: '💰 Wallet', value: `**${u.coins || 0}** coins`, inline: true },
        { name: '⭐ Points', value: `**${u.points || 0}** pts`, inline: true },
      ]).setThumbnail(target.displayAvatarURL({ dynamic: true }))] });
    }

    else if (sub === 'daily') {
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u) u = await User.create({ userId: interaction.user.id, username: interaction.user.username });
      const now = new Date();
      const last = u.dailyLast ? new Date(u.dailyLast) : null;
      if (last && now - last < 86400000) {
        const next = new Date(last.getTime() + 86400000);
        return interaction.editReply({ embeds: [E.warn('Already Claimed', `You can claim again <t:${Math.floor(next.getTime() / 1000)}:R>.`)] });
      }
      const amount = u.premium?.active ? 200 : 100;
      u.coins = (u.coins || 0) + amount;
      u.dailyLast = now;
      await u.save();
      await interaction.editReply({ embeds: [E.success('Daily Claimed!', `You received **${amount}** coins!${u.premium?.active ? '\n💎 Premium bonus applied!' : ''}`, [
        { name: '💰 New Balance', value: `${u.coins} coins`, inline: true },
      ])] });
    }

    else if (sub === 'weekly') {
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u) u = await User.create({ userId: interaction.user.id, username: interaction.user.username });
      const now = new Date();
      const last = u.weeklyLast ? new Date(u.weeklyLast) : null;
      if (last && now - last < 604800000) {
        const next = new Date(last.getTime() + 604800000);
        return interaction.editReply({ embeds: [E.warn('Already Claimed', `You can claim again <t:${Math.floor(next.getTime() / 1000)}:R>.`)] });
      }
      const amount = u.premium?.active ? 1000 : 500;
      u.coins = (u.coins || 0) + amount;
      u.weeklyLast = now;
      await u.save();
      await interaction.editReply({ embeds: [E.success('Weekly Claimed!', `You received **${amount}** coins!${u.premium?.active ? '\n💎 Premium bonus applied!' : ''}`, [
        { name: '💰 New Balance', value: `${u.coins} coins`, inline: true },
      ])] });
    }

    else if (sub === 'pay') {
      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      if (target.id === interaction.user.id) return interaction.editReply({ embeds: [E.error('Invalid', 'You cannot pay yourself.')] });
      const sender = await User.findOne({ userId: interaction.user.id });
      if (!sender || (sender.coins || 0) < amount) return interaction.editReply({ embeds: [E.error('Insufficient Funds', `You only have **${sender?.coins || 0}** coins.`)] });
      await User.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { coins: -amount } });
      await User.findOneAndUpdate({ userId: target.id }, { $inc: { coins: amount } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Payment Sent', `Sent **${amount}** coins to <@${target.id}>!`, [
        { name: '💰 Your Balance', value: `${(sender.coins || 0) - amount} coins`, inline: true },
      ])] });
    }

    else if (sub === 'leaderboard') {
      const users = await User.find({ coins: { $gt: 0 } }).sort({ coins: -1 }).limit(10);
      const entries = users.map(u => ({ id: u.userId, val: `${u.coins} coins` }));
      await interaction.editReply({ embeds: [E.lb('💰 Richest Players', entries, interaction.guild)] });
    }

    else if (sub === 'gamble') {
      const amount = interaction.options.getInteger('amount');
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u || (u.coins || 0) < amount) return interaction.editReply({ embeds: [E.error('Insufficient Funds', `You only have **${u?.coins || 0}** coins.`)] });
      const win = Math.random() < 0.45;
      const change = win ? amount : -amount;
      u.coins = (u.coins || 0) + change;
      await u.save();
      await interaction.editReply({ embeds: [win
        ? E.success('🎰 You Won!', `You gambled **${amount}** coins and **won**!`, [{ name: '💰 Balance', value: `${u.coins} coins`, inline: true }])
        : E.error('🎰 You Lost!', `You gambled **${amount}** coins and **lost**.  Better luck next time!`)
          .addFields({ name: '💰 Balance', value: `${u.coins} coins`, inline: true })
      ] });
    }
  }
};

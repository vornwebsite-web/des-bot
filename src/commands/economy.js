const { SlashCommandBuilder } = require("discord.js");
const E = require("../utils/embeds");
const { User, Guild } = require("../models/index");
const { isOwner } = require("../utils/helpers");

async function isEconomyEnabled(guildId, userId) {
  if (await isOwner(userId)) return true;
  const cfg = await Guild.findOne({ guildId: guildId });
  return cfg && cfg.economy && cfg.economy.enabled === true;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("economy").setDescription("Economy system")
    .addSubcommand(function(s) { return s.setName("balance").setDescription("Check your balance")
      .addUserOption(function(o) { return o.setName("user").setDescription("User (default: you)"); });
    })
    .addSubcommand(function(s) { return s.setName("daily").setDescription("Claim your daily coins"); })
    .addSubcommand(function(s) { return s.setName("weekly").setDescription("Claim your weekly coins"); })
    .addSubcommand(function(s) { return s.setName("pay").setDescription("Send coins to another user")
      .addUserOption(function(o) { return o.setName("user").setDescription("Recipient").setRequired(true); })
      .addIntegerOption(function(o) { return o.setName("amount").setDescription("Amount").setRequired(true).setMinValue(1); });
    })
    .addSubcommand(function(s) { return s.setName("leaderboard").setDescription("Richest users"); })
    .addSubcommand(function(s) { return s.setName("gamble").setDescription("Gamble your coins")
      .addIntegerOption(function(o) { return o.setName("amount").setDescription("Amount to gamble").setRequired(true).setMinValue(1); });
    })
    .addSubcommand(function(s) { return s.setName("enabled").setDescription("Enable or disable the economy system (Owner only)")
      .addStringOption(function(o) { return o.setName("value").setDescription("Enable or disable").setRequired(true).addChoices(
        { name: "Enable", value: "true" },
        { name: "Disable", value: "false" }
      ); });
    }),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── ENABLED (owner only) ──────────────────────────────────
    if (sub === "enabled") {
      if (!(await isOwner(interaction.user.id))) {
        return interaction.reply({ embeds: [E.error("Owner Only", "Only the bot owner can enable or disable the economy.")], flags: 64 });
      }
      const value = interaction.options.getString("value") === "true";
      await Guild.findOneAndUpdate(
        { guildId: interaction.guildId },
        { $set: { "economy.enabled": value } },
        { upsert: true }
      );
      await interaction.reply({ embeds: [E[value ? "success" : "warn"](
        "Economy " + (value ? "Enabled" : "Disabled"),
        "The economy system is now " + (value ? "active" : "disabled") + " in this server."
      )], flags: 64 });
      return;
    }

    // ── Economy gate (non-owners blocked if disabled) ─────────
    if (!(await isEconomyEnabled(interaction.guildId, interaction.user.id))) {
      return interaction.reply({ embeds: [E.error("Economy Disabled", "The economy system is not enabled in this server.\nAsk the bot owner to run **/economy enabled true**.")], flags: 64 });
    }

    await interaction.deferReply();

    // ── BALANCE ───────────────────────────────────────────────
    if (sub === "balance") {
      const target = interaction.options.getUser("user") || interaction.user;
      let u = await User.findOne({ userId: target.id });
      if (!u) u = await User.create({ userId: target.id, username: target.username });
      await interaction.editReply({ embeds: [E.gold(target.username + "'s Balance", "", [
        { name: "Wallet", value: (u.coins || 0) + " coins", inline: true },
        { name: "Points", value: (u.points || 0) + " pts", inline: true },
      ]).setThumbnail(target.displayAvatarURL({ dynamic: true }))] });
    }

    // ── DAILY ─────────────────────────────────────────────────
    else if (sub === "daily") {
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u) u = await User.create({ userId: interaction.user.id, username: interaction.user.username });
      const now = new Date();
      const last = u.dailyLast ? new Date(u.dailyLast) : null;
      if (last && now - last < 86400000) {
        const next = new Date(last.getTime() + 86400000);
        return interaction.editReply({ embeds: [E.warn("Already Claimed", "You can claim again <t:" + Math.floor(next.getTime() / 1000) + ":R>.")] });
      }
      const amount = (u.premium && u.premium.active) ? 200 : 100;
      u.coins = (u.coins || 0) + amount;
      u.dailyLast = now;
      await u.save();
      await interaction.editReply({ embeds: [E.success("Daily Claimed!", "You received **" + amount + "** coins!" + ((u.premium && u.premium.active) ? "\nPremium bonus applied!" : ""), [
        { name: "New Balance", value: u.coins + " coins", inline: true },
      ])] });
    }

    // ── WEEKLY ────────────────────────────────────────────────
    else if (sub === "weekly") {
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u) u = await User.create({ userId: interaction.user.id, username: interaction.user.username });
      const now = new Date();
      const last = u.weeklyLast ? new Date(u.weeklyLast) : null;
      if (last && now - last < 604800000) {
        const next = new Date(last.getTime() + 604800000);
        return interaction.editReply({ embeds: [E.warn("Already Claimed", "You can claim again <t:" + Math.floor(next.getTime() / 1000) + ":R>.")] });
      }
      const amount = (u.premium && u.premium.active) ? 1000 : 500;
      u.coins = (u.coins || 0) + amount;
      u.weeklyLast = now;
      await u.save();
      await interaction.editReply({ embeds: [E.success("Weekly Claimed!", "You received **" + amount + "** coins!" + ((u.premium && u.premium.active) ? "\nPremium bonus applied!" : ""), [
        { name: "New Balance", value: u.coins + " coins", inline: true },
      ])] });
    }

    // ── PAY ───────────────────────────────────────────────────
    else if (sub === "pay") {
      const target = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");
      if (target.id === interaction.user.id) return interaction.editReply({ embeds: [E.error("Invalid", "You cannot pay yourself.")] });
      const sender = await User.findOne({ userId: interaction.user.id });
      if (!sender || (sender.coins || 0) < amount) {
        return interaction.editReply({ embeds: [E.error("Insufficient Funds", "You only have **" + (sender ? sender.coins || 0 : 0) + "** coins.")] });
      }
      await User.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { coins: -amount } });
      await User.findOneAndUpdate({ userId: target.id }, { $inc: { coins: amount } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success("Payment Sent", "Sent **" + amount + "** coins to <@" + target.id + ">!", [
        { name: "Your Balance", value: ((sender.coins || 0) - amount) + " coins", inline: true },
      ])] });
    }

    // ── LEADERBOARD ───────────────────────────────────────────
    else if (sub === "leaderboard") {
      const users = await User.find({ coins: { $gt: 0 } }).sort({ coins: -1 }).limit(10);
      const entries = users.map(function(u) { return { id: u.userId, val: (u.coins || 0) + " coins" }; });
      await interaction.editReply({ embeds: [E.lb("Richest Players", entries, interaction.guild)] });
    }

    // ── GAMBLE ────────────────────────────────────────────────
    else if (sub === "gamble") {
      const amount = interaction.options.getInteger("amount");
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u || (u.coins || 0) < amount) {
        return interaction.editReply({ embeds: [E.error("Insufficient Funds", "You only have **" + (u ? u.coins || 0 : 0) + "** coins.")] });
      }
      const win = Math.random() < 0.45;
      u.coins = (u.coins || 0) + (win ? amount : -amount);
      await u.save();
      if (win) {
        await interaction.editReply({ embeds: [E.success("You Won!", "You gambled **" + amount + "** coins and won!", [
          { name: "Balance", value: u.coins + " coins", inline: true }
        ])] });
      } else {
        await interaction.editReply({ embeds: [E.error("You Lost!", "You gambled **" + amount + "** coins and lost.").addFields({ name: "Balance", value: u.coins + " coins", inline: true })] });
      }
    }
  }
};

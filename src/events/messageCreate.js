const { Guild, User } = require('../models/index');
const logger = require('../utils/logger');

const xpCooldowns = new Map();
const spamTracker = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    try {
      const cfg = await Guild.findOne({ guildId: message.guild.id });

      // ── AutoMod ────────────────────────────────────────────
      if (cfg?.moderation?.autoMod) {
        const content = message.content;
        const mod = cfg.moderation;

        // Anti-spam
        if (mod.antiSpam) {
          const key = `${message.guild.id}:${message.author.id}`;
          const now = Date.now();
          const timestamps = spamTracker.get(key) || [];
          timestamps.push(now);
          const recent = timestamps.filter(t => now - t < 5000);
          spamTracker.set(key, recent);
          if (recent.length >= 5) {
            await message.delete().catch(() => {});
            try { await message.channel.send({ content: `<@${message.author.id}>`, embeds: [require('../utils/embeds').warn('Slow Down!', 'You are sending messages too fast!')] }); } catch {}
            return;
          }
        }

        // Anti-links
        if (mod.antiLinks && /https?:\/\/[^\s]+/.test(message.content)) {
          const member = message.member;
          if (!member?.permissions.has(8n)) {
            await message.delete().catch(() => {});
            return;
          }
        }

        // Anti-invites
        if (mod.antiInvites && /discord\.gg\/[^\s]+/.test(message.content)) {
          const member = message.member;
          if (!member?.permissions.has(8n)) {
            await message.delete().catch(() => {});
            return;
          }
        }

        // Anti-caps (>70% caps, >10 chars)
        if (mod.antiCaps && content.length > 10) {
          const caps = content.replace(/[^A-Z]/g, '').length;
          if (caps / content.length > 0.7) {
            await message.delete().catch(() => {});
            return;
          }
        }

        // Bad words
        if (mod.badWords?.length) {
          const lower = content.toLowerCase();
          if (mod.badWords.some(w => lower.includes(w.toLowerCase()))) {
            await message.delete().catch(() => {});
            return;
          }
        }
      }

      // ── XP / Leveling ──────────────────────────────────────
      if (cfg?.leveling?.enabled) {
        const cooldown = (cfg.leveling.cooldown || 60) * 1000;
        const key = `${message.guild.id}:${message.author.id}`;
        const lastMsg = xpCooldowns.get(key) || 0;
        const now = Date.now();

        if (now - lastMsg > cooldown) {
          xpCooldowns.set(key, now);
          let u = await User.findOne({ userId: message.author.id });
          if (!u) u = await User.create({ userId: message.author.id, username: message.author.username });

          const baseXP = cfg.leveling.xpPerMsg || 15;
          const boost = u.xpBoost?.active && new Date(u.xpBoost.expiresAt) > new Date() ? 2 : 1;
          const xpGain = baseXP * boost;
          const oldLevel = u.level;
          u.xp = (u.xp || 0) + xpGain;

          // Level up check
          const xpNeeded = u.level * 100;
          if (u.xp >= xpNeeded) {
            u.level += 1;
            u.xp = 0;
            u.points = (u.points || 0) + 10;

            if (cfg.leveling.announceLevel !== false) {
              const E = require('../utils/embeds');
              const announceCh = cfg.channels?.levelUp ? await client.channels.fetch(cfg.channels.levelUp).catch(() => null) : message.channel;
              if (announceCh) {
                await announceCh.send({ embeds: [E.make(E.C.GOLD).setTitle('⚡  Level Up!').setDescription(`🎉 Congrats <@${message.author.id}>! You reached **Level ${u.level}**!`).setThumbnail(message.author.displayAvatarURL({ dynamic: true })).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
              }
            }
          }
          await u.save();
        }
      }

    } catch (e) { /* silent */ }
  }
};

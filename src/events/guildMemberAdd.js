const E = require('../utils/embeds');
const { Guild } = require('../models/index');
const logger = require('../utils/logger');

// Anti-raid tracking
const joinTracker = new Map(); // guildId -> [{timestamp}]

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const { guild } = member;
    logger.info(`[JOIN] ${member.user.tag} joined ${guild.name}`);

    try {
      const cfg = await Guild.findOne({ guildId: guild.id });

      // ── Anti-Raid ──────────────────────────────────────────
      if (cfg?.antiRaid?.enabled) {
        const now = Date.now();
        const window = (cfg.antiRaid.window || 10) * 1000;
        const threshold = cfg.antiRaid.threshold || 10;
        const joins = joinTracker.get(guild.id) || [];
        joins.push(now);
        const recent = joins.filter(t => now - t < window);
        joinTracker.set(guild.id, recent);

        if (recent.length >= threshold) {
          logger.warn(`[ANTI-RAID] Triggered in ${guild.name} — ${recent.length} joins in ${cfg.antiRaid.window}s`);
          const action = cfg.antiRaid.action || 'kick';
          try {
            if (action === 'ban') await guild.members.ban(member.id, { reason: '🚨 Anti-Raid: Mass join detected' });
            else await member.kick('🚨 Anti-Raid: Mass join detected');
          } catch {}

          // Alert
          if (cfg.antiRaid.alertChannel || cfg.channels?.logs) {
            const alertCh = await client.channels.fetch(cfg.antiRaid.alertChannel || cfg.channels.logs).catch(() => null);
            if (alertCh) alertCh.send({ embeds: [E.make(E.C.ERROR).setTitle('🚨  Anti-Raid Triggered').setDescription(`**${recent.length}** joins in **${cfg.antiRaid.window}s** in **${guild.name}**.\nAction: **${action.toUpperCase()}**`).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
          }
          return;
        }
      }

      // ── Auto-role ──────────────────────────────────────────
      if (cfg?.roles?.autoRole?.length) {
        for (const roleId of cfg.roles.autoRole) {
          try { await member.roles.add(roleId, 'Auto-role on join'); } catch {}
        }
      }

      // ── Welcome message ────────────────────────────────────
      if (cfg?.welcome?.enabled && cfg?.channels?.welcome) {
        const ch = await client.channels.fetch(cfg.channels.welcome).catch(() => null);
        if (ch) {
          const embed = E.welcome(member, cfg.welcome);
          if (cfg.welcome.banner) embed.setImage(cfg.welcome.banner);
          const content = cfg.welcome.ping ? `<@${member.id}>` : undefined;
          await ch.send({ content, embeds: [embed] });
        }
      }

      // ── DM welcome ─────────────────────────────────────────
      if (cfg?.welcome?.dm && cfg?.welcome?.dmMsg) {
        try {
          const dmEmbed = E.welcome(member, { message: cfg.welcome.dmMsg });
          await member.user.send({ embeds: [dmEmbed] });
        } catch {}
      }

      // ── Join log ───────────────────────────────────────────
      if (cfg?.logging?.enabled && cfg?.channels?.joinLogs) {
        const logCh = await client.channels.fetch(cfg.channels.joinLogs).catch(() => null);
        if (logCh) logCh.send({ embeds: [E.make(E.C.SUCCESS).setTitle('📥  Member Joined').setThumbnail(member.user.displayAvatarURL({ dynamic: true })).addFields(
          { name: '👤 Member', value: `<@${member.id}> \`${member.user.tag}\``, inline: true },
          { name: '🆔 ID', value: `\`${member.id}\``, inline: true },
          { name: '📅 Account Age', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '👥 Member #', value: `${guild.memberCount}`, inline: true },
        ).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
      }
    } catch (e) { logger.error(`guildMemberAdd error: ${e.message}`); }
  }
};

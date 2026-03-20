const E = require('../utils/embeds');
const { Guild, User } = require('../models/index');
const logger = require('../utils/logger');

// Anti-raid tracking
const joinTracker = new Map(); // guildId -> [{timestamp}]

// Invite cache - stores invites before member joins
const inviteCache = new Map(); // guildId -> { inviteCode -> uses }

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

      // ── Invite Tracking ────────────────────────────────────
      if (cfg?.invites?.enabled) {
        try {
          const invites = await guild.invites.fetch().catch(() => null);
          const cachedInvites = inviteCache.get(guild.id) || {};
          let inviter = null;
          let usedInvite = null;

          if (invites) {
            // Find which invite was used
            for (const [code, invite] of invites) {
              const prevUses = cachedInvites[code] || 0;
              const currentUses = invite.uses || 0;

              if (currentUses > prevUses) {
                usedInvite = invite;
                inviter = invite.inviter;
                break;
              }
            }

            // Update invite cache
            const newCache = {};
            for (const [code, invite] of invites) {
              newCache[code] = invite.uses || 0;
            }
            inviteCache.set(guild.id, newCache);
          }

          // Create or update user document
          let u = await User.findOne({ userId: member.id, guildId: guild.id });
          if (!u) {
            u = await User.create({
              userId: member.id,
              guildId: guild.id,
              invites: 0,
              invitedBy: inviter?.id || null
            });
          } else {
            u.invitedBy = inviter?.id || null;
            await u.save();
          }

          // Update inviter's count
          if (inviter) {
            await User.findOneAndUpdate(
              { userId: inviter.id, guildId: guild.id },
              { $inc: { invites: 1 } },
              { upsert: true }
            );

            // Send announcement to configured channel
            if (cfg.invites.channel) {
              const announceCh = await client.channels.fetch(cfg.invites.channel).catch(() => null);
              if (announceCh) {
                const inviterUser = await User.findOne({ userId: inviter.id, guildId: guild.id });
                announceCh.send({
                  embeds: [E.success('✅ New Member Invited', `<@${member.id}> was invited by <@${inviter.id}>\n\n${inviter.username} now has **${inviterUser?.invites || 1}** invites!`)]
                }).catch(() => {});
              }
            }
          }
        } catch (e) {
          logger.error(`Invite tracking error: ${e.message}`);
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

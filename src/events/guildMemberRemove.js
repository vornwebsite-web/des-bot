const E = require('../utils/embeds');
const { Guild } = require('../models/index');
const logger = require('../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    logger.info(`[LEAVE] ${member.user.tag} left ${member.guild.name}`);
    try {
      const cfg = await Guild.findOne({ guildId: member.guild.id });

      // ── Farewell message ──────────────────────────────────
      if (cfg?.farewell?.enabled && cfg?.channels?.farewell) {
        const ch = await client.channels.fetch(cfg.channels.farewell).catch(() => null);
        if (ch) await ch.send({ embeds: [E.bye(member, cfg.farewell)] });
      }

      // ── Leave log ─────────────────────────────────────────
      if (cfg?.logging?.enabled && cfg?.channels?.joinLogs) {
        const logCh = await client.channels.fetch(cfg.channels.joinLogs).catch(() => null);
        if (logCh) logCh.send({ embeds: [E.make(E.C.BYE).setTitle('📤  Member Left').setThumbnail(member.user.displayAvatarURL({ dynamic: true })).addFields(
          { name: '👤 Member', value: `${member.user.tag}`, inline: true },
          { name: '🆔 ID', value: `\`${member.id}\``, inline: true },
          { name: '📅 Was Here', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
        ).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
      }
    } catch (e) { logger.error(`guildMemberRemove error: ${e.message}`); }
  }
};

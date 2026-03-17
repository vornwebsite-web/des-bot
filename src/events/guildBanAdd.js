const E = require('../utils/embeds');
const { Guild } = require('../models/index');

// Anti-nuke action trackers
const nukeTracker = new Map(); // key: `${guildId}:${executorId}:${type}` -> [{ts}]

async function trackNukeAction(guild, type, executorId, cfg, client) {
  if (!cfg?.antiNuke?.enabled) return;
  const whitelist = cfg.antiNuke.whitelist || [];
  if (whitelist.includes(executorId)) return;

  const key = `${guild.id}:${executorId}:${type}`;
  const now = Date.now();
  const actions = nukeTracker.get(key) || [];
  actions.push(now);
  const recent = actions.filter(t => now - t < 10000);
  nukeTracker.set(key, recent);

  const threshold = cfg.antiNuke.threshold || 3;
  if (recent.length >= threshold) {
    const action = cfg.antiNuke.action || 'ban';
    try {
      const member = await guild.members.fetch(executorId).catch(() => null);
      if (member) {
        if (action === 'ban') await guild.members.ban(executorId, { reason: '🛡️ Anti-Nuke: Suspicious mass action' });
        else await member.kick('🛡️ Anti-Nuke: Suspicious mass action');
      }
    } catch {}

    const logCh = cfg.channels?.logs ? await client.channels.fetch(cfg.channels.logs).catch(() => null) : null;
    if (logCh) logCh.send({ embeds: [E.make(E.C.ERROR).setTitle('💣  Anti-Nuke Triggered').setDescription(`**Type:** ${type}\n**Executor:** <@${executorId}>\n**Actions in 10s:** ${recent.length}\n**Action taken:** ${action.toUpperCase()}`).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
  }
}

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    if (!ban.guild) return;
    try {
      const cfg = await Guild.findOne({ guildId: ban.guild.id });
      const logs = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(() => null);
      const entry = logs?.entries?.first();
      if (entry && entry.executor && !entry.executor.bot) {
        await trackNukeAction(ban.guild, 'mass-ban', entry.executor.id, cfg, client);
      }
      if (cfg?.logging?.enabled && cfg?.channels?.modLogs) {
        const ch = await client.channels.fetch(cfg.channels.modLogs).catch(() => null);
        if (ch) ch.send({ embeds: [E.make(E.C.ERROR).setTitle('🔨  Member Banned').addFields(
          { name: '👤 User', value: `${ban.user.tag} \`${ban.user.id}\``, inline: true },
          { name: '📋 Reason', value: ban.reason || 'No reason', inline: true },
        ).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
      }
    } catch {}
  }
};

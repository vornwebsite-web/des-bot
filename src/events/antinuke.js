const E = require('../utils/embeds');
const { Guild } = require('../models/index');

const nukeTracker = new Map();
async function track(guild, type, executorId, cfg, client) {
  if (!cfg?.antiNuke?.enabled) return;
  if ((cfg.antiNuke.whitelist || []).includes(executorId)) return;
  const key = `${guild.id}:${executorId}:${type}`;
  const now = Date.now();
  const acts = nukeTracker.get(key) || [];
  acts.push(now);
  const recent = acts.filter(t => now - t < 10000);
  nukeTracker.set(key, recent);
  if (recent.length >= (cfg.antiNuke.threshold || 3)) {
    try {
      const m = await guild.members.fetch(executorId).catch(() => null);
      if (m) {
        if (cfg.antiNuke.action === 'ban') await guild.members.ban(executorId, { reason: '🛡️ Anti-Nuke' });
        else await m.kick('🛡️ Anti-Nuke');
      }
    } catch {}
    try {
      const logCh = cfg.channels?.logs ? await client.channels.fetch(cfg.channels.logs).catch(() => null) : null;
      if (logCh) logCh.send({ embeds: [E.make(E.C.ERROR).setTitle('💣  Anti-Nuke — Channel Nuking').setDescription(`**Executor:** <@${executorId}>\n**${type}** x${recent.length} in 10s\n**Action:** ${(cfg.antiNuke.action || 'ban').toUpperCase()}`).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    } catch {}
  }
}

module.exports = [
  {
    name: 'channelDelete',
    async execute(channel, client) {
      if (!channel.guild) return;
      try {
        const cfg = await Guild.findOne({ guildId: channel.guild.id });
        const logs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 }).catch(() => null);
        const executor = logs?.entries?.first()?.executor;
        if (executor && !executor.bot) await track(channel.guild, 'channel-delete', executor.id, cfg, client);
      } catch {}
    }
  },
  {
    name: 'roleDelete',
    async execute(role, client) {
      if (!role.guild) return;
      try {
        const cfg = await Guild.findOne({ guildId: role.guild.id });
        const logs = await role.guild.fetchAuditLogs({ type: 32, limit: 1 }).catch(() => null);
        const executor = logs?.entries?.first()?.executor;
        if (executor && !executor.bot) await track(role.guild, 'role-delete', executor.id, cfg, client);
      } catch {}
    }
  }
];

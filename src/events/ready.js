const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`✅ DeS Bot™ online as ${client.user.tag}`);
    logger.info(`📡 Serving ${client.guilds.cache.size} servers | ${client.commands.size} commands`);

    const statuses = [
      { name: '🏆 DOT Esport Tournaments', type: 0 },
      { name: `🌐 ${client.guilds.cache.size} Servers`, type: 3 },
      { name: '⚔️ Competitive Gaming', type: 0 },
      { name: '💎 dotsbot.site', type: 3 },
    ];
    let i = 0;
    client.user.setPresence({ status: 'online', activities: [statuses[0]] });
    setInterval(() => {
      i = (i + 1) % statuses.length;
      client.user.setPresence({ status: 'online', activities: [statuses[i]] });
    }, 15000);

    // Re-schedule pending reminders on restart
    try {
      const { Reminder } = require('../models/index');
      const pending = await Reminder.find({ done: false, triggerAt: { $gt: new Date() } });
      for (const r of pending) {
        const delay = new Date(r.triggerAt).getTime() - Date.now();
        if (delay > 0 && delay < 86400000 * 2) {
          setTimeout(async () => {
            try {
              const ch = await client.channels.fetch(r.channelId);
              const E = require('../utils/embeds');
              await ch.send({ content: `<@${r.userId}>`, embeds: [E.gold('⏰ Reminder!', r.message)] });
              await Reminder.findByIdAndUpdate(r._id, { done: true });
            } catch {}
          }, delay);
        }
      }
      if (pending.length) logger.info(`⏰ Rescheduled ${pending.length} reminder(s)`);
    } catch (e) { logger.warn('Could not reschedule reminders: ' + e.message); }
  }
};

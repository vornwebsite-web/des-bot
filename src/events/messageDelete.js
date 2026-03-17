const E = require('../utils/embeds');
const { Guild } = require('../models/index');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (message.author?.bot || !message.guild) return;
    try {
      const cfg = await Guild.findOne({ guildId: message.guild.id });
      if (!cfg?.logging?.enabled || !cfg?.channels?.msgLogs) return;
      const ch = await client.channels.fetch(cfg.channels.msgLogs).catch(() => null);
      if (!ch) return;
      ch.send({ embeds: [E.make(E.C.ERROR).setTitle('🗑️  Message Deleted').addFields(
        { name: '👤 Author', value: `<@${message.author?.id}> \`${message.author?.tag}\``, inline: true },
        { name: '📢 Channel', value: `<#${message.channelId}>`, inline: true },
        { name: '📝 Content', value: message.content?.slice(0, 1000) || '*No text content*', inline: false },
      ).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    } catch {}
  }
};

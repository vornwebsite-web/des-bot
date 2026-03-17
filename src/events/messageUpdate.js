const E = require('../utils/embeds');
const { Guild } = require('../models/index');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMsg, newMsg, client) {
    if (newMsg.author?.bot || !newMsg.guild || oldMsg.content === newMsg.content) return;
    try {
      const cfg = await Guild.findOne({ guildId: newMsg.guild.id });
      if (!cfg?.logging?.enabled || !cfg?.channels?.msgLogs) return;
      const ch = await client.channels.fetch(cfg.channels.msgLogs).catch(() => null);
      if (!ch) return;
      ch.send({ embeds: [E.make(E.C.WARN).setTitle('✏️  Message Edited').setURL(newMsg.url).addFields(
        { name: '👤 Author', value: `<@${newMsg.author?.id}> \`${newMsg.author?.tag}\``, inline: true },
        { name: '📢 Channel', value: `<#${newMsg.channelId}>`, inline: true },
        { name: '📝 Before', value: oldMsg.content?.slice(0, 500) || '*No content*', inline: false },
        { name: '📝 After', value: newMsg.content?.slice(0, 500) || '*No content*', inline: false },
      ).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    } catch {}
  }
};

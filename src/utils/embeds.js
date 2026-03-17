const { EmbedBuilder } = require('discord.js');

const C = {
  GOLD:       0xD4AF37,
  GOLD2:      0xFFD700,
  DARK:       0x0A0A0F,
  SUCCESS:    0x00E676,
  ERROR:      0xFF1744,
  WARN:       0xFFAB00,
  INFO:       0x00B0FF,
  PREMIUM:    0xFFD700,
  TOURNEY:    0xFF6B35,
  TICKET:     0x6C63FF,
  MOD:        0xFF3D57,
  WELCOME:    0x00E676,
  BYE:        0xFF6B6B,
  STAT:       0x00B0FF,
};

const FOOTER = { text: 'DeS Bot™  ·  DOT Esport' };
const ts = () => new Date();

function make(color) {
  return new EmbedBuilder().setColor(color).setFooter(FOOTER).setTimestamp(ts());
}

module.exports = {
  C,
  make,

  success: (title, desc, fields = []) =>
    make(C.SUCCESS).setTitle(`✅  ${title}`).setDescription(desc || null).addFields(fields),

  error: (title, desc) =>
    make(C.ERROR).setTitle(`❌  ${title}`).setDescription(`> ${desc}`),

  warn: (title, desc, fields = []) =>
    make(C.WARN).setTitle(`⚠️  ${title}`).setDescription(desc || null).addFields(fields),

  info: (title, desc, fields = []) =>
    make(C.INFO).setTitle(`ℹ️  ${title}`).setDescription(desc || null).addFields(fields),

  gold: (title, desc, fields = []) =>
    make(C.GOLD).setTitle(`👑  ${title}`).setDescription(desc || null).addFields(fields),

  premium: (title, desc, fields = []) =>
    new EmbedBuilder().setColor(C.PREMIUM)
      .setTitle(`💎  ${title}`).setDescription(desc || null)
      .addFields(fields).setFooter({ text: '💎 DeS Bot™ Premium  ·  DOT Esport' }).setTimestamp(ts()),

  tourney: (title, desc, fields = []) =>
    make(C.TOURNEY).setTitle(`🏆  ${title}`).setDescription(desc || null).addFields(fields),

  ticket: (title, desc, fields = []) =>
    make(C.TICKET).setTitle(`🎫  ${title}`).setDescription(desc || null).addFields(fields),

  mod: (action, target, mod, reason, extra = []) => {
    const map = { ban: ['🔨', C.ERROR], kick: ['👢', C.WARN], mute: ['🔇', C.WARN], warn: ['⚠️', C.GOLD], unban: ['✅', C.SUCCESS], unmute: ['🔊', C.SUCCESS] };
    const [emoji, color] = map[action] || ['🛡️', C.MOD];
    return make(color).setTitle(`${emoji}  ${action.toUpperCase()}`)
      .addFields(
        { name: '👤 Target', value: `<@${target.id}>  \`${target.username || target.tag || target.user?.tag || target.id}\``, inline: true },
        { name: '🛡️ Moderator', value: `<@${mod.id}>`, inline: true },
        { name: '📋 Reason', value: reason || '*No reason.*', inline: false },
        ...extra
      );
  },

  welcome: (member, cfg) =>
    make(C.WELCOME)
      .setTitle(`🎮  Welcome to ${member.guild.name}!`)
      .setDescription(
        (cfg?.message || 'Welcome {user}! You are member **#{count}**!')
          .replace('{user}', `<@${member.id}>`)
          .replace('{server}', member.guild.name)
          .replace('{count}', member.guild.memberCount)
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '📅 Account Age', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 Member #', value: `**${member.guild.memberCount}**`, inline: true }
      ),

  bye: (member, cfg) =>
    make(C.BYE)
      .setTitle(`👋  Goodbye, ${member.user.username}`)
      .setDescription(
        (cfg?.message || '**{user}** has left {server}.')
          .replace('{user}', member.user.username)
          .replace('{server}', member.guild.name)
          .replace('{count}', member.guild.memberCount)
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 })),

  lb: (title, entries, guild) => {
    const medals = ['🥇', '🥈', '🥉'];
    return make(C.GOLD)
      .setTitle(`🏆  ${title}`)
      .setDescription(entries.map((e, i) => `${medals[i] || `**${i + 1}.**`} <@${e.id}> — \`${e.val}\``).join('\n') || '*No data.*')
      .setThumbnail(guild?.iconURL({ dynamic: true }) || null);
  },
};

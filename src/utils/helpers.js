const E = require('./embeds');
const { User } = require('../models');

const owners = () => (process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

async function isOwner(userId) { return owners().includes(userId); }

async function isPremium(userId) {
  try {
    const u = await User.findOne({ userId });
    return u?.premium?.active === true && new Date(u.premium.expiresAt) > new Date();
  } catch { return false; }
}

async function requireOwner(i) {
  if (!await isOwner(i.user.id)) {
    await i.reply({ embeds: [E.error('Owner Only', 'This command is restricted to bot owners.')], ephemeral: true });
    return false;
  }
  return true;
}

async function requirePremium(i) {
  if (!await isPremium(i.user.id)) {
    await i.reply({
      embeds: [E.premium('Premium Required', 'This command requires **DeS Bot™ Premium**!\n\nSubscribe at **[dotsbot.site/premium](http://www.dotsbot.site/premium)**',
        [{ name: '💎 Plans', value: '• Basic $2.99/mo\n• Pro $6.99/mo\n• Elite $12.99/mo', inline: false }]
      )],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

async function requirePerm(i, perm) {
  if (!i.member.permissions.has(perm)) {
    await i.reply({ embeds: [E.error('Missing Permission', `You need \`${perm}\` to use this.`)], ephemeral: true });
    return false;
  }
  return true;
}

function cooldown(client, i, secs) {
  const key = `${i.commandName}:${i.user.id}`;
  const now = Date.now();
  if (client.cooldowns.has(key)) {
    const left = client.cooldowns.get(key) - now;
    if (left > 0) {
      i.reply({ embeds: [E.warn('Cooldown', `Wait **${Math.ceil(left / 1000)}s** before using this again.`)], ephemeral: true });
      return false;
    }
  }
  client.cooldowns.set(key, now + secs * 1000);
  setTimeout(() => client.cooldowns.delete(key), secs * 1000);
  return true;
}

const ms = require('ms');
function parseDur(str) { const v = ms(str); return v ? new Date(Date.now() + v) : null; }

module.exports = { isOwner, isPremium, requireOwner, requirePremium, requirePerm, cooldown, parseDur };

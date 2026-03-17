const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { requireOwner, parseDur } = require('../utils/helpers');
const { User, Guild, Tournament, Ticket, Modlog, Giveaway } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('owner').setDescription('👑 Bot owner commands — restricted access')

    // ── Premium ───────────────────────────────────────────────
    .addSubcommand(s => s.setName('givepremium').setDescription('Gift Premium to a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('e.g. 30d 6mo 1y').setRequired(true))
      .addStringOption(o => o.setName('plan').setDescription('Plan tier').addChoices(
        { name: '💎 Basic', value: 'basic' },
        { name: '💎 Pro', value: 'pro' },
        { name: '💎 Elite', value: 'elite' })))
    .addSubcommand(s => s.setName('removepremium').setDescription('Remove Premium from a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for removal')))
    .addSubcommand(s => s.setName('extendpremium').setDescription('Extend a user\'s Premium duration')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Extra time e.g. 7d 1mo').setRequired(true)))
    .addSubcommand(s => s.setName('checkpremium').setDescription('Check a user\'s premium status')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('listpremium').setDescription('List all premium users'))
    .addSubcommand(s => s.setName('serverpremium').setDescription('Give a server Premium')
      .addStringOption(o => o.setName('guild-id').setDescription('Server ID').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Duration').setRequired(true)))

    // ── Blacklist ─────────────────────────────────────────────
    .addSubcommand(s => s.setName('blacklist').setDescription('Blacklist a user from the bot')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)))
    .addSubcommand(s => s.setName('unblacklist').setDescription('Remove user from blacklist')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('blacklistserver').setDescription('Blacklist an entire server')
      .addStringOption(o => o.setName('guild-id').setDescription('Server ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)))
    .addSubcommand(s => s.setName('listblacklist').setDescription('List all blacklisted users'))

    // ── Server management ─────────────────────────────────────
    .addSubcommand(s => s.setName('servers').setDescription('List all servers the bot is in')
      .addIntegerOption(o => o.setName('page').setDescription('Page number').setMinValue(1)))
    .addSubcommand(s => s.setName('leaveserver').setDescription('Leave a specific server')
      .addStringOption(o => o.setName('id').setDescription('Server ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('leaveallservers').setDescription('⚠️ Leave ALL servers except whitelisted ones')
      .addStringOption(o => o.setName('confirm').setDescription('Type CONFIRM to proceed').setRequired(true)))
    .addSubcommand(s => s.setName('serverinfo').setDescription('Detailed info about a server')
      .addStringOption(o => o.setName('guild-id').setDescription('Server ID').setRequired(true)))
    .addSubcommand(s => s.setName('serverban').setDescription('Ban the bot from re-joining a server')
      .addStringOption(o => o.setName('guild-id').setDescription('Server ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)))

    // ── User management ───────────────────────────────────────
    .addSubcommand(s => s.setName('userinfo').setDescription('Full database info on a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('resetuser').setDescription('Reset all stats for a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('deleteuser').setDescription('⚠️ Permanently delete a user from database')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('givecoins').setDescription('Give coins to a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('takecoins').setDescription('Remove coins from a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('setcoins').setDescription('Set exact coin balance for a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(0)))
    .addSubcommand(s => s.setName('givepoints').setDescription('Give points to a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)))
    .addSubcommand(s => s.setName('takepoints').setDescription('Remove points from a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('setlevel').setDescription('Set a user\'s level')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('level').setDescription('Level').setRequired(true).setMinValue(1).setMaxValue(9999)))
    .addSubcommand(s => s.setName('setxp').setDescription('Set a user\'s XP')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('xp').setDescription('XP amount').setRequired(true).setMinValue(0)))
    .addSubcommand(s => s.setName('addbadge').setDescription('Add a badge to a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('badge').setDescription('Badge (emoji or text)').setRequired(true)))
    .addSubcommand(s => s.setName('removebadge').setDescription('Remove a badge from a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('badge').setDescription('Badge to remove').setRequired(true)))

    // ── Bot control ───────────────────────────────────────────
    .addSubcommand(s => s.setName('stats').setDescription('Global bot statistics'))
    .addSubcommand(s => s.setName('dbstats').setDescription('Database collection counts'))
    .addSubcommand(s => s.setName('maintenance').setDescription('Toggle maintenance mode')
      .addBooleanOption(o => o.setName('enabled').setDescription('On or off').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Maintenance reason')))
    .addSubcommand(s => s.setName('setstatus').setDescription('Change bot status / activity')
      .addStringOption(o => o.setName('type').setDescription('Activity type').setRequired(true).addChoices(
        { name: 'Playing', value: 'PLAYING' },
        { name: 'Watching', value: 'WATCHING' },
        { name: 'Listening', value: 'LISTENING' },
        { name: 'Competing', value: 'COMPETING' }))
      .addStringOption(o => o.setName('text').setDescription('Status text').setRequired(true))
      .addStringOption(o => o.setName('status').setDescription('Online status').addChoices(
        { name: '🟢 Online', value: 'online' },
        { name: '🟡 Idle', value: 'idle' },
        { name: '🔴 Do Not Disturb', value: 'dnd' },
        { name: '⚫ Invisible', value: 'invisible' })))
    .addSubcommand(s => s.setName('setavatar').setDescription('Change the bot\'s avatar')
      .addStringOption(o => o.setName('url').setDescription('Image URL').setRequired(true)))
    .addSubcommand(s => s.setName('setname').setDescription('Change the bot\'s username')
      .addStringOption(o => o.setName('name').setDescription('New name').setRequired(true)))
    .addSubcommand(s => s.setName('restart').setDescription('⚠️ Restart the bot process'))
    .addSubcommand(s => s.setName('eval').setDescription('⚠️ Evaluate JavaScript code')
      .addStringOption(o => o.setName('code').setDescription('Code to run').setRequired(true)))
    .addSubcommand(s => s.setName('exec').setDescription('⚠️ Execute a shell command')
      .addStringOption(o => o.setName('command').setDescription('Shell command').setRequired(true)))

    // ── Broadcast & Announce ──────────────────────────────────
    .addSubcommand(s => s.setName('broadcast').setDescription('Broadcast a message to all servers')
      .addStringOption(o => o.setName('message').setDescription('Message content').setRequired(true))
      .addStringOption(o => o.setName('title').setDescription('Embed title')))
    .addSubcommand(s => s.setName('announce').setDescription('Send an announcement to a specific channel')
      .addStringOption(o => o.setName('title').setDescription('Announcement title').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Announcement body').setRequired(true))
      .addStringOption(o => o.setName('channel-id').setDescription('Target channel ID'))
      .addStringOption(o => o.setName('color').setDescription('Hex color e.g. #FF5500')))
    .addSubcommand(s => s.setName('dm').setDescription('Send a DM to any user')
      .addUserOption(o => o.setName('user').setDescription('User to DM').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Message').setRequired(true))),

  async execute(interaction, client) {
    if (!(await requireOwner(interaction))) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    // ── GIVE PREMIUM ──────────────────────────────────────────
    if (sub === 'givepremium') {
      const user = interaction.options.getUser('user');
      const duration = interaction.options.getString('duration');
      const plan = interaction.options.getString('plan') || 'pro';
      const exp = parseDur(duration);
      if (!exp) return interaction.editReply({ embeds: [E.error('Invalid Duration', 'Use `30d`, `6mo`, `1y`.')] });

      await User.findOneAndUpdate(
        { userId: user.id },
        { $set: { 'premium.active': true, 'premium.plan': plan, 'premium.startedAt': new Date(), 'premium.expiresAt': exp, 'premium.giftedBy': interaction.user.id } },
        { upsert: true }
      );
      try { await user.send({ embeds: [E.premium('💎 You Got Premium!', `You've been gifted **DeS Bot™ Premium (${plan.toUpperCase()})** by the bot owner!\n\n⏰ Expires: <t:${Math.floor(exp.getTime()/1000)}:R>\n\nUse \`/premium perks\` to see your benefits!`)] }); } catch {}
      await interaction.editReply({ embeds: [E.premium('Premium Gifted ✅', `**${user.username}** now has **${plan.toUpperCase()}** Premium.\n\n⏰ Expires: <t:${Math.floor(exp.getTime()/1000)}:F>`)] });
    }

    // ── REMOVE PREMIUM ────────────────────────────────────────
    else if (sub === 'removepremium') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'Removed by owner';
      const u = await User.findOne({ userId: user.id });
      if (!u?.premium?.active) return interaction.editReply({ embeds: [E.warn('No Premium', `**${user.username}** does not have Premium.`)] });
      await User.findOneAndUpdate({ userId: user.id }, { $set: { 'premium.active': false } });
      try { await user.send({ embeds: [E.error('Premium Removed', `Your DeS Bot™ Premium has been removed.\n**Reason:** ${reason}`)] }); } catch {}
      await interaction.editReply({ embeds: [E.success('Premium Removed', `Removed Premium from **${user.username}**.\n**Reason:** ${reason}`)] });
    }

    // ── EXTEND PREMIUM ────────────────────────────────────────
    else if (sub === 'extendpremium') {
      const user = interaction.options.getUser('user');
      const duration = interaction.options.getString('duration');
      const ms = require('ms');
      const msVal = ms(duration);
      if (!msVal) return interaction.editReply({ embeds: [E.error('Invalid Duration', 'Use `7d`, `1mo`.')] });
      const u = await User.findOne({ userId: user.id });
      if (!u?.premium?.active) return interaction.editReply({ embeds: [E.warn('No Premium', `**${user.username}** doesn't have active Premium.`)] });
      const current = new Date(u.premium.expiresAt);
      const newExp = new Date(current.getTime() + msVal);
      await User.findOneAndUpdate({ userId: user.id }, { $set: { 'premium.expiresAt': newExp } });
      await interaction.editReply({ embeds: [E.premium('Premium Extended ✅', `**${user.username}**'s Premium extended by **${duration}**.\n\n⏰ New expiry: <t:${Math.floor(newExp.getTime()/1000)}:F>`)] });
    }

    // ── CHECK PREMIUM ─────────────────────────────────────────
    else if (sub === 'checkpremium') {
      const user = interaction.options.getUser('user');
      const u = await User.findOne({ userId: user.id });
      const p = u?.premium;
      if (!p?.active) return interaction.editReply({ embeds: [E.info('No Premium', `**${user.username}** does not have Premium.`)] });
      await interaction.editReply({ embeds: [E.premium(`${user.username}'s Premium`, '', [
        { name: '📦 Plan', value: p.plan?.toUpperCase() || 'Unknown', inline: true },
        { name: '📅 Started', value: `<t:${Math.floor(new Date(p.startedAt).getTime()/1000)}:D>`, inline: true },
        { name: '⏰ Expires', value: `<t:${Math.floor(new Date(p.expiresAt).getTime()/1000)}:R>`, inline: true },
        { name: '🎁 Gifted By', value: p.giftedBy ? `<@${p.giftedBy}>` : 'Self-purchased', inline: true },
      ])] });
    }

    // ── LIST PREMIUM ──────────────────────────────────────────
    else if (sub === 'listpremium') {
      const users = await User.find({ 'premium.active': true }).sort({ 'premium.expiresAt': 1 }).limit(20);
      if (!users.length) return interaction.editReply({ embeds: [E.info('No Premium Users', 'Nobody has Premium right now.')] });
      const fields = users.map(u => ({
        name: `${u.username || u.userId} — ${u.premium.plan?.toUpperCase() || 'PRO'}`,
        value: `⏰ Expires <t:${Math.floor(new Date(u.premium.expiresAt).getTime()/1000)}:R>`,
        inline: true,
      }));
      await interaction.editReply({ embeds: [E.premium(`Premium Users (${users.length})`, '', fields)] });
    }

    // ── SERVER PREMIUM ────────────────────────────────────────
    else if (sub === 'serverpremium') {
      const guildId = interaction.options.getString('guild-id');
      const exp = parseDur(interaction.options.getString('duration'));
      if (!exp) return interaction.editReply({ embeds: [E.error('Invalid Duration', 'Use `30d`, `1y`.')] });
      await Guild.findOneAndUpdate({ guildId }, { $set: { premium: true, premiumExpires: exp } }, { upsert: true });
      const g = client.guilds.cache.get(guildId);
      await interaction.editReply({ embeds: [E.premium('Server Premium Active', `**${g?.name || guildId}** now has Premium until <t:${Math.floor(exp.getTime()/1000)}:F>.`)] });
    }

    // ── BLACKLIST ─────────────────────────────────────────────
    else if (sub === 'blacklist') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      await User.findOneAndUpdate({ userId: user.id }, { $set: { blacklisted: true, blacklistReason: reason } }, { upsert: true });
      try { await user.send({ embeds: [E.error('Blacklisted', `You have been blacklisted from **DeS Bot™**.\n**Reason:** ${reason}\n\nTo appeal, visit [dotsbot.site](http://www.dotsbot.site).`)] }); } catch {}
      await interaction.editReply({ embeds: [E.error('User Blacklisted', `**${user.username}** is now blacklisted.\n**Reason:** ${reason}`)] });
    }

    // ── UNBLACKLIST ───────────────────────────────────────────
    else if (sub === 'unblacklist') {
      const user = interaction.options.getUser('user');
      const u = await User.findOne({ userId: user.id });
      if (!u?.blacklisted) return interaction.editReply({ embeds: [E.warn('Not Blacklisted', `**${user.username}** is not blacklisted.`)] });
      await User.findOneAndUpdate({ userId: user.id }, { $set: { blacklisted: false, blacklistReason: null } });
      try { await user.send({ embeds: [E.success('Unblacklisted', `Your blacklist from **DeS Bot™** has been lifted. You may use the bot again.`)] }); } catch {}
      await interaction.editReply({ embeds: [E.success('Unblacklisted', `**${user.username}** has been removed from the blacklist.`)] });
    }

    // ── BLACKLIST SERVER ──────────────────────────────────────
    else if (sub === 'blacklistserver') {
      const guildId = interaction.options.getString('guild-id');
      const reason = interaction.options.getString('reason');
      await Guild.findOneAndUpdate({ guildId }, { $set: { blacklisted: true, blacklistReason: reason } }, { upsert: true });
      const g = client.guilds.cache.get(guildId);
      if (g) {
        try { const owner = await g.fetchOwner(); await owner.user.send({ embeds: [E.error('Server Blacklisted', `Your server **${g.name}** has been blacklisted from DeS Bot™.\n**Reason:** ${reason}`)] }); } catch {}
        await g.leave();
      }
      await interaction.editReply({ embeds: [E.error('Server Blacklisted', `**${g?.name || guildId}** has been blacklisted and the bot has left.\n**Reason:** ${reason}`)] });
    }

    // ── LIST BLACKLIST ────────────────────────────────────────
    else if (sub === 'listblacklist') {
      const users = await User.find({ blacklisted: true }).limit(20);
      if (!users.length) return interaction.editReply({ embeds: [E.info('Empty Blacklist', 'No blacklisted users.')] });
      const fields = users.map(u => ({
        name: u.username || u.userId,
        value: `🆔 \`${u.userId}\`\n📋 ${u.blacklistReason || 'No reason'}`,
        inline: true,
      }));
      await interaction.editReply({ embeds: [E.error(`Blacklisted Users (${users.length})`, '', fields)] });
    }

    // ── SERVERS ───────────────────────────────────────────────
    else if (sub === 'servers') {
      const page = (interaction.options.getInteger('page') || 1) - 1;
      const perPage = 15;
      const all = [...client.guilds.cache.values()];
      const total = all.length;
      const slice = all.slice(page * perPage, (page + 1) * perPage);
      const desc = slice.map((g, i) =>
        `**${page * perPage + i + 1}.** ${g.name}\n  \`${g.id}\` — 👥 ${g.memberCount} members`
      ).join('\n\n');
      await interaction.editReply({ embeds: [E.gold(`🌐 Servers (${total} total) — Page ${page+1}/${Math.ceil(total/perPage)}`, desc)] });
    }

    // ── LEAVE SERVER ──────────────────────────────────────────
    else if (sub === 'leaveserver') {
      const id = interaction.options.getString('id');
      const reason = interaction.options.getString('reason') || 'Removed by owner';
      const g = client.guilds.cache.get(id);
      if (!g) return interaction.editReply({ embeds: [E.error('Not Found', `Bot is not in server \`${id}\`.`)] });
      const name = g.name;
      const memberCount = g.memberCount;
      try {
        const owner = await g.fetchOwner();
        await owner.user.send({ embeds: [E.warn('Bot Leaving', `DeS Bot™ is leaving your server **${name}**.\n**Reason:** ${reason}`)] });
      } catch {}
      await g.leave();
      await interaction.editReply({ embeds: [E.success('Left Server', `Left **${name}** (\`${id}\`) — ${memberCount} members.\n**Reason:** ${reason}`)] });
    }

    // ── LEAVE ALL SERVERS ─────────────────────────────────────
    else if (sub === 'leaveallservers') {
      const confirm = interaction.options.getString('confirm');
      if (confirm !== 'CONFIRM') return interaction.editReply({ embeds: [E.error('Not Confirmed', 'You must type exactly `CONFIRM` to proceed. This will leave ALL servers.')] });

      const whitelist = (process.env.OWNER_GUILD_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
      const guilds = [...client.guilds.cache.values()].filter(g => !whitelist.includes(g.id));

      await interaction.editReply({ embeds: [E.warn('Leaving All Servers...', `Leaving **${guilds.length}** servers. This may take a moment...`)] });

      let left = 0, failed = 0;
      for (const g of guilds) {
        try { await g.leave(); left++; await new Promise(r => setTimeout(r, 300)); } catch { failed++; }
      }
      await interaction.editReply({ embeds: [E.success('Done', `Left **${left}** servers. Failed: **${failed}**.`)] });
    }

    // ── SERVER INFO ───────────────────────────────────────────
    else if (sub === 'serverinfo') {
      const guildId = interaction.options.getString('guild-id');
      const g = client.guilds.cache.get(guildId);
      if (!g) return interaction.editReply({ embeds: [E.error('Not In Server', `Bot is not in \`${guildId}\`.`)] });
      const owner = await g.fetchOwner().catch(() => null);
      const cfg = await Guild.findOne({ guildId: g.id });
      await interaction.editReply({ embeds: [E.gold(`Server: ${g.name}`, '', [
        { name: '🆔 ID', value: `\`${g.id}\``, inline: true },
        { name: '👑 Owner', value: owner ? `${owner.user.tag} \`${owner.id}\`` : 'Unknown', inline: true },
        { name: '👥 Members', value: `${g.memberCount}`, inline: true },
        { name: '💬 Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: '🎭 Roles', value: `${g.roles.cache.size - 1}`, inline: true },
        { name: '🌟 Boosts', value: `${g.premiumSubscriptionCount || 0}`, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(g.createdTimestamp/1000)}:R>`, inline: true },
        { name: '💎 Premium', value: cfg?.premium ? '✅ Yes' : '❌ No', inline: true },
        { name: '🚫 Blacklisted', value: cfg?.blacklisted ? '⛔ Yes' : '✅ No', inline: true },
      ]).setThumbnail(g.iconURL({ dynamic: true }))] });
    }

    // ── SERVER BAN ────────────────────────────────────────────
    else if (sub === 'serverban') {
      const guildId = interaction.options.getString('guild-id');
      const reason = interaction.options.getString('reason');
      await Guild.findOneAndUpdate({ guildId }, { $set: { blacklisted: true, blacklistReason: reason } }, { upsert: true });
      const g = client.guilds.cache.get(guildId);
      if (g) await g.leave();
      await interaction.editReply({ embeds: [E.error('Server Banned', `Server \`${guildId}\` has been banned from using DeS Bot™.\n**Reason:** ${reason}`)] });
    }

    // ── USER INFO ─────────────────────────────────────────────
    else if (sub === 'userinfo') {
      const user = interaction.options.getUser('user');
      const u = await User.findOne({ userId: user.id });
      await interaction.editReply({ embeds: [E.gold(`🔍 DB: ${user.username}`, '', [
        { name: '🆔 User ID', value: `\`${user.id}\``, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true },
        { name: '💎 Premium', value: u?.premium?.active ? `✅ ${u.premium.plan?.toUpperCase()} — <t:${Math.floor(new Date(u.premium.expiresAt).getTime()/1000)}:R>` : '❌ None', inline: false },
        { name: '🚫 Blacklisted', value: u?.blacklisted ? `⛔ ${u.blacklistReason}` : '✅ No', inline: false },
        { name: '⭐ Points', value: `${u?.points || 0}`, inline: true },
        { name: '🪙 Coins', value: `${u?.coins || 0}`, inline: true },
        { name: '⚡ Level', value: `${u?.level || 1}`, inline: true },
        { name: '🏆 Wins', value: `${u?.wins || 0}`, inline: true },
        { name: '⚠️ Warnings', value: `${u?.warnings?.length || 0}`, inline: true },
        { name: '🏅 Badges', value: u?.badges?.length ? u.badges.join(' ') : 'None', inline: true },
      ]).setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))] });
    }

    // ── RESET USER ────────────────────────────────────────────
    else if (sub === 'resetuser') {
      const user = interaction.options.getUser('user');
      await User.findOneAndUpdate(
        { userId: user.id },
        { $set: { wins: 0, losses: 0, matches: 0, points: 0, streak: 0, xp: 0, level: 1, coins: 0, warnings: [], badges: [] } }
      );
      try { await user.send({ embeds: [E.warn('Stats Reset', 'Your DeS Bot™ stats have been reset by an owner.')] }); } catch {}
      await interaction.editReply({ embeds: [E.success('User Reset', `All stats and data for **${user.username}** have been reset.`)] });
    }

    // ── DELETE USER ───────────────────────────────────────────
    else if (sub === 'deleteuser') {
      const user = interaction.options.getUser('user');
      await User.findOneAndDelete({ userId: user.id });
      await interaction.editReply({ embeds: [E.success('User Deleted', `**${user.username}**'s database entry has been permanently deleted.`)] });
    }

    // ── GIVE / TAKE / SET COINS ───────────────────────────────
    else if (sub === 'givecoins') {
      const user = interaction.options.getUser('user');
      const amt = interaction.options.getInteger('amount');
      await User.findOneAndUpdate({ userId: user.id }, { $inc: { coins: amt } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Coins Given', `+**${amt}** coins → **${user.username}**.`)] });
    }
    else if (sub === 'takecoins') {
      const user = interaction.options.getUser('user');
      const amt = interaction.options.getInteger('amount');
      await User.findOneAndUpdate({ userId: user.id }, { $inc: { coins: -amt } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Coins Taken', `-**${amt}** coins from **${user.username}**.`)] });
    }
    else if (sub === 'setcoins') {
      const user = interaction.options.getUser('user');
      const amt = interaction.options.getInteger('amount');
      await User.findOneAndUpdate({ userId: user.id }, { $set: { coins: amt } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Coins Set', `**${user.username}**'s coins set to **${amt}**.`)] });
    }

    // ── GIVE / TAKE POINTS ────────────────────────────────────
    else if (sub === 'givepoints') {
      const user = interaction.options.getUser('user');
      const amt = interaction.options.getInteger('amount');
      await User.findOneAndUpdate({ userId: user.id }, { $inc: { points: amt } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Points Given', `+**${amt}** points → **${user.username}**.`)] });
    }
    else if (sub === 'takepoints') {
      const user = interaction.options.getUser('user');
      const amt = interaction.options.getInteger('amount');
      await User.findOneAndUpdate({ userId: user.id }, { $inc: { points: -amt } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Points Taken', `-**${amt}** points from **${user.username}**.`)] });
    }

    // ── SET LEVEL ─────────────────────────────────────────────
    else if (sub === 'setlevel') {
      const user = interaction.options.getUser('user');
      const level = interaction.options.getInteger('level');
      await User.findOneAndUpdate({ userId: user.id }, { $set: { level } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Level Set', `**${user.username}**'s level set to **${level}**.`)] });
    }

    // ── SET XP ────────────────────────────────────────────────
    else if (sub === 'setxp') {
      const user = interaction.options.getUser('user');
      const xp = interaction.options.getInteger('xp');
      await User.findOneAndUpdate({ userId: user.id }, { $set: { xp } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('XP Set', `**${user.username}**'s XP set to **${xp}**.`)] });
    }

    // ── ADD / REMOVE BADGE ────────────────────────────────────
    else if (sub === 'addbadge') {
      const user = interaction.options.getUser('user');
      const badge = interaction.options.getString('badge');
      await User.findOneAndUpdate({ userId: user.id }, { $addToSet: { badges: badge } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Badge Added', `Badge **${badge}** added to **${user.username}**.`)] });
    }
    else if (sub === 'removebadge') {
      const user = interaction.options.getUser('user');
      const badge = interaction.options.getString('badge');
      await User.findOneAndUpdate({ userId: user.id }, { $pull: { badges: badge } });
      await interaction.editReply({ embeds: [E.success('Badge Removed', `Badge **${badge}** removed from **${user.username}**.`)] });
    }

    // ── GLOBAL STATS ──────────────────────────────────────────
    else if (sub === 'stats') {
      const [userCount, premCount, blCount] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ 'premium.active': true }),
        User.countDocuments({ blacklisted: true }),
      ]);
      const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
      await interaction.editReply({ embeds: [E.gold('🤖 Global Statistics', '', [
        { name: '🌐 Servers', value: `**${client.guilds.cache.size}**`, inline: true },
        { name: '👥 Total Members', value: `**${totalMembers.toLocaleString()}**`, inline: true },
        { name: '🗄️ DB Users', value: `**${userCount}**`, inline: true },
        { name: '💎 Premium Users', value: `**${premCount}**`, inline: true },
        { name: '🚫 Blacklisted', value: `**${blCount}**`, inline: true },
        { name: '📡 WS Ping', value: `**${client.ws.ping}ms**`, inline: true },
        { name: '⏰ Uptime', value: `<t:${Math.floor((Date.now()-client.uptime)/1000)}:R>`, inline: true },
        { name: '💾 RAM', value: `**${Math.round(process.memoryUsage().heapUsed/1024/1024)}MB**`, inline: true },
        { name: '⚡ Commands', value: `**${client.commands.size}**`, inline: true },
      ])] });
    }

    // ── DB STATS ──────────────────────────────────────────────
    else if (sub === 'dbstats') {
      const counts = await Promise.all([
        User.countDocuments(), Guild.countDocuments(),
        Tournament.countDocuments(), Ticket.countDocuments(),
        Modlog.countDocuments(), Giveaway.countDocuments(),
      ]);
      await interaction.editReply({ embeds: [E.gold('📦 Database Statistics', '', [
        { name: '👥 Users', value: `\`${counts[0]}\``, inline: true },
        { name: '🌐 Guilds', value: `\`${counts[1]}\``, inline: true },
        { name: '🏆 Tournaments', value: `\`${counts[2]}\``, inline: true },
        { name: '🎫 Tickets', value: `\`${counts[3]}\``, inline: true },
        { name: '📋 Mod Cases', value: `\`${counts[4]}\``, inline: true },
        { name: '🎉 Giveaways', value: `\`${counts[5]}\``, inline: true },
      ])] });
    }

    // ── MAINTENANCE ───────────────────────────────────────────
    else if (sub === 'maintenance') {
      const en = interaction.options.getBoolean('enabled');
      const reason = interaction.options.getString('reason') || 'Scheduled maintenance';
      global.maintenanceMode = en;
      global.maintenanceReason = reason;
      await client.user.setPresence({
        status: en ? 'dnd' : 'online',
        activities: [{ name: en ? `🔧 Maintenance — ${reason}` : '🏆 DOT Esport', type: 0 }],
      });
      await interaction.editReply({ embeds: [E[en ? 'warn' : 'success'](`Maintenance ${en ? 'ENABLED ⚠️' : 'DISABLED ✅'}`, en ? `**Reason:** ${reason}\n\nAll commands will show a maintenance message until this is disabled.` : 'Bot is back online and accepting commands!')] });
    }

    // ── SET STATUS ────────────────────────────────────────────
    else if (sub === 'setstatus') {
      const typeStr = interaction.options.getString('type');
      const text = interaction.options.getString('text');
      const status = interaction.options.getString('status') || 'online';
      const typeMap = { PLAYING: 0, WATCHING: 3, LISTENING: 2, COMPETING: 5 };
      await client.user.setPresence({
        status,
        activities: [{ name: text, type: typeMap[typeStr] || 0 }],
      });
      await interaction.editReply({ embeds: [E.success('Status Updated', `**${typeStr}** ${text}\nStatus: **${status}**`)] });
    }

    // ── SET AVATAR ────────────────────────────────────────────
    else if (sub === 'setavatar') {
      const url = interaction.options.getString('url');
      try {
        await client.user.setAvatar(url);
        await interaction.editReply({ embeds: [E.success('Avatar Updated', 'Bot avatar has been changed.').setThumbnail(url)] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Failed', e.message)] }); }
    }

    // ── SET NAME ──────────────────────────────────────────────
    else if (sub === 'setname') {
      const name = interaction.options.getString('name');
      try {
        await client.user.setUsername(name);
        await interaction.editReply({ embeds: [E.success('Username Changed', `Bot username updated to **${name}**.`)] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Failed', `${e.message}\n\nNote: Username can only be changed twice per hour.`)] }); }
    }

    // ── RESTART ───────────────────────────────────────────────
    else if (sub === 'restart') {
      await interaction.editReply({ embeds: [E.warn('Restarting...', 'Bot is restarting. It will be back online in a few seconds.')] });
      setTimeout(() => process.exit(0), 2000);
    }

    // ── EVAL ──────────────────────────────────────────────────
    else if (sub === 'eval') {
      const code = interaction.options.getString('code');
      try {
        let result = eval(code);
        if (result instanceof Promise) result = await result;
        if (typeof result !== 'string') result = require('util').inspect(result, { depth: 2 });
        const out = result.length > 1900 ? result.slice(0, 1900) + '\n...(truncated)' : result;
        await interaction.editReply({ embeds: [E.success('Eval Result', `\`\`\`js\n${out}\n\`\`\``)] });
      } catch (e) {
        await interaction.editReply({ embeds: [E.error('Eval Error', `\`\`\`js\n${e.message}\n\`\`\``)] });
      }
    }

    // ── EXEC ──────────────────────────────────────────────────
    else if (sub === 'exec') {
      const cmd = interaction.options.getString('command');
      const { exec } = require('child_process');
      exec(cmd, { timeout: 10000 }, async (err, stdout, stderr) => {
        const out = (stdout || stderr || err?.message || 'No output').slice(0, 1900);
        await interaction.editReply({ embeds: [E[err ? 'error' : 'success'](err ? 'Exec Error' : 'Exec Result', `\`\`\`\n${out}\n\`\`\``)] });
      });
    }

    // ── BROADCAST ─────────────────────────────────────────────
    else if (sub === 'broadcast') {
      const message = interaction.options.getString('message');
      const title = interaction.options.getString('title') || '📢 Announcement';
      const broadcastEmbed = E.gold(title, message)
        .setAuthor({ name: 'DeS Bot™ — DOT Esport', iconURL: client.user.displayAvatarURL() });

      let sent = 0, failed = 0;
      await interaction.editReply({ embeds: [E.warn('Broadcasting...', `Sending to all ${client.guilds.cache.size} servers...`)] });

      for (const [, g] of client.guilds.cache) {
        try {
          const cfg = await Guild.findOne({ guildId: g.id });
          const cid = cfg?.channels?.logs || cfg?.channels?.welcome;
          if (cid) {
            const ch = await client.channels.fetch(cid).catch(() => null);
            if (ch) { await ch.send({ embeds: [broadcastEmbed] }); sent++; }
          }
        } catch { failed++; }
        await new Promise(r => setTimeout(r, 100));
      }
      await interaction.editReply({ embeds: [E.success('Broadcast Complete', `✅ Sent to **${sent}** servers.\n❌ Failed: **${failed}** servers.`)] });
    }

    // ── ANNOUNCE ──────────────────────────────────────────────
    else if (sub === 'announce') {
      const title = interaction.options.getString('title');
      const message = interaction.options.getString('message');
      const channelId = interaction.options.getString('channel-id');
      const colorHex = interaction.options.getString('color');
      const color = colorHex ? parseInt(colorHex.replace('#', ''), 16) : E.C.GOLD;
      const embed = E.make(isNaN(color) ? E.C.GOLD : color).setTitle(`📢  ${title}`).setDescription(message).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp();

      if (channelId) {
        const ch = await client.channels.fetch(channelId).catch(() => null);
        if (!ch) return interaction.editReply({ embeds: [E.error('Channel Not Found', `Channel \`${channelId}\` not found.`)] });
        await ch.send({ embeds: [embed] });
        await interaction.editReply({ embeds: [E.success('Announced', `Announcement sent to <#${channelId}>.`)] });
      } else {
        await interaction.editReply({ embeds: [embed] });
      }
    }

    // ── DM USER ───────────────────────────────────────────────
    else if (sub === 'dm') {
      const user = interaction.options.getUser('user');
      const message = interaction.options.getString('message');
      try {
        await user.send({ embeds: [E.gold('📩 Message from DeS Bot™ Owner', message).setFooter({ text: 'DeS Bot™  ·  DOT Esport — Official Message' })] });
        await interaction.editReply({ embeds: [E.success('DM Sent', `Message delivered to **${user.username}**.`)] });
      } catch (e) {
        await interaction.editReply({ embeds: [E.error('DM Failed', `Could not DM **${user.username}**. They may have DMs disabled.`)] });
      }
    }
  }
};

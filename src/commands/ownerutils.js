const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { requireOwner } = require('../utils/helpers');
const { User, Guild, Tournament, Ticket, Modlog, Giveaway } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ownerutils').setDescription('⚙️ Bot utilities — server, user, and stats management')

    // ── Server Management ─────────────────────────────────────
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

    // ── User Management ───────────────────────────────────────
    .addSubcommand(s => s.setName('userinfo').setDescription('Full database info on a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('resetuser').setDescription('Reset all stats for a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('deleteuser').setDescription('⚠️ Permanently delete a user from database')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
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

    // ── Statistics ────────────────────────────────────────────
    .addSubcommand(s => s.setName('stats').setDescription('Global bot statistics'))
    .addSubcommand(s => s.setName('dbstats').setDescription('Database collection counts'))

    // ── Advanced/Dangerous ────────────────────────────────────
    .addSubcommand(s => s.setName('restart').setDescription('⚠️ Restart the bot process'))
    .addSubcommand(s => s.setName('eval').setDescription('⚠️ Evaluate JavaScript code')
      .addStringOption(o => o.setName('code').setDescription('Code to run').setRequired(true)))
    .addSubcommand(s => s.setName('exec').setDescription('⚠️ Execute a shell command')
      .addStringOption(o => o.setName('command').setDescription('Shell command').setRequired(true))),

  async execute(interaction, client) {
    if (!(await requireOwner(interaction))) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    // ── SERVERS ───────────────────────────────────────────────
    if (sub === 'servers') {
      let page = (interaction.options.getInteger('page') || 1) - 1;
      const perPage = 15;
      const all = [...client.guilds.cache.values()];
      const total = all.length;
      const maxPages = Math.ceil(total / perPage) || 1;
      
      // Validate page number
      if (page < 0) page = 0;
      if (page >= maxPages) page = maxPages - 1;
      
      const slice = all.slice(page * perPage, (page + 1) * perPage);
      const desc = slice.map((g, i) =>
        `**${page * perPage + i + 1}.** ${g.name}\n  \`${g.id}\` — 👥 ${g.memberCount} members`
      ).join('\n\n');
      await interaction.editReply({ embeds: [E.gold(`🌐 Servers (${total} total) — Page ${page+1}/${maxPages}`, desc)] });
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
  }
};

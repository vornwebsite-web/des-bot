const express = require('express');
const { Guild, User, Tournament, Ticket, Modlog } = require('../../models/index');

module.exports = (io) => {
  const router = express.Router();
  const isAuth = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/auth/login');

  // ── Home ────────────────────────────────────────────────────
  router.get('/', (req, res) => res.render('home', { user: req.user }));

  // ── Dashboard Select ────────────────────────────────────────
  router.get('/dashboard', isAuth, async (req, res) => {
    const client = req.app.locals.client;
    const userGuilds = req.user.guilds || [];
    const manageable = userGuilds.filter(g => (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20));
    const botGuilds = manageable.filter(g => client.guilds.cache.has(g.id));
    const notInGuilds = manageable.filter(g => !client.guilds.cache.has(g.id));
    res.render('dashboard', { user: req.user, botGuilds, notInGuilds, clientId: process.env.CLIENT_ID });
  });

  // ── Guild Dashboard ─────────────────────────────────────────
  router.get('/dashboard/:guildId', isAuth, async (req, res) => {
    const client = req.app.locals.client;
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.redirect('/dashboard');
    const member = await guild.members.fetch(req.user.id).catch(() => null);
    if (!member || !member.permissions.has(0x20n)) return res.status(403).render('error', { user: req.user, message: 'You do not have Manage Server permission.' });
    const cfg = await Guild.findOne({ guildId: guild.id }) || {};
    const stats = {
      members: guild.memberCount,
      channels: guild.channels.cache.size,
      roles: guild.roles.cache.size - 1,
      openTickets: await Ticket.countDocuments({ guildId: guild.id, status: { $in: ['open', 'claimed'] } }),
      activeTournaments: await Tournament.countDocuments({ guildId: guild.id, status: { $in: ['open', 'ongoing'] } }),
      totalBans: await Modlog.countDocuments({ guildId: guild.id, type: 'ban' }),
    };
    res.render('guild', { user: req.user, guild: { id: guild.id, name: guild.name, icon: guild.iconURL({ dynamic: true }) }, cfg, stats });
  });

  // ── Guild Save ──────────────────────────────────────────────
  router.post('/dashboard/:guildId/save', isAuth, async (req, res) => {
    const client = req.app.locals.client;
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.json({ success: false, error: 'Guild not found' });
    const member = await guild.members.fetch(req.user.id).catch(() => null);
    if (!member?.permissions.has(0x20n)) return res.json({ success: false, error: 'No permission' });

    try {
      const body = req.body;
      const update = {};

      // Welcome
      if (body.welcomeEnabled !== undefined) update['welcome.enabled'] = body.welcomeEnabled === 'true';
      if (body.welcomeChannel) update['channels.welcome'] = body.welcomeChannel;
      if (body.welcomeMessage) update['welcome.message'] = body.welcomeMessage;
      if (body.welcomePing !== undefined) update['welcome.ping'] = body.welcomePing === 'true';
      if (body.welcomeDm !== undefined) update['welcome.dm'] = body.welcomeDm === 'true';

      // Farewell
      if (body.farewellEnabled !== undefined) update['farewell.enabled'] = body.farewellEnabled === 'true';
      if (body.farewellChannel) update['channels.farewell'] = body.farewellChannel;
      if (body.farewellMessage) update['farewell.message'] = body.farewellMessage;

      // Logs
      if (body.logsEnabled !== undefined) update['logging.enabled'] = body.logsEnabled === 'true';
      if (body.logsChannel) update['channels.logs'] = body.logsChannel;
      if (body.modLogsChannel) update['channels.modLogs'] = body.modLogsChannel;

      // AutoMod
      if (body.autoMod !== undefined) update['moderation.autoMod'] = body.autoMod === 'true';
      if (body.antiSpam !== undefined) update['moderation.antiSpam'] = body.antiSpam === 'true';
      if (body.antiLinks !== undefined) update['moderation.antiLinks'] = body.antiLinks === 'true';
      if (body.antiInvites !== undefined) update['moderation.antiInvites'] = body.antiInvites === 'true';

      // Anti-Raid
      if (body.antiRaidEnabled !== undefined) update['antiRaid.enabled'] = body.antiRaidEnabled === 'true';
      if (body.antiRaidThreshold) update['antiRaid.threshold'] = parseInt(body.antiRaidThreshold);
      if (body.antiRaidAction) update['antiRaid.action'] = body.antiRaidAction;

      // Anti-Nuke
      if (body.antiNukeEnabled !== undefined) update['antiNuke.enabled'] = body.antiNukeEnabled === 'true';
      if (body.antiNukeThreshold) update['antiNuke.threshold'] = parseInt(body.antiNukeThreshold);

      // Leveling
      if (body.levelingEnabled !== undefined) update['leveling.enabled'] = body.levelingEnabled === 'true';
      if (body.xpPerMsg) update['leveling.xpPerMsg'] = parseInt(body.xpPerMsg);
      if (body.levelCooldown) update['leveling.cooldown'] = parseInt(body.levelCooldown);

      // Tickets
      if (body.ticketsEnabled !== undefined) update['tickets.enabled'] = body.ticketsEnabled === 'true';
      if (body.ticketSupportRole) update['tickets.supportRole'] = body.ticketSupportRole;

      await Guild.findOneAndUpdate({ guildId: guild.id }, { $set: update }, { upsert: true });
      io.to(`guild:${guild.id}`).emit('config-updated', { guildId: guild.id });
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  // ── API endpoints ────────────────────────────────────────────
  router.get('/api/guild/:id/stats', isAuth, async (req, res) => {
    const client = req.app.locals.client;
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.json({ error: 'Not found' });
    try {
      const [tickets, tournaments, bans] = await Promise.all([
        Ticket.countDocuments({ guildId: guild.id, status: { $in: ['open', 'claimed'] } }),
        Tournament.countDocuments({ guildId: guild.id, status: { $in: ['open', 'ongoing'] } }),
        Modlog.countDocuments({ guildId: guild.id, type: 'ban' }),
      ]);
      res.json({ members: guild.memberCount, tickets, tournaments, bans, ping: client.ws.ping });
    } catch (e) { res.json({ error: e.message }); }
  });

  router.get('/api/guild/:id/leaderboard', isAuth, async (req, res) => {
    try {
      const users = await User.find({}).sort({ points: -1 }).limit(20);
      res.json(users.map(u => ({ userId: u.userId, username: u.username, points: u.points, level: u.level, wins: u.wins })));
    } catch (e) { res.json({ error: e.message }); }
  });

  router.get('/api/guild/:id/tournaments', isAuth, async (req, res) => {
    try {
      const ts = await Tournament.find({ guildId: req.params.id }).sort({ createdAt: -1 }).limit(20);
      res.json(ts);
    } catch (e) { res.json({ error: e.message }); }
  });

  router.get('/api/guild/:id/tickets', isAuth, async (req, res) => {
    try {
      const ts = await Ticket.find({ guildId: req.params.id }).sort({ createdAt: -1 }).limit(50);
      res.json(ts);
    } catch (e) { res.json({ error: e.message }); }
  });

  // ── Premium page ─────────────────────────────────────────────
  router.get('/premium', (req, res) => res.render('premium', { user: req.user }));

  return router;
};

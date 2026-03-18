const express = require("express");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { Guild, User, Tournament, Ticket, Modlog, Giveaway } = require("../../models/index");

function isAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect("/auth/login");
}

async function hasManage(guild, userId) {
  const member = await guild.members.fetch(userId).catch(() => null);
  return member?.permissions.has(PermissionFlagsBits.ManageGuild);
}

function serializeGuild(guild) {
  const textChannels = [...guild.channels.cache.values()]
    .filter(c => c.type === ChannelType.GuildText)
    .sort((a, b) => a.position - b.position)
    .map(c => ({ id: c.id, name: c.name, category: c.parent?.name || "Uncategorized" }));

  const categories = [...guild.channels.cache.values()]
    .filter(c => c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position)
    .map(c => ({ id: c.id, name: c.name }));

  const roles = [...guild.roles.cache.values()]
    .filter(r => r.id !== guild.id && !r.managed)
    .sort((a, b) => b.position - a.position)
    .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));

  return { textChannels, categories, roles };
}

module.exports = (io) => {
  const router = express.Router();

  // Pages
  router.get("/", (req, res) => res.render("home", { user: req.user }));
  router.get("/premium", (req, res) => res.render("premium", { user: req.user }));

  router.get("/dashboard", isAuth, async (req, res) => {
    const client = req.app.locals.client;
    const userGuilds = req.user.guilds || [];

    const manageable = userGuilds.filter(g => {
      try {
        return (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20);
      } catch {
        return false;
      }
    });

    res.render("dashboard", {
      user: req.user,
      botGuilds: manageable.filter(g => client.guilds.cache.has(g.id)),
      notInGuilds: manageable.filter(g => !client.guilds.cache.has(g.id)),
      clientId: process.env.CLIENT_ID,
    });
  });

  router.get("/dashboard/:guildId", isAuth, async (req, res) => {
    const client = req.app.locals.client;
    const guild = client.guilds.cache.get(req.params.guildId);

    if (!guild) return res.redirect("/dashboard");

    if (!(await hasManage(guild, req.user.id))) {
      return res.status(403).render("error", {
        user: req.user,
        message: "You need Manage Server permission."
      });
    }

    const cfg = await Guild.findOne({ guildId: guild.id }) || {};
    const gd = serializeGuild(guild);

    const [openTickets, activeTournaments, totalBans, totalCases] = await Promise.all([
      Ticket.countDocuments({ guildId: guild.id, status: { $in: ["open", "claimed"] } }),
      Tournament.countDocuments({ guildId: guild.id, status: { $in: ["open", "ongoing"] } }),
      Modlog.countDocuments({ guildId: guild.id, type: "ban" }),
      Modlog.countDocuments({ guildId: guild.id }),
    ]);

    res.render("guild", {
      user: req.user,
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL({ dynamic: true, size: 128 })
      },
      cfg,
      channels: gd.textChannels,
      categories: gd.categories,
      roles: gd.roles,
      stats: {
        members: guild.memberCount,
        channels: guild.channels.cache.size,
        roles: guild.roles.cache.size - 1,
        openTickets,
        activeTournaments,
        totalBans,
        totalCases
      },
    });
  });

  return router;
};
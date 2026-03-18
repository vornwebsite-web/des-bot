const express = require(“express”);
const { ChannelType, PermissionFlagsBits } = require(“discord.js”);
const { Guild, User, Tournament, Ticket, Modlog } = require(”../../models/index”);

function isAuth(req, res, next) {
if (req.isAuthenticated()) return next();
req.session.returnTo = req.originalUrl;
res.redirect(”/auth/login”);
}

async function hasManage(guild, userId) {
const member = await guild.members.fetch(userId).catch(function() { return null; });
return member && member.permissions.has(PermissionFlagsBits.ManageGuild);
}

function serializeGuild(guild) {
const textChannels = Array.from(guild.channels.cache.values())
.filter(function(c) { return c.type === ChannelType.GuildText; })
.sort(function(a, b) { return a.position - b.position; })
.map(function(c) { return { id: c.id, name: c.name, category: c.parent ? c.parent.name : “Uncategorized” }; });
const categories = Array.from(guild.channels.cache.values())
.filter(function(c) { return c.type === ChannelType.GuildCategory; })
.sort(function(a, b) { return a.position - b.position; })
.map(function(c) { return { id: c.id, name: c.name }; });
const roles = Array.from(guild.roles.cache.values())
.filter(function(r) { return r.id !== guild.id && !r.managed; })
.sort(function(a, b) { return b.position - a.position; })
.map(function(r) { return { id: r.id, name: r.name, color: r.hexColor }; });
return { textChannels: textChannels, categories: categories, roles: roles };
}

module.exports = function(io) {
const router = express.Router();

router.get(”/”, function(req, res) { res.render(“home”, { user: req.user }); });
router.get(”/premium”, function(req, res) { res.render(“premium”, { user: req.user }); });

router.get(”/dashboard”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const userGuilds = req.user.guilds || [];
const manageable = userGuilds.filter(function(g) {
try { return (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20); } catch(e) { return false; }
});
res.render(“dashboard”, {
user: req.user,
botGuilds: manageable.filter(function(g) { return client.guilds.cache.has(g.id); }),
notInGuilds: manageable.filter(function(g) { return !client.guilds.cache.has(g.id); }),
clientId: process.env.CLIENT_ID
});
});

router.get(”/dashboard/:guildId”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild) return res.redirect(”/dashboard”);
if (!(await hasManage(guild, req.user.id)))
return res.status(403).render(“error”, { user: req.user, message: “You need Manage Server permission.” });
const cfg = await Guild.findOne({ guildId: guild.id }) || {};
const gd = serializeGuild(guild);
const counts = await Promise.all([
Ticket.countDocuments({ guildId: guild.id, status: { $in: [“open”, “claimed”] } }),
Tournament.countDocuments({ guildId: guild.id, status: { $in: [“open”, “ongoing”] } }),
Modlog.countDocuments({ guildId: guild.id, type: “ban” }),
Modlog.countDocuments({ guildId: guild.id })
]);
res.render(“guild”, {
user: req.user,
guild: { id: guild.id, name: guild.name, icon: guild.iconURL({ dynamic: true, size: 128 }) },
cfg: cfg,
channels: gd.textChannels,
categories: gd.categories,
roles: gd.roles,
stats: {
members: guild.memberCount,
channels: guild.channels.cache.size,
roles: guild.roles.cache.size - 1,
openTickets: counts[0],
activeTournaments: counts[1],
totalBans: counts[2],
totalCases: counts[3]
}
});
});

router.post(”/dashboard/:guildId/save”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild) return res.json({ success: false, error: “Bot is not in this server.” });
if (!(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No permission.” });
try {
const b = req.body;
const set = {};
function bool(v) { return v === “true” || v === true; }
if (b.welcomeEnabled !== undefined) set[“welcome.enabled”] = bool(b.welcomeEnabled);
if (b.welcomeChannel !== undefined) set[“channels.welcome”] = b.welcomeChannel;
if (b.welcomeMessage !== undefined) set[“welcome.message”] = b.welcomeMessage;
if (b.welcomePing !== undefined) set[“welcome.ping”] = bool(b.welcomePing);
if (b.welcomeDm !== undefined) set[“welcome.dm”] = bool(b.welcomeDm);
if (b.welcomeDmMessage !== undefined) set[“welcome.dmMsg”] = b.welcomeDmMessage;
if (b.welcomeBanner !== undefined) set[“welcome.banner”] = b.welcomeBanner;
if (b.farewellEnabled !== undefined) set[“farewell.enabled”] = bool(b.farewellEnabled);
if (b.farewellChannel !== undefined) set[“channels.farewell”] = b.farewellChannel;
if (b.farewellMessage !== undefined) set[“farewell.message”] = b.farewellMessage;
if (b.logsEnabled !== undefined) set[“logging.enabled”] = bool(b.logsEnabled);
if (b.logsChannel !== undefined) set[“channels.logs”] = b.logsChannel;
if (b.modLogsChannel !== undefined) set[“channels.modLogs”] = b.modLogsChannel;
if (b.msgLogsChannel !== undefined) set[“channels.msgLogs”] = b.msgLogsChannel;
if (b.joinLogsChannel !== undefined) set[“channels.joinLogs”] = b.joinLogsChannel;
if (b.autoMod !== undefined) set[“moderation.autoMod”] = bool(b.autoMod);
if (b.antiSpam !== undefined) set[“moderation.antiSpam”] = bool(b.antiSpam);
if (b.antiLinks !== undefined) set[“moderation.antiLinks”] = bool(b.antiLinks);
if (b.antiInvites !== undefined) set[“moderation.antiInvites”] = bool(b.antiInvites);
if (b.antiCaps !== undefined) set[“moderation.antiCaps”] = bool(b.antiCaps);
if (b.badWords !== undefined) set[“moderation.badWords”] = b.badWords.split(”,”).map(function(w) { return w.trim(); }).filter(Boolean);
if (b.antiRaidEnabled !== undefined) set[“antiRaid.enabled”] = bool(b.antiRaidEnabled);
if (b.antiRaidThreshold !== undefined) set[“antiRaid.threshold”] = parseInt(b.antiRaidThreshold) || 10;
if (b.antiRaidWindow !== undefined) set[“antiRaid.window”] = parseInt(b.antiRaidWindow) || 10;
if (b.antiRaidAction !== undefined) set[“antiRaid.action”] = b.antiRaidAction;
if (b.antiNukeEnabled !== undefined) set[“antiNuke.enabled”] = bool(b.antiNukeEnabled);
if (b.antiNukeThreshold !== undefined) set[“antiNuke.threshold”] = parseInt(b.antiNukeThreshold) || 3;
if (b.antiNukeAction !== undefined) set[“antiNuke.action”] = b.antiNukeAction;
if (b.ticketsEnabled !== undefined) set[“tickets.enabled”] = bool(b.ticketsEnabled);
if (b.ticketLogChannel !== undefined) { set[“channels.ticketLogs”] = b.ticketLogChannel; set[“tickets.logChannel”] = b.ticketLogChannel; }
if (b.ticketCategoryId !== undefined) set[“tickets.categoryId”] = b.ticketCategoryId;
if (b.ticketMaxOpen !== undefined) set[“tickets.maxOpen”] = parseInt(b.ticketMaxOpen) || 1;
if (b.levelingEnabled !== undefined) set[“leveling.enabled”] = bool(b.levelingEnabled);
if (b.xpPerMsg !== undefined) set[“leveling.xpPerMsg”] = Math.min(100, Math.max(1, parseInt(b.xpPerMsg) || 15));
if (b.levelCooldown !== undefined) set[“leveling.cooldown”] = Math.min(300, Math.max(5, parseInt(b.levelCooldown) || 60));
if (b.levelUpChannel !== undefined) set[“channels.levelUp”] = b.levelUpChannel;
if (b.levelAnnounce !== undefined) set[“leveling.announceLevel”] = bool(b.levelAnnounce);
if (b.mutedRole !== undefined) set[“roles.muted”] = b.mutedRole;
if (b.autoRole !== undefined) set[“roles.autoRole”] = [].concat(b.autoRole).filter(Boolean);
if (b.suggestChannel !== undefined) set[“channels.suggestions”] = b.suggestChannel;
await Guild.findOneAndUpdate({ guildId: guild.id }, { $set: set }, { upsert: true, new: true });
if (b.mutedRole) {
const role = guild.roles.cache.get(b.mutedRole);
if (role) {
guild.channels.cache.filter(function(c) { return c.type === ChannelType.GuildText; }).forEach(function(ch) {
ch.permissionOverwrites.edit(role, { SendMessages: false, AddReactions: false }).catch(function() {});
});
}
}
io.to(“guild:” + guild.id).emit(“config-updated”, { guildId: guild.id });
res.json({ success: true, saved: Object.keys(set).length });
} catch(e) {
res.json({ success: false, error: e.message });
}
});

router.post(”/dashboard/:guildId/action/test-welcome”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const cfg = await Guild.findOne({ guildId: guild.id });
if (!cfg || !cfg.welcome || !cfg.welcome.enabled || !cfg.channels || !cfg.channels.welcome)
return res.json({ success: false, error: “Welcome not set up yet.” });
try {
const ch = await client.channels.fetch(cfg.channels.welcome);
const member = await guild.members.fetch(req.user.id);
const E = require(”../../utils/embeds”);
await ch.send({ content: cfg.welcome.ping ? “<@” + req.user.id + “>” : undefined, embeds: [E.welcome(member, cfg.welcome)] });
res.json({ success: true, message: “Test welcome sent to #” + ch.name });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/test-farewell”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const cfg = await Guild.findOne({ guildId: guild.id });
if (!cfg || !cfg.farewell || !cfg.farewell.enabled || !cfg.channels || !cfg.channels.farewell)
return res.json({ success: false, error: “Farewell not set up yet.” });
try {
const ch = await client.channels.fetch(cfg.channels.farewell);
const member = await guild.members.fetch(req.user.id);
const E = require(”../../utils/embeds”);
await ch.send({ embeds: [E.bye(member, cfg.farewell)] });
res.json({ success: true, message: “Test farewell sent to #” + ch.name });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/ticket-panel”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const channelId = req.body.channelId;
if (!channelId) return res.json({ success: false, error: “Select a channel first.” });
try {
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require(“discord.js”);
const E = require(”../../utils/embeds”);
const ch = await client.channels.fetch(channelId);
const embed = E.ticket(“Support Tickets”, “> Click below to open a support ticket.”);
const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(“ticket_open_general”).setLabel(“Open a Ticket”).setStyle(ButtonStyle.Primary).setEmoji(“🎫”)
);
await ch.send({ embeds: [embed], components: [row] });
res.json({ success: true, message: “Ticket panel posted to #” + ch.name });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/ticket-addrole”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const roleId = req.body.roleId;
if (!roleId) return res.json({ success: false, error: “No role ID.” });
const role = guild.roles.cache.get(roleId);
if (!role) return res.json({ success: false, error: “Role not found.” });
try {
const cfg = await Guild.findOne({ guildId: guild.id });
const current = (cfg && cfg.tickets && cfg.tickets.supportRoles && cfg.tickets.supportRoles.length)
? cfg.tickets.supportRoles
: (cfg && cfg.tickets && cfg.tickets.supportRole ? [cfg.tickets.supportRole] : []);
if (current.includes(roleId)) return res.json({ success: false, error: “Already a support role.” });
if (current.length >= 10) return res.json({ success: false, error: “Maximum 10 support roles.” });
const updated = current.concat([roleId]);
await Guild.findOneAndUpdate({ guildId: guild.id }, { $set: { “tickets.supportRoles”: updated, “tickets.supportRole”: updated[0] } }, { upsert: true });
res.json({ success: true, message: role.name + “ added.”, roleName: role.name });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/ticket-removerole”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const roleId = req.body.roleId;
if (!roleId) return res.json({ success: false, error: “No role ID.” });
try {
const cfg = await Guild.findOne({ guildId: guild.id });
const current = (cfg && cfg.tickets && cfg.tickets.supportRoles) ? cfg.tickets.supportRoles : [];
if (!current.includes(roleId)) return res.json({ success: false, error: “Not a support role.” });
const updated = current.filter(function(r) { return r !== roleId; });
await Guild.findOneAndUpdate({ guildId: guild.id }, { $set: { “tickets.supportRoles”: updated, “tickets.supportRole”: updated[0] || null } }, { upsert: true });
const role = guild.roles.cache.get(roleId);
res.json({ success: true, message: (role ? role.name : roleId) + “ removed.” });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/lockdown”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const lock = req.body.lock === “true” || req.body.lock === true;
let count = 0;
const textChannels = guild.channels.cache.filter(function(c) { return c.type === ChannelType.GuildText; });
for (const entry of textChannels) {
const ch = entry[1];
try { await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: lock ? false : null }); count++; } catch(e) {}
}
res.json({ success: true, message: (lock ? “Locked “ : “Unlocked “) + count + “ channels.” });
});

router.post(”/dashboard/:guildId/action/purge”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const channelId = req.body.channelId;
const amount = req.body.amount;
if (!channelId || !amount) return res.json({ success: false, error: “Missing channel or amount.” });
try {
const ch = await client.channels.fetch(channelId);
const deleted = await ch.bulkDelete(Math.min(100, parseInt(amount) || 10), true);
res.json({ success: true, message: “Deleted “ + deleted.size + “ messages from #” + ch.name });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/ban”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const userId = req.body.userId;
const reason = req.body.reason;
if (!userId) return res.json({ success: false, error: “No user ID.” });
try {
await guild.members.ban(userId, { reason: reason || “Dashboard ban by “ + req.user.username });
const caseId = await Modlog.countDocuments({ guildId: guild.id }) + 1;
await Modlog.create({ caseId: caseId, guildId: guild.id, type: “ban”, userId: userId, modId: req.user.id, modTag: req.user.username, reason: reason || “Dashboard ban” });
res.json({ success: true, message: “User “ + userId + “ banned. Case #” + caseId });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/kick”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const userId = req.body.userId;
const reason = req.body.reason;
if (!userId) return res.json({ success: false, error: “No user ID.” });
try {
const member = await guild.members.fetch(userId);
await member.kick(reason || “Dashboard kick by “ + req.user.username);
res.json({ success: true, message: “User kicked.” });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/close-ticket”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const ticketId = req.body.ticketId;
try {
const ticket = await Ticket.findOne({ ticketId: ticketId, guildId: guild.id });
if (!ticket) return res.json({ success: false, error: “Ticket not found.” });
ticket.status = “closed”;
ticket.closedAt = new Date();
ticket.closedBy = req.user.id;
await ticket.save();
const ch = await client.channels.fetch(ticket.channelId).catch(function() { return null; });
if (ch) {
const E = require(”../../utils/embeds”);
await ch.send({ embeds: [E.ticket(“Ticket Closed”, “Closed from dashboard by “ + req.user.username + “.”)] });
setTimeout(function() { ch.delete(“Dashboard close”).catch(function() {}); }, 5000);
}
res.json({ success: true, message: “Ticket “ + ticketId + “ closed.” });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.post(”/dashboard/:guildId/action/announce”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.guildId);
if (!guild || !(await hasManage(guild, req.user.id))) return res.json({ success: false, error: “No access.” });
const channelId = req.body.channelId;
const title = req.body.title;
const message = req.body.message;
const color = req.body.color;
if (!channelId || !title || !message) return res.json({ success: false, error: “Fill in all fields.” });
try {
const E = require(”../../utils/embeds”);
const ch = await client.channels.fetch(channelId);
const c = color ? parseInt(color.replace(”#”, “”), 16) : E.C.GOLD;
await ch.send({ embeds: [E.make(isNaN(c) ? E.C.GOLD : c).setTitle(“📢  “ + title).setDescription(message).setFooter({ text: “Announced by “ + req.user.username + “  ·  DeS Bot” }).setTimestamp()] });
res.json({ success: true, message: “Announcement sent to #” + ch.name });
} catch(e) { res.json({ success: false, error: e.message }); }
});

router.get(”/api/guild/:id/stats”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.id);
if (!guild) return res.json({ error: “Not found” });
const counts = await Promise.all([
Ticket.countDocuments({ guildId: guild.id, status: { $in: [“open”, “claimed”] } }),
Tournament.countDocuments({ guildId: guild.id, status: { $in: [“open”, “ongoing”] } }),
Modlog.countDocuments({ guildId: guild.id, type: “ban” }),
Modlog.countDocuments({ guildId: guild.id })
]);
res.json({ members: guild.memberCount, channels: guild.channels.cache.size, roles: guild.roles.cache.size - 1, tickets: counts[0], tournaments: counts[1], bans: counts[2], cases: counts[3], ping: client.ws.ping });
});

router.get(”/api/guild/:id/leaderboard”, isAuth, async function(req, res) {
const users = await User.find({ points: { $gt: 0 } }).sort({ points: -1 }).limit(20);
res.json(users.map(function(u) { return { userId: u.userId, username: u.username || u.userId, points: u.points || 0, level: u.level || 1, wins: u.wins || 0, coins: u.coins || 0 }; }));
});

router.get(”/api/guild/:id/tournaments”, isAuth, async function(req, res) {
const ts = await Tournament.find({ guildId: req.params.id }).sort({ createdAt: -1 }).limit(20);
res.json(ts);
});

router.get(”/api/guild/:id/tickets”, isAuth, async function(req, res) {
const ts = await Ticket.find({ guildId: req.params.id }).sort({ createdAt: -1 }).limit(50);
res.json(ts);
});

router.get(”/api/guild/:id/modlogs”, isAuth, async function(req, res) {
const logs = await Modlog.find({ guildId: req.params.id }).sort({ timestamp: -1 }).limit(30);
res.json(logs);
});

router.get(”/api/guild/:id/members”, isAuth, async function(req, res) {
const client = req.app.locals.client;
const guild = client.guilds.cache.get(req.params.id);
if (!guild) return res.json([]);
try {
const members = await guild.members.fetch({ limit: 100 });
res.json(Array.from(members.values()).map(function(m) {
return {
id: m.id,
username: m.user.username,
avatar: m.user.displayAvatarURL({ dynamic: true, size: 64 }),
joinedAt: m.joinedAt,
roles: Array.from(m.roles.cache.values()).filter(function(r) { return r.id !== guild.id; }).map(function(r) { return r.name; }).slice(0, 3),
bot: m.user.bot
};
}));
} catch(e) { res.json([]); }
});

return router;
};
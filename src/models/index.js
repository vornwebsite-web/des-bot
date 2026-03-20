const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── User ──────────────────────────────────────────────────────
const UserSchema = new Schema({
  userId:    { type: String, required: true },
  guildId:   { type: String, required: true },
  username:  String,
  xp:        { type: Number, default: 0 },
  level:     { type: Number, default: 1 },
  points:    { type: Number, default: 0 },
  coins:     { type: Number, default: 0 },
  wins:      { type: Number, default: 0 },
  losses:    { type: Number, default: 0 },
  matches:   { type: Number, default: 0 },
  streak:    { type: Number, default: 0 },
  bio:       { type: String, default: '' },
  badges:    [String],
  invites:   { type: Number, default: 0 },
  invitedBy: { type: String, default: null },
  warnings:  [{ reason: String, modId: String, guildId: String, at: { type: Date, default: Date.now } }],
  premium:   { active: Boolean, plan: String, expiresAt: Date, startedAt: Date, giftedBy: String },
  xpBoost:   { active: Boolean, expiresAt: Date },
  blacklisted: Boolean,
  blacklistReason: String,
  dailyLast: Date,
  weeklyLast: Date,
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index - allows same userId in different guilds
UserSchema.index({ userId: 1, guildId: 1 }, { unique: true });

// ── Guild ─────────────────────────────────────────────────────
const GuildSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  name:    String,
  premium: Boolean,
  channels: {
    welcome: String, farewell: String,
    logs: String, modLogs: String, msgLogs: String, joinLogs: String,
    ticketCategory: String, ticketLogs: String, levelUp: String,
    suggestions: String,
  },
  roles: {
    muted: String, premium: String,
    autoRole: [String], mod: [String], admin: [String],
  },
  welcome:  { enabled: Boolean, message: String, banner: String, ping: Boolean, dm: Boolean, dmMsg: String },
  farewell: { enabled: Boolean, message: String },
  invites:  { enabled: Boolean, channel: String },
  moderation: {
    autoMod: Boolean, antiSpam: Boolean, antiLinks: Boolean,
    antiInvites: Boolean, antiCaps: Boolean, badWords: [String],
  },
  antiRaid: { enabled: Boolean, threshold: { type: Number, default: 10 }, window: { type: Number, default: 10 }, action: { type: String, default: 'kick' }, alertChannel: String },
  antiNuke: { enabled: Boolean, threshold: { type: Number, default: 3 }, action: { type: String, default: 'ban' }, whitelist: [String] },
  tickets:  { enabled: Boolean, supportRole: String, counter: { type: Number, default: 0 }, maxOpen: { type: Number, default: 1 } },
  leveling: { enabled: Boolean, xpPerMsg: { type: Number, default: 15 }, cooldown: { type: Number, default: 60 }, noXpChannels: [String] },
  economy:  { enabled: Boolean, currencyName: { type: String, default: 'coins' }, dailyAmt: { type: Number, default: 100 } },
  logging:  { enabled: Boolean, msgDelete: Boolean, msgEdit: Boolean, memberJoin: Boolean, memberLeave: Boolean, memberBan: Boolean },
  prefix:   { type: String, default: '!' },
  updatedAt: { type: Date, default: Date.now },
});

// ── Tournament ────────────────────────────────────────────────
const TournamentSchema = new Schema({
  id:       { type: String, required: true, unique: true },
  guildId:  String,
  name:     String,
  game:     String,
  format:   { type: String, default: 'single_elimination' },
  maxTeams: { type: Number, default: 16 },
  teamSize: { type: Number, default: 1 },
  status:   { type: String, default: 'open' },
  prize:    String,
  hostId:   String,
  teams:    [{ teamId: String, name: String, captainId: String, members: [String], wins: Number, losses: Number, seed: Number }],
  announceChannelId: String,
  rules:    String,
  createdAt: { type: Date, default: Date.now },
});

// ── Ticket ────────────────────────────────────────────────────
const TicketSchema = new Schema({
  ticketId:  String,
  guildId:   String,
  channelId: String,
  userId:    String,
  type:      { type: String, default: 'general' },
  subject:   String,
  status:    { type: String, default: 'open' },
  claimedBy: String,
  priority:  { type: String, default: 'normal' },
  closedAt:  Date,
  closedBy:  String,
  reason:    String,
  createdAt: { type: Date, default: Date.now },
});

// ── Modlog ────────────────────────────────────────────────────
const ModlogSchema = new Schema({
  caseId:     Number,
  guildId:    String,
  type:       String,
  userId:     String,
  userTag:    String,
  modId:      String,
  modTag:     String,
  reason:     String,
  duration:   String,
  timestamp:  { type: Date, default: Date.now },
});

// ── Giveaway ──────────────────────────────────────────────────
const GiveawaySchema = new Schema({
  messageId: { type: String, unique: true },
  channelId: String,
  guildId:   String,
  hostId:    String,
  prize:     String,
  winners:   { type: Number, default: 1 },
  endAt:     Date,
  ended:     { type: Boolean, default: false },
  entries:   [String],
  winnerIds: [String],
  createdAt: { type: Date, default: Date.now },
});

// ── Reminder ──────────────────────────────────────────────────
const ReminderSchema = new Schema({
  userId:    String,
  channelId: String,
  guildId:   String,
  message:   String,
  triggerAt: Date,
  done:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = {
  User:       mongoose.model('User',       UserSchema),
  Guild:      mongoose.model('Guild',      GuildSchema),
  Tournament: mongoose.model('Tournament', TournamentSchema),
  Ticket:     mongoose.model('Ticket',     TicketSchema),
  Modlog:     mongoose.model('Modlog',     ModlogSchema),
  Giveaway:   mongoose.model('Giveaway',   GiveawaySchema),
  Reminder:   mongoose.model('Reminder',   ReminderSchema),
};

const {
  SlashCommandBuilder, PermissionFlagsBits, ChannelType,
  ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require("discord.js");
const E = require("../utils/embeds");
const { requirePerm } = require("../utils/helpers");
const { Ticket, Guild } = require("../models/index");

function buildPerms(guild, userId, supportRoles) {
  const perms = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
  ];
  for (const roleId of supportRoles) {
    if (roleId && guild.roles.cache.has(roleId)) {
      perms.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] });
    }
  }
  return perms;
}

async function isStaff(member, cfg) {
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  const roles = (cfg && cfg.tickets && cfg.tickets.supportRoles)
    ? cfg.tickets.supportRoles
    : (cfg && cfg.tickets && cfg.tickets.supportRole ? [cfg.tickets.supportRole] : []);
  return roles.some(r => member.roles.cache.has(r));
}

const TICKET_TYPES = [
  { name: "Game Support", value: "game", emoji: "🎮" },
  { name: "Tournament", value: "tournament", emoji: "🏆" },
  { name: "Premium", value: "premium", emoji: "💎" },
  { name: "Bug Report", value: "bug", emoji: "🐛" },
  { name: "General", value: "general", emoji: "💬" },
  { name: "Report User", value: "report", emoji: "🚨" },
  { name: "Matcherino", value: "matcherino", emoji: "🎲" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Support ticket system")
    .addSubcommand(s => s.setName("setup").setDescription("Setup tickets")
      .addRoleOption(o => o.setName("role1").setDescription("Support role").setRequired(true))
      .addRoleOption(o => o.setName("role2").setDescription("Support role 2"))
      .addRoleOption(o => o.setName("role3").setDescription("Support role 3"))
      .addRoleOption(o => o.setName("role4").setDescription("Support role 4"))
      .addRoleOption(o => o.setName("role5").setDescription("Support role 5"))
      .addChannelOption(o => o.setName("logs").setDescription("Log channel"))
      .addChannelOption(o => o.setName("cat").setDescription("Category"))
      .addIntegerOption(o => o.setName("max").setDescription("Max open").setMinValue(1).setMaxValue(5))
    )
    .addSubcommand(s => s.setName("type-roles").setDescription("Set roles per type")
      .addStringOption(o => o.setName("type").setDescription("Type").setRequired(true).addChoices(
        { name: "Game Support", value: "game" },
        { name: "Tournament", value: "tournament" },
        { name: "Premium", value: "premium" },
        { name: "Bug Report", value: "bug" },
        { name: "General", value: "general" },
        { name: "Report User", value: "report" },
        { name: "Matcherino", value: "matcherino" }
      ))
      .addRoleOption(o => o.setName("role1").setDescription("Support role").setRequired(true))
      .addRoleOption(o => o.setName("role2").setDescription("Support role 2"))
      .addRoleOption(o => o.setName("role3").setDescription("Support role 3"))
    )
    .addSubcommand(s => s.setName("addrole").setDescription("Add role")
      .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true))
    )
    .addSubcommand(s => s.setName("removerole").setDescription("Remove role")
      .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true))
    )
    .addSubcommand(s => s.setName("roles").setDescription("View roles"))
    .addSubcommand(s => s.setName("panel").setDescription("Post panel"))
    .addSubcommand(s => s.setName("create").setDescription("Create")
      .addStringOption(o => o.setName("type").setDescription("Type").setRequired(true).addChoices(
        { name: "Game", value: "game" },
        { name: "Tournament", value: "tournament" },
        { name: "Premium", value: "premium" },
        { name: "Bug", value: "bug" },
        { name: "General", value: "general" },
        { name: "Report", value: "report" },
        { name: "Matcherino", value: "matcherino" }
      ))
    )
    .addSubcommand(s => s.setName("close").setDescription("Close"))
    .addSubcommand(s => s.setName("claim").setDescription("Claim"))
    .addSubcommand(s => s.setName("unclaim").setDescription("Unclaim"))
    .addSubcommand(s => s.setName("add").setDescription("Add user")
      .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    )
    .addSubcommand(s => s.setName("remove").setDescription("Remove user")
      .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    )
    .addSubcommand(s => s.setName("rename").setDescription("Rename")
      .addStringOption(o => o.setName("name").setDescription("Name").setRequired(true))
    )
    .addSubcommand(s => s.setName("priority").setDescription("Priority")
      .addStringOption(o => o.setName("level").setDescription("Level").setRequired(true).addChoices(
        { name: "Low", value: "low" },
        { name: "Normal", value: "normal" },
        { name: "High", value: "high" },
        { name: "Critical", value: "critical" }
      ))
    )
    .addSubcommand(s => s.setName("transcript").setDescription("Transcript"))
    .addSubcommand(s => s.setName("list").setDescription("List"))
    .addSubcommand(s => s.setName("info").setDescription("Info")),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: sub !== "panel" });

    if (sub === "setup") {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
      const roles = [1, 2, 3, 4, 5].map(n => interaction.options.getRole("role" + n)?.id).filter(Boolean);
      const unique = [...new Set(roles)];
      const logCh = interaction.options.getChannel("logs");
      const cat = interaction.options.getChannel("cat");
      const max = interaction.options.getInteger("max") || 1;
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: { "tickets.enabled": true, "tickets.supportRoles": unique, "tickets.supportRole": unique[0], "tickets.maxOpen": max, "tickets.categoryId": cat?.id, "tickets.logChannel": logCh?.id, "tickets.typeRoles": {}, "channels.ticketLogs": logCh?.id } }, { upsert: true });
      const roleList = unique.map(r => "<@&" + r + ">").join("\n") || "None";
      await interaction.editReply({ embeds: [E.success("Setup", "", [{ name: "Roles", value: roleList, inline: false }, { name: "Log", value: logCh ? "<#" + logCh.id + ">" : "None", inline: true }, { name: "Max", value: String(max), inline: true }])] });
    }

    else if (sub === "type-roles") {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
      const type = interaction.options.getString("type");
      const roles = [1, 2, 3].map(n => interaction.options.getRole("role" + n)?.id).filter(Boolean);
      const unique = [...new Set(roles)];
      
      await Guild.findOneAndUpdate(
        { guildId: interaction.guildId },
        { $set: { ["tickets.typeRoles." + type]: unique } },
        { upsert: true }
      );
      
      const roleList = unique.map(r => "<@&" + r + ">").join("\n") || "None";
      await interaction.editReply({ embeds: [E.success("Type Roles Updated", `Type: **${type}**\n\n${roleList}`)] });
    }

    else if (sub === "addrole") {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
      const role = interaction.options.getRole("role");
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const current = (cfg?.tickets?.supportRoles?.length ? cfg.tickets.supportRoles : cfg?.tickets?.supportRole ? [cfg.tickets.supportRole] : []);
      if (current.includes(role.id)) return interaction.editReply({ embeds: [E.warn("Already", "Already added")] });
      if (current.length >= 10) return interaction.editReply({ embeds: [E.error("Max", "Max 10")] });
      const updated = [...current, role.id];
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: { "tickets.supportRoles": updated, "tickets.supportRole": updated[0] } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success("Added", updated.map(r => "<@&" + r + ">").join("\n"))] });
    }

    else if (sub === "removerole") {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
      const role = interaction.options.getRole("role");
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const current = cfg?.tickets?.supportRoles || [];
      if (!current.includes(role.id)) return interaction.editReply({ embeds: [E.warn("Not found", "Not a support role")] });
      const updated = current.filter(r => r !== role.id);
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: { "tickets.supportRoles": updated, "tickets.supportRole": updated[0] || null } }, { upsert: true });
      await interaction.editReply({ embeds: [E.success("Removed", updated.length ? updated.map(r => "<@&" + r + ">").join("\n") : "No roles")] });
    }

    else if (sub === "roles") {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const roles = cfg?.tickets?.supportRoles?.length ? cfg.tickets.supportRoles : cfg?.tickets?.supportRole ? [cfg.tickets.supportRole] : [];
      if (!roles.length) return interaction.editReply({ embeds: [E.info("No roles", "Run setup")] });
      const fields = roles.map((r, i) => ({ name: "Role #" + (i + 1), value: "<@&" + r + ">", inline: true }));
      await interaction.editReply({ embeds: [E.ticket("Roles (" + roles.length + ")", "", fields)] });
    }

    else if (sub === "panel") {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageGuild))) return;
      
      const embed = E.make(0x2F3136)
        .setTitle("🎫 Support Ticket System")
        .setDescription("Select a ticket type to open a support ticket!\n\nOur support team will respond as soon as possible.")
        .addFields(
          { name: "📋 Ticket Types", value: "🎮 Game Support\n🏆 Tournament\n💎 Premium\n🐛 Bug Report\n💬 General\n🚨 Report User\n🎲 Matcherino", inline: false },
          { name: "⚡ Quick Tips", value: "• Describe your issue clearly\n• One ticket at a time\n• Be patient for response", inline: false }
        )
        .setColor("#2F3136")
        .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
        .setFooter({ text: "DeS Bot™ • Support System", iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();
      
      const select = new StringSelectMenuBuilder()
        .setCustomId("ticket:select:type")
        .setPlaceholder("Select ticket type...")
        .addOptions(
          TICKET_TYPES.map(t => new StringSelectMenuOptionBuilder()
            .setLabel(t.name)
            .setValue(t.value)
            .setEmoji(t.emoji)
            .setDescription("Open a " + t.name.toLowerCase() + " ticket")
          )
        );
      
      const row = new ActionRowBuilder().addComponents(select);
      
      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.editReply({ embeds: [E.success("✅ Panel Posted", "Ticket support panel has been posted")] });
    }

    else if (sub === "create") {
      await interaction.deferReply({ flags: 64 });
      const type = interaction.options.getString("type");
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!cfg?.tickets?.enabled) return interaction.editReply({ embeds: [E.error("Not setup", "Run setup first")] });

      const existing = await Ticket.find({ userId: interaction.user.id, guildId: interaction.guildId, status: { $in: ["open", "claimed"] } });
      if (existing.length >= (cfg.tickets.maxOpen || 1)) return interaction.editReply({ embeds: [E.warn("Limit", "Too many open")] });

      // Use type-specific roles if they exist for this type, otherwise use default support roles
      let typeRoles = (cfg.tickets.typeRoles && cfg.tickets.typeRoles[type] && cfg.tickets.typeRoles[type].length > 0)
        ? cfg.tickets.typeRoles[type]
        : (cfg.tickets.supportRoles?.length ? cfg.tickets.supportRoles : cfg.tickets.supportRole ? [cfg.tickets.supportRole] : []);
      
      cfg.tickets.counter = (cfg.tickets.counter || 0) + 1;
      await cfg.save();

      const id = "ticket-" + String(cfg.tickets.counter).padStart(4, "0");
      const typeInfo = TICKET_TYPES.find(t => t.value === type) || TICKET_TYPES[4];
      const ch = await interaction.guild.channels.create({ name: id, type: ChannelType.GuildText, parent: cfg.tickets.categoryId || null, permissionOverwrites: buildPerms(interaction.guild, interaction.user.id, typeRoles), topic: typeInfo.name });
      await Ticket.create({ ticketId: id, guildId: interaction.guildId, channelId: ch.id, userId: interaction.user.id, type, subject: typeInfo.name, status: "open" });

      const embed = E.ticket(typeInfo.emoji + " " + typeInfo.name, "Welcome <@" + interaction.user.id + ">!", [{ name: "ID", value: id, inline: true }, { name: "Type", value: type, inline: true }]);
      const btns = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket:claim:" + id).setLabel("Claim").setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId("ticket:close:" + id).setLabel("Close").setStyle(ButtonStyle.Danger));
      await ch.send({ content: ["<@" + interaction.user.id + ">", ...typeRoles.map(r => "<@&" + r + ">")].join(" "), embeds: [embed], components: [btns] });
      await interaction.editReply({ embeds: [E.success("Created", "<#" + ch.id + ">")] });
    }

    else if (sub === "close") {
      await interaction.deferReply();
      const t = await Ticket.findOne({ channelId: interaction.channelId, status: { $in: ["open", "claimed"] } });
      if (!t) return interaction.editReply({ embeds: [E.error("Not ticket", "Wrong channel")] });
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (t.userId !== interaction.user.id && !(await isStaff(interaction.member, cfg))) return interaction.editReply({ embeds: [E.error("No perm", "Can't close")] });
      t.status = "closed";
      t.closedAt = new Date();
      t.closedBy = interaction.user.id;
      await t.save();
      await interaction.editReply({ embeds: [E.ticket("Closing", "Deleting in 5s")] });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    else if (sub === "claim") {
      await interaction.deferReply();
      const t = await Ticket.findOne({ channelId: interaction.channelId });
      if (!t) return interaction.editReply({ embeds: [E.error("Not ticket", "Wrong channel")] });
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!(await isStaff(interaction.member, cfg))) return interaction.editReply({ embeds: [E.error("Staff only", "No perm")] });
      if (t.claimedBy) return interaction.editReply({ embeds: [E.warn("Claimed", "Already claimed")] });
      t.claimedBy = interaction.user.id;
      t.status = "claimed";
      await t.save();
      await interaction.editReply({ embeds: [E.ticket("Claimed", "<@" + interaction.user.id + "> claimed")] });
    }

    else if (sub === "unclaim") {
      await interaction.deferReply();
      const t = await Ticket.findOne({ channelId: interaction.channelId });
      if (!t) return interaction.editReply({ embeds: [E.error("Not ticket", "Wrong channel")] });
      if (t.claimedBy !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.editReply({ embeds: [E.error("No perm", "Can't unclaim")] });
      t.claimedBy = null;
      t.status = "open";
      await t.save();
      await interaction.editReply({ embeds: [E.ticket("Unclaimed", "Available")] });
    }

    else if (sub === "add") {
      await interaction.deferReply();
      const user = interaction.options.getUser("user");
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true });
      await interaction.editReply({ embeds: [E.ticket("Added", "<@" + user.id + "> added")] });
    }

    else if (sub === "remove") {
      await interaction.deferReply();
      const user = interaction.options.getUser("user");
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
      await interaction.editReply({ embeds: [E.ticket("Removed", "<@" + user.id + "> removed")] });
    }

    else if (sub === "rename") {
      await interaction.deferReply();
      const name = interaction.options.getString("name").toLowerCase().slice(0, 100);
      await interaction.channel.setName(name);
      await interaction.editReply({ embeds: [E.ticket("Renamed", name)] });
    }

    else if (sub === "priority") {
      await interaction.deferReply();
      const level = interaction.options.getString("level");
      const t = await Ticket.findOne({ channelId: interaction.channelId });
      if (!t) return interaction.editReply({ embeds: [E.error("Not ticket", "Wrong channel")] });
      t.priority = level;
      await t.save();
      await interaction.editReply({ embeds: [E.ticket("Priority", level)] });
    }

    else if (sub === "transcript") {
      await interaction.deferReply();
      const msgs = await interaction.channel.messages.fetch({ limit: 100 });
      const text = Array.from(msgs.values()).reverse().map(m => "[" + new Date(m.createdTimestamp).toISOString() + "] " + m.author.tag + ": " + (m.content || "[Embed]")).join("\n");
      const att = new AttachmentBuilder(Buffer.from(text, "utf-8"), { name: "transcript.txt" });
      await interaction.editReply({ embeds: [E.ticket("Saved", msgs.size + " messages")], files: [att] });
    }

    else if (sub === "list") {
      if (!(await requirePerm(interaction, PermissionFlagsBits.ManageChannels))) return;
      await interaction.deferReply({ flags: 64 });
      const tickets = await Ticket.find({ guildId: interaction.guildId, status: { $in: ["open", "claimed"] } }).sort({ createdAt: -1 });
      if (!tickets.length) return interaction.editReply({ embeds: [E.info("None", "No open tickets")] });
      const fields = tickets.slice(0, 10).map(t => ({ name: t.ticketId + " - " + t.type, value: "<@" + t.userId + "> | " + (t.claimedBy ? "Claimed" : "Open"), inline: false }));
      await interaction.editReply({ embeds: [E.ticket("Tickets (" + tickets.length + ")", "", fields)] });
    }

    else if (sub === "info") {
      await interaction.deferReply({ flags: 64 });
      const t = await Ticket.findOne({ channelId: interaction.channelId });
      if (!t) return interaction.editReply({ embeds: [E.error("Not ticket", "Wrong channel")] });
      await interaction.editReply({ embeds: [E.ticket("Info: " + t.ticketId, t.subject, [{ name: "Status", value: t.status, inline: true }, { name: "Type", value: t.type, inline: true }, { name: "Priority", value: t.priority || "normal", inline: true }])] });
    }
  },

  async handleButton(interaction, client) {
    const [cmd, action, data] = interaction.customId.split(":");
    if (cmd !== "ticket") return false;

    try {
      if (action === "claim") {
        const ticketId = data;
        const t = await Ticket.findOne({ ticketId, status: { $in: ["open", "claimed"] } });
        if (!t) return interaction.followUp({ embeds: [E.error("Not found", "Ticket not found")], ephemeral: true });
        
        const cfg = await Guild.findOne({ guildId: interaction.guildId });
        if (!(await isStaff(interaction.member, cfg))) return interaction.followUp({ embeds: [E.error("Staff only", "No perm")], ephemeral: true });
        if (t.claimedBy) return interaction.followUp({ embeds: [E.warn("Claimed", "Already claimed")], ephemeral: true });
        
        t.claimedBy = interaction.user.id;
        t.status = "claimed";
        await t.save();
        await interaction.followUp({ embeds: [E.ticket("Claimed", "<@" + interaction.user.id + "> claimed this ticket")], ephemeral: true });
        return true;
      }
      
      else if (action === "close") {
        const ticketId = data;
        const t = await Ticket.findOne({ ticketId, status: { $in: ["open", "claimed"] } });
        if (!t) return interaction.followUp({ embeds: [E.error("Not found", "Ticket not found")], ephemeral: true });
        
        const cfg = await Guild.findOne({ guildId: interaction.guildId });
        if (t.userId !== interaction.user.id && !(await isStaff(interaction.member, cfg))) return interaction.followUp({ embeds: [E.error("No perm", "Can't close")], ephemeral: true });
        
        t.status = "closed";
        t.closedAt = new Date();
        t.closedBy = interaction.user.id;
        await t.save();
        await interaction.followUp({ embeds: [E.ticket("Closing", "Ticket will be deleted in 5s")], ephemeral: true });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        return true;
      }
    } catch (error) {
      console.error("Button error:", error);
      await interaction.followUp({ embeds: [E.error("Error", error.message)], ephemeral: true }).catch(() => {});
    }

    return false;
  },

  async handleSelectMenu(interaction, client) {
    const [cmd, action, data] = interaction.customId.split(":");
    if (cmd !== "ticket" || action !== "select") return false;

    try {
      const type = interaction.values[0];

      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!cfg?.tickets?.enabled) return interaction.followUp({ embeds: [E.error("Not setup", "Run setup first")], ephemeral: true });

      const existing = await Ticket.find({ userId: interaction.user.id, guildId: interaction.guildId, status: { $in: ["open", "claimed"] } });
      if (existing.length >= (cfg.tickets.maxOpen || 1)) return interaction.followUp({ embeds: [E.warn("Limit", "Too many open")], ephemeral: true });

      // Use type-specific roles if they exist for this type, otherwise use default support roles
      let typeRoles = (cfg.tickets.typeRoles && cfg.tickets.typeRoles[type] && cfg.tickets.typeRoles[type].length > 0)
        ? cfg.tickets.typeRoles[type]
        : (cfg.tickets.supportRoles?.length ? cfg.tickets.supportRoles : cfg.tickets.supportRole ? [cfg.tickets.supportRole] : []);
      cfg.tickets.counter = (cfg.tickets.counter || 0) + 1;
      await cfg.save();

      const id = "ticket-" + String(cfg.tickets.counter).padStart(4, "0");
      const typeInfo = TICKET_TYPES.find(t => t.value === type) || TICKET_TYPES[4];
      const ch = await interaction.guild.channels.create({ name: id, type: ChannelType.GuildText, parent: cfg.tickets.categoryId || null, permissionOverwrites: buildPerms(interaction.guild, interaction.user.id, typeRoles), topic: typeInfo.name });
      await Ticket.create({ ticketId: id, guildId: interaction.guildId, channelId: ch.id, userId: interaction.user.id, type, subject: typeInfo.name, status: "open" });

      const embed = E.ticket(typeInfo.emoji + " " + typeInfo.name, "Welcome <@" + interaction.user.id + ">!", [{ name: "ID", value: id, inline: true }, { name: "Type", value: type, inline: true }]);
      const btns = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket:claim:" + id).setLabel("Claim").setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId("ticket:close:" + id).setLabel("Close").setStyle(ButtonStyle.Danger));
      await ch.send({ content: ["<@" + interaction.user.id + ">", ...typeRoles.map(r => "<@&" + r + ">")].join(" "), embeds: [embed], components: [btns] });
      await interaction.followUp({ embeds: [E.success("Created", "<#" + ch.id + ">")], ephemeral: true });
      return true;
    } catch (error) {
      console.error("Select menu error:", error);
      await interaction.followUp({ embeds: [E.error("Error", error.message)], ephemeral: true }).catch(() => {});
    }

    return false;
  }
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { requirePerm } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role').setDescription('🎭 Role management')
    .addSubcommand(s => s.setName('add').setDescription('Add a role to a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a role from a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('create').setDescription('Create a new role')
      .addStringOption(o => o.setName('name').setDescription('Role name').setRequired(true))
      .addStringOption(o => o.setName('color').setDescription('Hex color e.g. #FF5500'))
      .addBooleanOption(o => o.setName('hoist').setDescription('Show separately in member list'))
      .addBooleanOption(o => o.setName('mentionable').setDescription('Allow mentioning')))
    .addSubcommand(s => s.setName('delete').setDescription('Delete a role')
      .addRoleOption(o => o.setName('role').setDescription('Role to delete').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('color').setDescription('Change a role\'s color')
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
      .addStringOption(o => o.setName('color').setDescription('Hex color e.g. #FF5500').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('List all server roles'))
    .addSubcommand(s => s.setName('members').setDescription('List members with a role')
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))),

  async execute(interaction) {
    if (!(await requirePerm(interaction, PermissionFlagsBits.ManageRoles))) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'add') {
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const reason = interaction.options.getString('reason') || 'No reason';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.editReply({ embeds: [E.error('Not Found', 'Member not found.')] });
      if (role.position >= interaction.guild.members.me.roles.highest.position)
        return interaction.editReply({ embeds: [E.error('Hierarchy Error', 'I cannot assign a role higher than my highest role.')] });
      await member.roles.add(role.id, reason);
      await interaction.editReply({ embeds: [E.success('Role Added', `<@&${role.id}> added to <@${user.id}>.`, [{ name: '📋 Reason', value: reason, inline: false }])] });
    }

    else if (sub === 'remove') {
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const reason = interaction.options.getString('reason') || 'No reason';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.editReply({ embeds: [E.error('Not Found', 'Member not found.')] });
      await member.roles.remove(role.id, reason);
      await interaction.editReply({ embeds: [E.success('Role Removed', `<@&${role.id}> removed from <@${user.id}>.`, [{ name: '📋 Reason', value: reason, inline: false }])] });
    }

    else if (sub === 'create') {
      const name = interaction.options.getString('name');
      const color = interaction.options.getString('color') || null;
      const hoist = interaction.options.getBoolean('hoist') ?? false;
      const mentionable = interaction.options.getBoolean('mentionable') ?? false;
      const role = await interaction.guild.roles.create({ name, color: color || undefined, hoist, mentionable, reason: `Created by ${interaction.user.tag}` });
      await interaction.editReply({ embeds: [E.success('Role Created', `<@&${role.id}> has been created.`, [
        { name: '🎨 Color', value: color || 'Default', inline: true },
        { name: '📌 Hoisted', value: hoist ? 'Yes' : 'No', inline: true },
        { name: '🔔 Mentionable', value: mentionable ? 'Yes' : 'No', inline: true },
      ])] });
    }

    else if (sub === 'delete') {
      const role = interaction.options.getRole('role');
      const reason = interaction.options.getString('reason') || 'No reason';
      if (role.position >= interaction.guild.members.me.roles.highest.position)
        return interaction.editReply({ embeds: [E.error('Hierarchy Error', 'Cannot delete a role higher than my highest role.')] });
      await role.delete(reason);
      await interaction.editReply({ embeds: [E.success('Role Deleted', `Role **${role.name}** has been deleted.`)] });
    }

    else if (sub === 'color') {
      const role = interaction.options.getRole('role');
      const color = interaction.options.getString('color');
      await role.setColor(color, `Color changed by ${interaction.user.tag}`);
      await interaction.editReply({ embeds: [E.make(parseInt(color.replace('#', ''), 16)).setTitle('🎨  Role Color Updated').setDescription(`<@&${role.id}> color set to **${color}**.`).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    }

    else if (sub === 'list') {
      const roles = [...interaction.guild.roles.cache.values()].filter(r => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);
      const list = roles.slice(0, 30).map(r => `<@&${r.id}>`).join(' ');
      await interaction.editReply({ embeds: [E.info(`Roles (${roles.length})`, list || 'No roles.')] });
    }

    else if (sub === 'members') {
      const role = interaction.options.getRole('role');
      const members = role.members;
      const list = [...members.values()].slice(0, 20).map(m => `<@${m.id}>`).join(' ');
      await interaction.editReply({ embeds: [E.info(`Members with ${role.name} (${members.size})`, list || 'No members.')] });
    }
  }
};

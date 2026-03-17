const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { Tournament } = require('../models/index');
const crypto = require('crypto');
const genId = () => crypto.randomBytes(4).toString('hex');

const fmtNames = { single_elimination: 'Single Elimination', double_elimination: 'Double Elimination', round_robin: 'Round Robin', swiss: 'Swiss' };
const statusEmoji = { open: '🟢', ongoing: '🔴', completed: '✅', cancelled: '⛔', closed: '🔒' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tournament').setDescription('🏆 Tournament management')
    .addSubcommand(s => s.setName('create').setDescription('Create a new tournament')
      .addStringOption(o => o.setName('name').setDescription('Tournament name').setRequired(true))
      .addStringOption(o => o.setName('game').setDescription('Game').setRequired(true))
      .addIntegerOption(o => o.setName('max-teams').setDescription('Max teams').setMinValue(2).setMaxValue(256))
      .addIntegerOption(o => o.setName('team-size').setDescription('Players per team').setMinValue(1).setMaxValue(10))
      .addStringOption(o => o.setName('format').setDescription('Format').addChoices(
        { name: 'Single Elimination', value: 'single_elimination' },
        { name: 'Double Elimination', value: 'double_elimination' },
        { name: 'Round Robin', value: 'round_robin' },
        { name: 'Swiss', value: 'swiss' }))
      .addStringOption(o => o.setName('prize').setDescription('Prize pool'))
      .addStringOption(o => o.setName('rules').setDescription('Tournament rules')))
    .addSubcommand(s => s.setName('list').setDescription('List tournaments')
      .addStringOption(o => o.setName('status').setDescription('Filter').addChoices(
        { name: '🟢 Open', value: 'open' }, { name: '🔴 Ongoing', value: 'ongoing' }, { name: '✅ Completed', value: 'completed' })))
    .addSubcommand(s => s.setName('info').setDescription('View tournament info')
      .addStringOption(o => o.setName('id').setDescription('Tournament ID').setRequired(true)))
    .addSubcommand(s => s.setName('join').setDescription('Register for a tournament')
      .addStringOption(o => o.setName('id').setDescription('Tournament ID').setRequired(true))
      .addStringOption(o => o.setName('team-name').setDescription('Team name')))
    .addSubcommand(s => s.setName('leave').setDescription('Leave a tournament')
      .addStringOption(o => o.setName('id').setDescription('Tournament ID').setRequired(true)))
    .addSubcommand(s => s.setName('start').setDescription('Start a tournament (host)')
      .addStringOption(o => o.setName('id').setDescription('Tournament ID').setRequired(true)))
    .addSubcommand(s => s.setName('end').setDescription('End / complete a tournament (host)')
      .addStringOption(o => o.setName('id').setDescription('Tournament ID').setRequired(true))
      .addStringOption(o => o.setName('winner-team').setDescription('Winning team name')))
    .addSubcommand(s => s.setName('cancel').setDescription('Cancel a tournament (host/admin)')
      .addStringOption(o => o.setName('id').setDescription('Tournament ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('teams').setDescription('List registered teams')
      .addStringOption(o => o.setName('id').setDescription('Tournament ID').setRequired(true))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'create') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({ embeds: [E.error('Permission Denied', 'You need `Manage Server`.')] });
      }
      const id = genId();
      const name = interaction.options.getString('name');
      const game = interaction.options.getString('game');
      const maxTeams = interaction.options.getInteger('max-teams') || 16;
      const teamSize = interaction.options.getInteger('team-size') || 1;
      const format = interaction.options.getString('format') || 'single_elimination';
      const prize = interaction.options.getString('prize') || 'No prize specified';
      const rules = interaction.options.getString('rules') || 'Standard rules apply.';
      await Tournament.create({ id, guildId: interaction.guildId, name, game, maxTeams, teamSize, format, prize, rules, hostId: interaction.user.id });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`t_join_${id}`).setLabel('Register').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`t_info_${id}`).setLabel('Details').setStyle(ButtonStyle.Secondary).setEmoji('ℹ️')
      );
      await interaction.editReply({
        embeds: [E.tourney(`Tournament Created: ${name}`, `**Game:** ${game}\n**Rules:** ${rules}`, [
          { name: '🏷️ ID', value: `\`${id}\``, inline: true },
          { name: '📋 Format', value: fmtNames[format], inline: true },
          { name: '👥 Max Teams', value: `${maxTeams}`, inline: true },
          { name: '⚔️ Team Size', value: `${teamSize}v${teamSize}`, inline: true },
          { name: '🏆 Prize', value: prize, inline: true },
          { name: '🎤 Host', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📊 Status', value: '🟢 Open for Registration', inline: true },
        ])],
        components: [row],
      });
    }

    else if (sub === 'list') {
      const status = interaction.options.getString('status');
      const q = { guildId: interaction.guildId };
      if (status) q.status = status;
      const list = await Tournament.find(q).sort({ createdAt: -1 }).limit(12);
      if (!list.length) return interaction.editReply({ embeds: [E.info('No Tournaments', 'No tournaments found.')] });
      const fields = list.map(t => ({ name: `${statusEmoji[t.status] || '⚪'} ${t.name}  —  \`${t.id}\``, value: `🎮 ${t.game}  •  👥 ${t.teams.length}/${t.maxTeams}  •  📋 ${fmtNames[t.format] || t.format}`, inline: false }));
      await interaction.editReply({ embeds: [E.tourney('Server Tournaments', `${list.length} tournament(s)`, fields)] });
    }

    else if (sub === 'info') {
      const id = interaction.options.getString('id');
      const t = await Tournament.findOne({ id, guildId: interaction.guildId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not Found', `No tournament with ID \`${id}\`.`)] });
      await interaction.editReply({ embeds: [E.tourney(`Tournament: ${t.name}`, t.rules || '', [
        { name: '🏷️ ID', value: `\`${t.id}\``, inline: true },
        { name: '🎮 Game', value: t.game, inline: true },
        { name: '📊 Status', value: `${statusEmoji[t.status] || '⚪'} ${t.status}`, inline: true },
        { name: '👥 Teams', value: `${t.teams.length}/${t.maxTeams}`, inline: true },
        { name: '⚔️ Size', value: `${t.teamSize}v${t.teamSize}`, inline: true },
        { name: '🏆 Prize', value: t.prize || 'None', inline: true },
        { name: '🎤 Host', value: `<@${t.hostId}>`, inline: true },
        { name: '📋 Format', value: fmtNames[t.format] || t.format, inline: true },
      ])] });
    }

    else if (sub === 'join') {
      const id = interaction.options.getString('id');
      const tName = interaction.options.getString('team-name') || `${interaction.user.username}'s Team`;
      const t = await Tournament.findOne({ id, guildId: interaction.guildId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not Found', `Tournament \`${id}\` not found.`)] });
      if (t.status !== 'open') return interaction.editReply({ embeds: [E.error('Closed', 'Registration is closed.')] });
      if (t.teams.length >= t.maxTeams) return interaction.editReply({ embeds: [E.error('Full', 'Tournament is full.')] });
      if (t.teams.some(tm => tm.captainId === interaction.user.id || tm.members.includes(interaction.user.id)))
        return interaction.editReply({ embeds: [E.warn('Already Registered', 'You are already in this tournament.')] });
      const teamId = genId();
      t.teams.push({ teamId, name: tName, captainId: interaction.user.id, members: [interaction.user.id] });
      await t.save();
      await interaction.editReply({ embeds: [E.success('Registered!', `You joined **${t.name}**`, [
        { name: '🏷️ Team', value: tName, inline: true },
        { name: '🔑 Team ID', value: `\`${teamId}\``, inline: true },
        { name: '👥 Total', value: `${t.teams.length}/${t.maxTeams}`, inline: true },
      ])] });
    }

    else if (sub === 'leave') {
      const id = interaction.options.getString('id');
      const t = await Tournament.findOne({ id, guildId: interaction.guildId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not Found', `Tournament \`${id}\` not found.`)] });
      if (t.status !== 'open') return interaction.editReply({ embeds: [E.error('Cannot Leave', 'Tournament has already started.')] });
      const idx = t.teams.findIndex(tm => tm.captainId === interaction.user.id);
      if (idx === -1) return interaction.editReply({ embeds: [E.error('Not Registered', 'You are not in this tournament.')] });
      t.teams.splice(idx, 1);
      await t.save();
      await interaction.editReply({ embeds: [E.success('Left Tournament', `You left **${t.name}**.`)] });
    }

    else if (sub === 'start') {
      const id = interaction.options.getString('id');
      const t = await Tournament.findOne({ id, guildId: interaction.guildId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not Found', `Tournament \`${id}\` not found.`)] });
      if (t.hostId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ embeds: [E.error('No Permission', 'Only the host or admins can start this.')] });
      if (t.status !== 'open') return interaction.editReply({ embeds: [E.error('Invalid State', 'Tournament is not open.')] });
      if (t.teams.length < 2) return interaction.editReply({ embeds: [E.error('Not Enough Teams', 'Need at least 2 teams to start.')] });
      t.status = 'ongoing';
      await t.save();
      await interaction.editReply({ embeds: [E.tourney(`🎮 Tournament Started: ${t.name}`, `The battle begins with **${t.teams.length}** teams! Good luck to all! 🏆`)] });
    }

    else if (sub === 'end') {
      const id = interaction.options.getString('id');
      const winner = interaction.options.getString('winner-team');
      const t = await Tournament.findOne({ id, guildId: interaction.guildId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not Found', `Tournament \`${id}\` not found.`)] });
      if (t.hostId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ embeds: [E.error('No Permission', 'Only the host or admins can end this.')] });
      t.status = 'completed';
      await t.save();
      await interaction.editReply({ embeds: [E.tourney(`🏆 Tournament Complete: ${t.name}`, winner ? `🥇 **Winner: ${winner}** 🥇\n\nCongratulations to all participants!` : 'Tournament completed!')] });
    }

    else if (sub === 'cancel') {
      const id = interaction.options.getString('id');
      const reason = interaction.options.getString('reason') || 'No reason';
      const t = await Tournament.findOne({ id, guildId: interaction.guildId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not Found', `Tournament \`${id}\` not found.`)] });
      if (t.hostId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ embeds: [E.error('No Permission', 'Only the host or admins can cancel.')] });
      t.status = 'cancelled';
      await t.save();
      await interaction.editReply({ embeds: [E.error(`Tournament Cancelled: ${t.name}`, `**Reason:** ${reason}`)] });
    }

    else if (sub === 'teams') {
      const id = interaction.options.getString('id');
      const t = await Tournament.findOne({ id, guildId: interaction.guildId });
      if (!t) return interaction.editReply({ embeds: [E.error('Not Found', `Tournament \`${id}\` not found.`)] });
      const list = t.teams.map((tm, i) => `**${i + 1}.** ${tm.name}  —  Captain: <@${tm.captainId}>`).join('\n') || '*No teams registered.*';
      await interaction.editReply({ embeds: [E.tourney(`Teams: ${t.name}`, list, [{ name: '📊 Count', value: `${t.teams.length}/${t.maxTeams}`, inline: true }])] });
    }
  }
};

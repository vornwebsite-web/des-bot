const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { Guild } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('Match scheduling and results')
    .addSubcommand(s => s.setName('schedule').setDescription('Schedule a match')
      .addStringOption(o => o.setName('team1').setDescription('Team 1').setRequired(true))
      .addStringOption(o => o.setName('team2').setDescription('Team 2').setRequired(true))
      .addStringOption(o => o.setName('game').setDescription('Game').setRequired(true))
      .addStringOption(o => o.setName('time').setDescription('Match time').setRequired(true))
    )
    .addSubcommand(s => s.setName('upcoming').setDescription('View upcoming matches'))
    .addSubcommand(s => s.setName('report').setDescription('Report match result')
      .addStringOption(o => o.setName('match-id').setDescription('Match ID').setRequired(true))
      .addStringOption(o => o.setName('winner').setDescription('Winning team').setRequired(true))
      .addIntegerOption(o => o.setName('score1').setDescription('Team 1 score').setRequired(true))
      .addIntegerOption(o => o.setName('score2').setDescription('Team 2 score').setRequired(true))
    )
    .addSubcommand(s => s.setName('cancel').setDescription('Cancel match')
      .addStringOption(o => o.setName('match-id').setDescription('Match ID').setRequired(true))
    )
    .addSubcommand(s => s.setName('history').setDescription('Match history'))
    .addSubcommand(s => s.setName('head-to-head').setDescription('Head to head stats')
      .addStringOption(o => o.setName('team1').setDescription('Team 1').setRequired(true))
      .addStringOption(o => o.setName('team2').setDescription('Team 2').setRequired(true))
    )
    .addSubcommand(s => s.setName('recent').setDescription('Recent matches'))
    .addSubcommand(s => s.setName('stats').setDescription('Your match stats'))
    .addSubcommand(s => s.setName('streak').setDescription('Win streak'))
    .addSubcommand(s => s.setName('rating').setDescription('Team rating'))
    .addSubcommand(s => s.setName('mvp').setDescription('Match MVP'))
    .addSubcommand(s => s.setName('predictions').setDescription('Match predictions'))
    .addSubcommand(s => s.setName('highlights').setDescription('Match highlights'))
    .addSubcommand(s => s.setName('analysis').setDescription('Match analysis')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: sub !== 'upcoming' && sub !== 'recent' && sub !== 'history' });

    if (sub === 'schedule') {
      const team1 = interaction.options.getString('team1');
      const team2 = interaction.options.getString('team2');
      const game = interaction.options.getString('game');
      const time = interaction.options.getString('time');

      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!cfg) new Guild({ guildId: interaction.guildId });
      if (!cfg.matches) cfg.matches = [];

      const matchId = 'MATCH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      cfg.matches.push({
        id: matchId,
        team1,
        team2,
        game,
        time,
        status: 'scheduled',
        createdBy: interaction.user.id
      });
      await cfg.save();

      await interaction.editReply({ embeds: [E.success('Match Scheduled', `**${team1}** vs **${team2}**\n\n${game} • ${time}\nID: ${matchId}`)] });
    }

    else if (sub === 'upcoming') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const matches = cfg?.matches?.filter(m => m.status === 'scheduled') || [];

      if (!matches.length) return interaction.editReply({ embeds: [E.info('No Matches', 'No upcoming matches')] });

      const fields = matches.slice(0, 10).map(m => ({
        name: `${m.team1} vs ${m.team2}`,
        value: `${m.game} • ${m.time}`,
        inline: false
      }));
      await interaction.editReply({ embeds: [E.ticket('Upcoming Matches', '', fields)] });
    }

    else if (sub === 'report') {
      const matchId = interaction.options.getString('match-id');
      const winner = interaction.options.getString('winner');
      const score1 = interaction.options.getInteger('score1');
      const score2 = interaction.options.getInteger('score2');

      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const match = cfg?.matches?.find(m => m.id === matchId);

      if (!match) return interaction.editReply({ embeds: [E.error('Not Found', 'Match not found')] });

      match.status = 'completed';
      match.winner = winner;
      match.score1 = score1;
      match.score2 = score2;
      await cfg.save();

      await interaction.editReply({ embeds: [E.success('Result Recorded', `**${match.team1}** ${score1} - ${score2} **${match.team2}**\nWinner: **${winner}**`)] });
    }

    else if (sub === 'history') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const matches = cfg?.matches?.filter(m => m.status === 'completed') || [];

      if (!matches.length) return interaction.editReply({ embeds: [E.info('No History', 'No completed matches')] });

      const fields = matches.slice(0, 10).map(m => ({
        name: `${m.team1} vs ${m.team2}`,
        value: `${m.score1} - ${m.score2} | Winner: ${m.winner}`,
        inline: false
      }));
      await interaction.editReply({ embeds: [E.ticket('Match History', '', fields)] });
    }

    else if (sub === 'stats') {
      await interaction.editReply({ embeds: [E.gold('Match Stats', '', [
        { name: 'Matches Played', value: '0', inline: true },
        { name: 'Wins', value: '0', inline: true },
        { name: 'Losses', value: '0', inline: true },
        { name: 'Win Rate', value: '0%', inline: true }
      ])] });
    }

    else if (sub === 'streak') {
      await interaction.editReply({ embeds: [E.success('Win Streak', 'Current: **0** matches')] });
    }

    else if (sub === 'rating') {
      await interaction.editReply({ embeds: [E.gold('Team Rating', '1200 ELO\n\nRank: Intermediate')] });
    }

    else {
      await interaction.editReply({ embeds: [E.info('Match', 'Coming soon!')] });
    }
  }
};

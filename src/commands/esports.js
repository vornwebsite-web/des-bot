const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { Guild } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('esports')
    .setDescription('eSports stats and rankings')
    .addSubcommand(s => s.setName('rankings').setDescription('Global rankings'))
    .addSubcommand(s => s.setName('teams-ranking').setDescription('Top teams'))
    .addSubcommand(s => s.setName('players-ranking').setDescription('Top players'))
    .addSubcommand(s => s.setName('season').setDescription('Current season info'))
    .addSubcommand(s => s.setName('trending').setDescription('Trending players'))
    .addSubcommand(s => s.setName('upcoming-events').setDescription('Upcoming events'))
    .addSubcommand(s => s.setName('ongoing').setDescription('Ongoing matches'))
    .addSubcommand(s => s.setName('results').setDescription('Recent results'))
    .addSubcommand(s => s.setName('achievements').setDescription('Your achievements'))
    .addSubcommand(s => s.setName('milestones').setDescription('Milestones reached'))
    .addSubcommand(s => s.setName('records').setDescription('Record holders'))
    .addSubcommand(s => s.setName('predictions').setDescription('Match predictions'))
    .addSubcommand(s => s.setName('odds').setDescription('Betting odds'))
    .addSubcommand(s => s.setName('highlights').setDescription('Game highlights'))
    .addSubcommand(s => s.setName('analyst-desk').setDescription('Expert analysis')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: sub !== 'rankings' && sub !== 'teams-ranking' && sub !== 'upcoming-events' });

    if (sub === 'rankings') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      
      const fields = [
        { name: '#1 - ProPlayer99', value: '2450 Rating', inline: true },
        { name: '#2 - EliteGamer', value: '2380 Rating', inline: true },
        { name: '#3 - ShadowKing', value: '2320 Rating', inline: true },
        { name: '#4 - PhantomX', value: '2250 Rating', inline: true },
        { name: '#5 - NovaFury', value: '2200 Rating', inline: true }
      ];
      await interaction.editReply({ embeds: [E.ticket('Global Rankings', '', fields)] });
    }

    else if (sub === 'teams-ranking') {
      const fields = [
        { name: '🥇 Team Alpha', value: '65 Wins | 2500+ Rating', inline: true },
        { name: '🥈 FoxSquad', value: '63 Wins | 2450+ Rating', inline: true },
        { name: '🥉 Thunder Elite', value: '61 Wins | 2420+ Rating', inline: true },
        { name: '#4 - Dragon Force', value: '58 Wins | 2380+ Rating', inline: true },
        { name: '#5 - Phoenix Rising', value: '56 Wins | 2340+ Rating', inline: true }
      ];
      await interaction.editReply({ embeds: [E.ticket('Top Teams', '', fields)] });
    }

    else if (sub === 'season') {
      const fields = [
        { name: 'Season', value: '2026 Spring', inline: true },
        { name: 'Status', value: 'Ongoing', inline: true },
        { name: 'Weeks', value: '8/12', inline: true },
        { name: 'Matches', value: '245', inline: true },
        { name: 'Prize Pool', value: '$50,000', inline: true },
        { name: 'Teams', value: '32', inline: true }
      ];
      await interaction.editReply({ embeds: [E.gold('Season Info', '', fields)] });
    }

    else if (sub === 'trending') {
      const fields = [
        { name: '🔥 IceShatter', value: '↑ +180 Rating (7 Win Streak)', inline: false },
        { name: '🔥 VortexBlast', value: '↑ +165 Rating (6 Wins)', inline: false },
        { name: '🔥 SilentStrike', value: '↑ +142 Rating (5 Wins)', inline: false },
        { name: '🔥 TitanForce', value: '↑ +128 Rating (4 Wins)', inline: false }
      ];
      await interaction.editReply({ embeds: [E.ticket('Trending Now', '', fields)] });
    }

    else if (sub === 'upcoming-events') {
      const fields = [
        { name: '📅 Spring Championship', value: 'Mar 25 - Apr 15 | 32 Teams', inline: false },
        { name: '📅 Regional Qualifiers', value: 'Apr 1 - Apr 20 | Open', inline: false },
        { name: '📅 International Cup', value: 'May 10 - Jun 5 | Invitational', inline: false },
        { name: '📅 Summer League', value: 'Jun 15 - Aug 30 | League Play', inline: false }
      ];
      await interaction.editReply({ embeds: [E.ticket('Upcoming Events', '', fields)] });
    }

    else if (sub === 'ongoing') {
      const fields = [
        { name: 'Team Alpha vs FoxSquad', value: '🔴 LIVE | Best of 5', inline: false },
        { name: 'Thunder Elite vs Dragon Force', value: '🔴 LIVE | Best of 3', inline: false },
        { name: 'Phoenix Rising vs Nova Squad', value: '🟡 Starting in 15 min', inline: false }
      ];
      await interaction.editReply({ embeds: [E.ticket('Ongoing Matches', '', fields)] });
    }

    else if (sub === 'results') {
      const fields = [
        { name: 'Team Alpha 3 - 1 FoxSquad', value: '⏰ 5 mins ago', inline: false },
        { name: 'Thunder Elite 3 - 0 Dragon Force', value: '⏰ 32 mins ago', inline: false },
        { name: 'Phoenix Rising 2 - 3 Nova Squad', value: '⏰ 1 hour ago', inline: false },
        { name: 'Shadow Legends 3 - 2 Echo Squad', value: '⏰ 2 hours ago', inline: false }
      ];
      await interaction.editReply({ embeds: [E.ticket('Recent Results', '', fields)] });
    }

    else if (sub === 'achievements') {
      const fields = [
        { name: '🏆 First Win', value: 'Earned first match win', inline: true },
        { name: '⭐ 10 Wins', value: 'Won 10 matches', inline: true },
        { name: '💯 Perfect Match', value: 'Won without losing a round', inline: true },
        { name: '🎯 Sharpshooter', value: 'Top fragger 5 times', inline: true }
      ];
      await interaction.editReply({ embeds: [E.ticket('Achievements', '', fields)] });
    }

    else if (sub === 'records') {
      const fields = [
        { name: 'Most Wins', value: 'ProPlayer99 - 156 wins', inline: true },
        { name: 'Highest Rating', value: 'ProPlayer99 - 2450', inline: true },
        { name: 'Win Streak', value: 'IceShatter - 12 wins', inline: true },
        { name: 'MVP Awards', value: 'EliteGamer - 24 awards', inline: true }
      ];
      await interaction.editReply({ embeds: [E.ticket('Record Holders', '', fields)] });
    }

    else if (sub === 'season') {
      await interaction.editReply({ embeds: [E.gold('2026 Spring Season', '8 weeks in\n256 matches completed\n32 teams competing\n$50,000 prize pool')] });
    }

    else {
      await interaction.editReply({ embeds: [E.info('eSports', 'Coming soon!')] });
    }
  }
};

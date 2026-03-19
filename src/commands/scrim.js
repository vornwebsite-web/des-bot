const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { Guild, User } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scrim')
    .setDescription('Scrim and match management')
    .addSubcommand(s => s.setName('create').setDescription('Create a scrim')
      .addStringOption(o => o.setName('game').setDescription('Game').setRequired(true))
      .addIntegerOption(o => o.setName('players').setDescription('Players per team').setRequired(true).setMinValue(1).setMaxValue(10))
    )
    .addSubcommand(s => s.setName('join').setDescription('Join a scrim'))
    .addSubcommand(s => s.setName('leave').setDescription('Leave scrim'))
    .addSubcommand(s => s.setName('list').setDescription('List scrims'))
    .addSubcommand(s => s.setName('report').setDescription('Report scrim result')
      .addStringOption(o => o.setName('scrim-id').setDescription('Scrim ID').setRequired(true))
      .addStringOption(o => o.setName('winner').setDescription('Winning team (team1/team2)').setRequired(true).addChoices(
        { name: 'Team 1', value: 'team1' },
        { name: 'Team 2', value: 'team2' }
      ))
    )
    .addSubcommand(s => s.setName('stats').setDescription('Your scrim stats'))
    .addSubcommand(s => s.setName('history').setDescription('Your scrim history'))
    .addSubcommand(s => s.setName('leaderboard').setDescription('Top scrim players'))
    .addSubcommand(s => s.setName('cancel').setDescription('Cancel scrim')
      .addStringOption(o => o.setName('scrim-id').setDescription('Scrim ID').setRequired(true))
    )
    .addSubcommand(s => s.setName('ratings').setDescription('Scrim ratings'))
    .addSubcommand(s => s.setName('rate').setDescription('Rate a scrim')
      .addStringOption(o => o.setName('scrim-id').setDescription('Scrim ID').setRequired(true))
      .addIntegerOption(o => o.setName('rating').setDescription('Rating 1-5').setRequired(true).setMinValue(1).setMaxValue(5))
    )
    .addSubcommand(s => s.setName('info').setDescription('Scrim info')
      .addStringOption(o => o.setName('scrim-id').setDescription('Scrim ID').setRequired(true))
    )
    .addSubcommand(s => s.setName('rules').setDescription('Scrim rules'))
    .addSubcommand(s => s.setName('settings').setDescription('Change scrim settings'))
    .addSubcommand(s => s.setName('ban').setDescription('Ban player from scrims')
      .addUserOption(o => o.setName('player').setDescription('Player to ban').setRequired(true))
    )
    .addSubcommand(s => s.setName('my-scrims').setDescription('View your scrims'))
    .addSubcommand(s => s.setName('pending').setDescription('Pending scrims'))
    .addSubcommand(s => s.setName('completed').setDescription('Completed scrims')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: sub !== 'list' && sub !== 'leaderboard' && sub !== 'pending' });

    const cfg = await Guild.findOne({ guildId: interaction.guildId });
    if (!cfg) return interaction.editReply({ embeds: [E.error('Not Setup', 'Guild not configured')] });

    if (sub === 'create') {
      const game = interaction.options.getString('game');
      const players = interaction.options.getInteger('players');
      
      if (!cfg.scrims) cfg.scrims = [];

      const scrimId = 'SCRIM-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      cfg.scrims.push({
        id: scrimId,
        game,
        playersPerTeam: players,
        creator: interaction.user.id,
        team1: [interaction.user.id],
        team2: [],
        status: 'open',
        createdAt: new Date(),
        rating: 0,
        ratingCount: 0
      });
      await cfg.save();

      let u = await User.findOne({ userId: interaction.user.id });
      if (!u) u = await User.create({ userId: interaction.user.id });
      u.scrimsCreated = (u.scrimsCreated || 0) + 1;
      await u.save();

      await interaction.editReply({ embeds: [E.success('Scrim Created', `**${game}** ${players}v${players}\n\nID: **${scrimId}**\n\nTeam 1: 1/${players}\nTeam 2: 0/${players}`)] });
    }

    else if (sub === 'join') {
      const openScrims = cfg.scrims?.filter(s => s.status === 'open') || [];
      
      if (!openScrims.length) return interaction.editReply({ embeds: [E.error('No Scrims', 'No open scrims available')] });

      const scrim = openScrims[0];
      
      if (scrim.team1.includes(interaction.user.id) || scrim.team2.includes(interaction.user.id)) {
        return interaction.editReply({ embeds: [E.warn('Already Joined', 'You already joined this scrim')] });
      }

      if (scrim.team1.length < scrim.playersPerTeam) {
        scrim.team1.push(interaction.user.id);
      } else if (scrim.team2.length < scrim.playersPerTeam) {
        scrim.team2.push(interaction.user.id);
      } else {
        return interaction.editReply({ embeds: [E.error('Full', 'Scrim is full')] });
      }

      if (scrim.team1.length === scrim.playersPerTeam && scrim.team2.length === scrim.playersPerTeam) {
        scrim.status = 'ready';
      }

      await cfg.save();

      let u = await User.findOne({ userId: interaction.user.id });
      if (!u) u = await User.create({ userId: interaction.user.id });
      u.scrimsJoined = (u.scrimsJoined || 0) + 1;
      await u.save();

      await interaction.editReply({ embeds: [E.success('Joined', `You joined **${scrim.game}}** scrim!\n\nTeam 1: ${scrim.team1.length}/${scrim.playersPerTeam}\nTeam 2: ${scrim.team2.length}/${scrim.playersPerTeam}`)] });
    }

    else if (sub === 'leave') {
      const userScrims = cfg.scrims?.filter(s => s.team1.includes(interaction.user.id) || s.team2.includes(interaction.user.id)) || [];
      
      if (!userScrims.length) return interaction.editReply({ embeds: [E.error('Not Joined', 'You have not joined any scrims')] });

      const scrim = userScrims[0];
      scrim.team1 = scrim.team1.filter(id => id !== interaction.user.id);
      scrim.team2 = scrim.team2.filter(id => id !== interaction.user.id);

      if (scrim.team1.length === 0 && scrim.team2.length === 0) {
        cfg.scrims = cfg.scrims.filter(s => s.id !== scrim.id);
      } else {
        scrim.status = 'open';
      }

      await cfg.save();
      await interaction.editReply({ embeds: [E.success('Left', `You left the scrim. (${scrim.game})`)] });
    }

    else if (sub === 'list') {
      const openScrims = cfg.scrims?.filter(s => s.status === 'open') || [];
      
      if (!openScrims.length) return interaction.editReply({ embeds: [E.info('No Scrims', 'No open scrims available')] });

      const fields = openScrims.slice(0, 10).map(s => ({
        name: `[${s.id}] ${s.game}`,
        value: `${s.team1.length}/${s.playersPerTeam}v${s.team2.length}/${s.playersPerTeam} | Rating: ${s.ratingCount > 0 ? (s.rating / s.ratingCount).toFixed(1) : '0'}/5`,
        inline: false
      }));

      await interaction.editReply({ embeds: [E.ticket('Open Scrims', '', fields)] });
    }

    else if (sub === 'report') {
      const scrimId = interaction.options.getString('scrim-id');
      const winner = interaction.options.getString('winner');
      
      const scrim = cfg.scrims?.find(s => s.id === scrimId);
      if (!scrim) return interaction.editReply({ embeds: [E.error('Not Found', 'Scrim not found')] });

      scrim.status = 'completed';
      scrim.winner = winner;
      scrim.completedAt = new Date();

      // Award wins to winning team
      const winningTeam = winner === 'team1' ? scrim.team1 : scrim.team2;
      for (const userId of winningTeam) {
        let u = await User.findOne({ userId });
        if (!u) u = await User.create({ userId });
        u.scrimsWins = (u.scrimsWins || 0) + 1;
        await u.save();
      }

      await cfg.save();

      await interaction.editReply({ embeds: [E.success('Result Reported', `**Team ${winner === 'team1' ? '1' : '2'}** won!\n\n${scrim.game} scrim completed.`)] });
    }

    else if (sub === 'stats') {
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u) u = {};

      const userScrims = cfg.scrims?.filter(s => s.team1.includes(interaction.user.id) || s.team2.includes(interaction.user.id)) || [];
      const wins = (u.scrimsWins || 0);
      const total = userScrims.length;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

      await interaction.editReply({ embeds: [E.gold('Your Scrim Stats', '', [
        { name: 'Scrims Joined', value: (u.scrimsJoined || 0).toString(), inline: true },
        { name: 'Wins', value: wins.toString(), inline: true },
        { name: 'Win Rate', value: winRate + '%', inline: true },
        { name: 'Scrims Created', value: (u.scrimsCreated || 0).toString(), inline: true }
      ]).setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))] });
    }

    else if (sub === 'leaderboard') {
      const users = await User.find({ scrimsWins: { $gt: 0 } }).sort({ scrimsWins: -1 }).limit(10);
      const entries = users.map(u => ({ id: u.userId, val: (u.scrimsWins || 0) + ' wins' }));
      
      if (!entries.length) return interaction.editReply({ embeds: [E.info('No Data', 'No scrim data yet')] });

      await interaction.editReply({ embeds: [E.lb('Top Scrim Players', entries, interaction.guild)] });
    }

    else if (sub === 'cancel') {
      const scrimId = interaction.options.getString('scrim-id');
      const scrim = cfg.scrims?.find(s => s.id === scrimId);

      if (!scrim) return interaction.editReply({ embeds: [E.error('Not Found', 'Scrim not found')] });
      if (scrim.creator !== interaction.user.id) return interaction.editReply({ embeds: [E.error('No Perm', 'Only creator can cancel')] });

      cfg.scrims = cfg.scrims.filter(s => s.id !== scrimId);
      await cfg.save();

      await interaction.editReply({ embeds: [E.success('Cancelled', `Scrim **${scrim.id}** cancelled`)] });
    }

    else if (sub === 'rate') {
      const scrimId = interaction.options.getString('scrim-id');
      const rating = interaction.options.getInteger('rating');
      
      const scrim = cfg.scrims?.find(s => s.id === scrimId);
      if (!scrim) return interaction.editReply({ embeds: [E.error('Not Found', 'Scrim not found')] });

      scrim.rating = (scrim.rating || 0) + rating;
      scrim.ratingCount = (scrim.ratingCount || 0) + 1;
      await cfg.save();

      const avg = (scrim.rating / scrim.ratingCount).toFixed(1);
      await interaction.editReply({ embeds: [E.success('Rated', `You rated this scrim **${rating}/5**\n\nAverage Rating: ${avg}/5`)] });
    }

    else if (sub === 'info') {
      const scrimId = interaction.options.getString('scrim-id');
      const scrim = cfg.scrims?.find(s => s.id === scrimId);

      if (!scrim) return interaction.editReply({ embeds: [E.error('Not Found', 'Scrim not found')] });

      const rating = scrim.ratingCount > 0 ? (scrim.rating / scrim.ratingCount).toFixed(1) : '0';

      await interaction.editReply({ embeds: [E.ticket(`${scrim.id} - ${scrim.game}`, '', [
        { name: 'Status', value: scrim.status, inline: true },
        { name: 'Format', value: `${scrim.playersPerTeam}v${scrim.playersPerTeam}`, inline: true },
        { name: 'Rating', value: `${rating}/5`, inline: true },
        { name: 'Team 1', value: scrim.team1.length.toString(), inline: true },
        { name: 'Team 2', value: scrim.team2.length.toString(), inline: true },
        { name: 'Created', value: new Date(scrim.createdAt).toLocaleDateString(), inline: true }
      ])] });
    }

    else if (sub === 'rules') {
      await interaction.editReply({ embeds: [E.gold('Scrim Rules', '', [
        { name: '1️⃣ Fair Play', value: 'No cheating or exploits', inline: false },
        { name: '2️⃣ Respect', value: 'Be respectful to all players', inline: false },
        { name: '3️⃣ Communication', value: 'Use voice comms if required', inline: false },
        { name: '4️⃣ On Time', value: 'Join on time, no afk', inline: false },
        { name: '5️⃣ Report Results', value: 'Report match results promptly', inline: false }
      ])] });
    }

    else if (sub === 'ratings') {
      const scrimRatings = cfg.scrims?.filter(s => s.ratingCount > 0)?.sort((a, b) => (b.rating / b.ratingCount) - (a.rating / a.ratingCount)) || [];
      
      if (!scrimRatings.length) return interaction.editReply({ embeds: [E.info('No Ratings', 'No rated scrims')] });

      const fields = scrimRatings.slice(0, 5).map(s => ({
        name: `${s.id}`,
        value: `⭐ ${(s.rating / s.ratingCount).toFixed(1)}/5 (${s.ratingCount} votes)`,
        inline: true
      }));

      await interaction.editReply({ embeds: [E.ticket('Top Rated Scrims', '', fields)] });
    }

    else if (sub === 'ban') {
      const player = interaction.options.getUser('player');
      
      if (!cfg.scrimBans) cfg.scrimBans = [];
      if (cfg.scrimBans.includes(player.id)) return interaction.editReply({ embeds: [E.warn('Already', 'Player already banned')] });

      cfg.scrimBans.push(player.id);
      await cfg.save();

      await interaction.editReply({ embeds: [E.success('Banned', `<@${player.id}> banned from scrims`)] });
    }

    else if (sub === 'my-scrims') {
      const userScrims = cfg.scrims?.filter(s => s.team1.includes(interaction.user.id) || s.team2.includes(interaction.user.id)) || [];
      
      if (!userScrims.length) return interaction.editReply({ embeds: [E.info('No Scrims', 'You have not joined any scrims')] });

      const fields = userScrims.slice(0, 10).map(s => ({
        name: `${s.id} - ${s.game}`,
        value: `Status: ${s.status} | ${s.playersPerTeam}v${s.playersPerTeam}`,
        inline: false
      }));

      await interaction.editReply({ embeds: [E.ticket('Your Scrims', '', fields)] });
    }

    else if (sub === 'pending') {
      const pendingScrims = cfg.scrims?.filter(s => s.status === 'open' || s.status === 'ready') || [];
      
      if (!pendingScrims.length) return interaction.editReply({ embeds: [E.info('None', 'No pending scrims')] });

      const fields = pendingScrims.slice(0, 10).map(s => ({
        name: `${s.id} - ${s.game}`,
        value: `${s.status === 'open' ? 'Filling' : 'Ready'} | ${s.team1.length}/${s.playersPerTeam}v${s.team2.length}/${s.playersPerTeam}`,
        inline: false
      }));

      await interaction.editReply({ embeds: [E.ticket('Pending Scrims', '', fields)] });
    }

    else if (sub === 'completed') {
      const completedScrims = cfg.scrims?.filter(s => s.status === 'completed') || [];
      
      if (!completedScrims.length) return interaction.editReply({ embeds: [E.info('None', 'No completed scrims')] });

      const fields = completedScrims.slice(0, 10).map(s => ({
        name: `${s.id} - ${s.game}`,
        value: `Winner: Team ${s.winner === 'team1' ? '1' : '2'} | Rating: ${s.ratingCount > 0 ? (s.rating / s.ratingCount).toFixed(1) : '0'}/5`,
        inline: false
      }));

      await interaction.editReply({ embeds: [E.ticket('Completed Scrims', '', fields)] });
    }

    else if (sub === 'settings') {
      await interaction.editReply({ embeds: [E.gold('Scrim Settings', 'Customize your scrim experience', [
        { name: '⏰ Auto-Start', value: 'Start when full', inline: true },
        { name: '🎯 Game Mode', value: 'Select preferred modes', inline: true },
        { name: '📢 Notifications', value: 'Get notified of new scrims', inline: true }
      ])] });
    }
  }
};

const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { Guild } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scrim')
    .setDescription('Scrim and match management')
    .addSubcommand(s => s.setName('create').setDescription('Create a scrim')
      .addStringOption(o => o.setName('game').setDescription('Game').setRequired(true))
      .addIntegerOption(o => o.setName('players').setDescription('Players per team').setRequired(true))
    )
    .addSubcommand(s => s.setName('join').setDescription('Join a scrim'))
    .addSubcommand(s => s.setName('leave').setDescription('Leave scrim'))
    .addSubcommand(s => s.setName('list').setDescription('List scrims'))
    .addSubcommand(s => s.setName('report').setDescription('Report scrim result')
      .addIntegerOption(o => o.setName('scrim-id').setDescription('Scrim ID').setRequired(true))
      .addStringOption(o => o.setName('winner').setDescription('Winning team').setRequired(true))
    )
    .addSubcommand(s => s.setName('stats').setDescription('Your scrim stats'))
    .addSubcommand(s => s.setName('history').setDescription('Your scrim history'))
    .addSubcommand(s => s.setName('leaderboard').setDescription('Top scrim players'))
    .addSubcommand(s => s.setName('cancel').setDescription('Cancel scrim'))
    .addSubcommand(s => s.setName('ratings').setDescription('Scrim ratings'))
    .addSubcommand(s => s.setName('rate').setDescription('Rate a scrim')
      .addIntegerOption(o => o.setName('scrim-id').setDescription('Scrim ID').setRequired(true))
      .addIntegerOption(o => o.setName('rating').setDescription('Rating 1-5').setRequired(true).setMinValue(1).setMaxValue(5))
    )
    .addSubcommand(s => s.setName('info').setDescription('Scrim info')
      .addIntegerOption(o => o.setName('scrim-id').setDescription('Scrim ID').setRequired(true))
    )
    .addSubcommand(s => s.setName('rules').setDescription('Scrim rules'))
    .addSubcommand(s => s.setName('settings').setDescription('Change scrim settings'))
    .addSubcommand(s => s.setName('ban').setDescription('Ban player from scrims')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: sub !== 'list' && sub !== 'leaderboard' });

    if (sub === 'create') {
      const game = interaction.options.getString('game');
      const players = interaction.options.getInteger('players');
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      if (!cfg) cfg = new Guild({ guildId: interaction.guildId });
      if (!cfg.scrims) cfg.scrims = [];
      
      const scrimId = Math.floor(Math.random() * 10000);
      cfg.scrims.push({ id: scrimId, game, players, creator: interaction.user.id, team1: [interaction.user.id], team2: [], status: 'open' });
      await cfg.save();
      
      await interaction.editReply({ embeds: [E.success('Scrim Created', `**${game}** ${players}v${players} - ID: **${scrimId}**`)] });
    }

    else if (sub === 'join') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const scrim = cfg?.scrims?.find(s => s.status === 'open' && !s.team1.includes(interaction.user.id) && !s.team2.includes(interaction.user.id));
      if (!scrim) return interaction.editReply({ embeds: [E.error('No Scrim', 'No available scrims')] });
      
      if (scrim.team1.length <= scrim.team2.length) scrim.team1.push(interaction.user.id);
      else scrim.team2.push(interaction.user.id);
      
      if (scrim.team1.length === scrim.players && scrim.team2.length === scrim.players) scrim.status = 'full';
      await cfg.save();
      
      await interaction.editReply({ embeds: [E.success('Joined', 'You joined the scrim!')] });
    }

    else if (sub === 'list') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const scrims = cfg?.scrims?.filter(s => s.status === 'open') || [];
      if (!scrims.length) return interaction.editReply({ embeds: [E.info('No Scrims', 'No open scrims')] });
      
      const fields = scrims.slice(0, 10).map(s => ({ name: `[${s.id}] ${s.game}`, value: `${s.team1.length}/${s.players}v${s.team2.length}/${s.players}`, inline: true }));
      await interaction.editReply({ embeds: [E.ticket('Open Scrims', '', fields)] });
    }

    else if (sub === 'stats') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      const scrims = cfg?.scrims?.filter(s => s.team1.includes(interaction.user.id) || s.team2.includes(interaction.user.id)) || [];
      await interaction.editReply({ embeds: [E.gold('Your Scrim Stats', '', [
        { name: 'Total Scrims', value: scrims.length.toString(), inline: true },
        { name: 'Wins', value: '0', inline: true },
        { name: 'Rating', value: '4.5/5', inline: true }
      ])] });
    }

    else if (sub === 'leaderboard') {
      await interaction.editReply({ embeds: [E.lb('Top Scrim Players', [
        { id: '1', val: '50 scrims' },
        { id: '2', val: '45 scrims' },
        { id: '3', val: '40 scrims' }
      ], interaction.guild)] });
    }

    else {
      await interaction.editReply({ embeds: [E.info('Scrim', 'Coming soon!')] });
    }
  }
};

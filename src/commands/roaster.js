const { SlashCommandBuilder, ChannelType } = require('discord.js');
const E = require('../utils/embeds');
const { Guild } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brawl-roster')
    .setDescription('Brawl Stars roster management')
    .addSubcommand(s => s.setName('setup').setDescription('Setup roster channels')
      .addChannelOption(o => o.setName('main-roster').setDescription('Main roster channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('academy-roster').setDescription('Academy roster channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('apac-roster').setDescription('APAC roster channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('sa-roster').setDescription('SA roster channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('na-roster').setDescription('NA roster channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(s => s.setName('add-player').setDescription('Add player to team')
      .addStringOption(o => o.setName('team').setDescription('Team').setRequired(true).addChoices(
        { name: 'Main Roster', value: 'main' },
        { name: 'Academy', value: 'academy' },
        { name: 'APAC', value: 'apac' },
        { name: 'SA', value: 'sa' },
        { name: 'NA', value: 'na' }
      ))
      .addUserOption(o => o.setName('player').setDescription('Player to add').setRequired(true))
      .addStringOption(o => o.setName('role').setDescription('Player role').setRequired(true).addChoices(
        { name: 'Carry', value: 'carry' },
        { name: 'Mid', value: 'mid' },
        { name: 'Support', value: 'support' },
        { name: 'Flex', value: 'flex' }
      ))
    )
    .addSubcommand(s => s.setName('remove-player').setDescription('Remove player from team')
      .addStringOption(o => o.setName('team').setDescription('Team').setRequired(true).addChoices(
        { name: 'Main Roster', value: 'main' },
        { name: 'Academy', value: 'academy' },
        { name: 'APAC', value: 'apac' },
        { name: 'SA', value: 'sa' },
        { name: 'NA', value: 'na' }
      ))
      .addUserOption(o => o.setName('player').setDescription('Player to remove').setRequired(true))
    )
    .addSubcommand(s => s.setName('view').setDescription('View team roster')
      .addStringOption(o => o.setName('team').setDescription('Team').setRequired(true).addChoices(
        { name: 'Main Roster', value: 'main' },
        { name: 'Academy', value: 'academy' },
        { name: 'APAC', value: 'apac' },
        { name: 'SA', value: 'sa' },
        { name: 'NA', value: 'na' }
      ))
    )
    .addSubcommand(s => s.setName('all-rosters').setDescription('View all rosters'))
    .addSubcommand(s => s.setName('stats').setDescription('Player statistics')
      .addUserOption(o => o.setName('player').setDescription('Player').setRequired(true))
    )
    .addSubcommand(s => s.setName('promote').setDescription('Promote to Main')
      .addUserOption(o => o.setName('player').setDescription('Player').setRequired(true))
    )
    .addSubcommand(s => s.setName('demote').setDescription('Move to Academy')
      .addUserOption(o => o.setName('player').setDescription('Player').setRequired(true))
    )
    .addSubcommand(s => s.setName('transfer').setDescription('Transfer between teams')
      .addUserOption(o => o.setName('player').setDescription('Player').setRequired(true))
      .addStringOption(o => o.setName('to-team').setDescription('Destination team').setRequired(true).addChoices(
        { name: 'Main Roster', value: 'main' },
        { name: 'Academy', value: 'academy' },
        { name: 'APAC', value: 'apac' },
        { name: 'SA', value: 'sa' },
        { name: 'NA', value: 'na' }
      ))
    )
    .addSubcommand(s => s.setName('player-info').setDescription('Get player info')
      .addUserOption(o => o.setName('player').setDescription('Player').setRequired(true))
    )
    .addSubcommand(s => s.setName('team-stats').setDescription('Team statistics')
      .addStringOption(o => o.setName('team').setDescription('Team').setRequired(true).addChoices(
        { name: 'Main Roster', value: 'main' },
        { name: 'Academy', value: 'academy' },
        { name: 'APAC', value: 'apac' },
        { name: 'SA', value: 'sa' },
        { name: 'NA', value: 'na' }
      ))
    )
    .addSubcommand(s => s.setName('schedule').setDescription('Team schedule'))
    .addSubcommand(s => s.setName('recent-matches').setDescription('Recent matches'))
    .addSubcommand(s => s.setName('wins-losses').setDescription('Win/Loss record'))
    .addSubcommand(s => s.setName('bench').setDescription('View bench players'))
    .addSubcommand(s => s.setName('tryouts').setDescription('Upcoming tryouts')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: sub !== 'view' && sub !== 'all-rosters' && sub !== 'team-stats' });

    const cfg = await Guild.findOne({ guildId: interaction.guildId });
    if (!cfg) {
      return interaction.editReply({ embeds: [E.error('Not Setup', 'Run `/brawl-roster setup` first')] });
    }

    const TEAM_NAMES = {
      main: 'Main Roster',
      academy: 'Academy',
      apac: 'APAC',
      sa: 'SA',
      na: 'NA'
    };

    if (sub === 'setup') {
      const main = interaction.options.getChannel('main-roster');
      const academy = interaction.options.getChannel('academy-roster');
      const apac = interaction.options.getChannel('apac-roster');
      const sa = interaction.options.getChannel('sa-roster');
      const na = interaction.options.getChannel('na-roster');

      if (!cfg.brawlRoster) cfg.brawlRoster = {};
      cfg.brawlRoster.channels = {
        main: main.id,
        academy: academy.id,
        apac: apac.id,
        sa: sa.id,
        na: na.id
      };

      if (!cfg.brawlRoster.teams) {
        cfg.brawlRoster.teams = {
          main: [],
          academy: [],
          apac: [],
          sa: [],
          na: []
        };
      }

      await cfg.save();

      await interaction.editReply({ embeds: [E.success('Rosters Setup', '✅ All roster channels configured\n\n' +
        `📋 Main: <#${main.id}>\n` +
        `📋 Academy: <#${academy.id}>\n` +
        `📋 APAC: <#${apac.id}>\n` +
        `📋 SA: <#${sa.id}>\n` +
        `📋 NA: <#${na.id}>`
      )] });
    }

    else if (sub === 'add-player') {
      const team = interaction.options.getString('team');
      const player = interaction.options.getUser('player');
      const role = interaction.options.getString('role');

      if (!cfg.brawlRoster?.teams) return interaction.editReply({ embeds: [E.error('Not Setup', 'Run setup first')] });

      const teamPlayers = cfg.brawlRoster.teams[team];
      if (teamPlayers.find(p => p.userId === player.id)) {
        return interaction.editReply({ embeds: [E.warn('Already', 'Player already in team')] });
      }

      teamPlayers.push({ userId: player.id, username: player.username, role, joinedAt: new Date() });
      await cfg.save();

      await interaction.editReply({ embeds: [E.success('Added', `<@${player.id}> added to **${TEAM_NAMES[team]}** as **${role}**`)] });
    }

    else if (sub === 'remove-player') {
      const team = interaction.options.getString('team');
      const player = interaction.options.getUser('player');

      if (!cfg.brawlRoster?.teams) return interaction.editReply({ embeds: [E.error('Not Setup', 'Run setup first')] });

      cfg.brawlRoster.teams[team] = cfg.brawlRoster.teams[team].filter(p => p.userId !== player.id);
      await cfg.save();

      await interaction.editReply({ embeds: [E.success('Removed', `<@${player.id}> removed from **${TEAM_NAMES[team]}**`)] });
    }

    else if (sub === 'view') {
      const team = interaction.options.getString('team');

      if (!cfg.brawlRoster?.teams) return interaction.editReply({ embeds: [E.error('Not Setup', 'Run setup first')] });

      const teamPlayers = cfg.brawlRoster.teams[team];
      const fields = teamPlayers.map((p, i) => ({
        name: `${i + 1}. ${p.username}`,
        value: `Role: **${p.role}**`,
        inline: true
      }));

      await interaction.editReply({ embeds: [E.ticket(`${TEAM_NAMES[team]} Roster`, `Total: ${teamPlayers.length}`, fields.slice(0, 12))] });
    }

    else if (sub === 'all-rosters') {
      if (!cfg.brawlRoster?.teams) return interaction.editReply({ embeds: [E.error('Not Setup', 'Run setup first')] });

      const fields = Object.keys(TEAM_NAMES).map(t => ({
        name: `📋 ${TEAM_NAMES[t]}`,
        value: `${cfg.brawlRoster.teams[t].length} players`,
        inline: true
      }));

      await interaction.editReply({ embeds: [E.ticket('DeS Rosters', 'All Teams', fields)] });
    }

    else if (sub === 'promote') {
      const player = interaction.options.getUser('player');

      if (!cfg.brawlRoster?.teams) return interaction.editReply({ embeds: [E.error('Not Setup', 'Run setup first')] });

      for (const [team, players] of Object.entries(cfg.brawlRoster.teams)) {
        const idx = players.findIndex(p => p.userId === player.id);
        if (idx !== -1) {
          if (team === 'main') return interaction.editReply({ embeds: [E.warn('Already', 'Player already in Main')] });
          
          const playerData = players[idx];
          cfg.brawlRoster.teams[team].splice(idx, 1);
          cfg.brawlRoster.teams.main.push(playerData);
          await cfg.save();

          return interaction.editReply({ embeds: [E.success('Promoted', `<@${player.id}> promoted to **Main Roster**`)] });
        }
      }

      interaction.editReply({ embeds: [E.error('Not Found', 'Player not in any roster')] });
    }

    else if (sub === 'player-info') {
      const player = interaction.options.getUser('player');

      if (!cfg.brawlRoster?.teams) return interaction.editReply({ embeds: [E.error('Not Setup', 'Run setup first')] });

      for (const [team, players] of Object.entries(cfg.brawlRoster.teams)) {
        const p = players.find(pl => pl.userId === player.id);
        if (p) {
          return interaction.editReply({ embeds: [E.gold(`${player.username}`, '', [
            { name: 'Team', value: TEAM_NAMES[team], inline: true },
            { name: 'Role', value: p.role, inline: true },
            { name: 'Joined', value: new Date(p.joinedAt).toLocaleDateString(), inline: true },
            { name: 'Status', value: '🟢 Active', inline: true }
          ]).setThumbnail(player.displayAvatarURL())] });
        }
      }

      interaction.editReply({ embeds: [E.error('Not Found', 'Player not in any roster')] });
    }

    else if (sub === 'team-stats') {
      const team = interaction.options.getString('team');

      if (!cfg.brawlRoster?.teams) return interaction.editReply({ embeds: [E.error('Not Setup', 'Run setup first')] });

      const teamPlayers = cfg.brawlRoster.teams[team];
      const carries = teamPlayers.filter(p => p.role === 'carry').length;
      const mids = teamPlayers.filter(p => p.role === 'mid').length;
      const supports = teamPlayers.filter(p => p.role === 'support').length;
      const flex = teamPlayers.filter(p => p.role === 'flex').length;

      await interaction.editReply({ embeds: [E.gold(`${TEAM_NAMES[team]} Stats`, '', [
        { name: 'Total Players', value: teamPlayers.length.toString(), inline: true },
        { name: 'Carries', value: carries.toString(), inline: true },
        { name: 'Mid', value: mids.toString(), inline: true },
        { name: 'Support', value: supports.toString(), inline: true },
        { name: 'Flex', value: flex.toString(), inline: true },
        { name: 'Wins', value: '0', inline: true }
      ])] });
    }

    else if (sub === 'transfer') {
      const player = interaction.options.getUser('player');
      const toTeam = interaction.options.getString('to-team');

      if (!cfg.brawlRoster?.teams) return interaction.editReply({ embeds: [E.error('Not Setup', 'Run setup first')] });

      for (const [team, players] of Object.entries(cfg.brawlRoster.teams)) {
        const idx = players.findIndex(p => p.userId === player.id);
        if (idx !== -1) {
          const playerData = players[idx];
          cfg.brawlRoster.teams[team].splice(idx, 1);
          cfg.brawlRoster.teams[toTeam].push(playerData);
          await cfg.save();

          return interaction.editReply({ embeds: [E.success('Transferred', `<@${player.id}> transferred to **${TEAM_NAMES[toTeam]}**`)] });
        }
      }

      interaction.editReply({ embeds: [E.error('Not Found', 'Player not in any roster')] });
    }

    else {
      await interaction.editReply({ embeds: [E.info('Feature', 'Coming soon')] });
    }
  }
};

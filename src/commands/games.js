const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');
const { User } = require('../models/index');

const TRIVIA_QUESTIONS = {
  easy: [
    { q: 'What does "bot" stand for?', opts: ['Binary Object Token', 'Robot', 'Basic Object Transfer', 'Binary Online Tool'], ans: 1 },
    { q: 'What library do we use to create Discord bots in Node.js?', opts: ['discord.py', 'discord.js', 'discordapp', 'discord-bot'], ans: 1 },
    { q: 'What is the main entry point for a Discord bot?', opts: ['client.login()', 'bot.start()', 'discord.connect()', 'client.connect()'], ans: 0 },
    { q: 'What does "slash command" mean?', opts: ['A command with slashes', 'A command starting with /', 'A broken command', 'A fast command'], ans: 1 },
    { q: 'How do you get a user\'s ID?', opts: ['user.id', 'user.userId', 'user.identifier', 'user.uid'], ans: 0 },
    { q: 'What is the bot token used for?', opts: ['Authentication', 'Database', 'Speed boost', 'Features unlock'], ans: 0 },
    { q: 'What is an "embed" in Discord?', opts: ['A code block', 'A formatted message', 'A bot feature', 'A channel type'], ans: 1 },
    { q: 'How do you reply to an interaction?', opts: ['reply()', 'respond()', 'send()', 'message()'], ans: 0 },
    { q: 'What does "deferred" mean in Discord.js?', opts: ['Delayed response', 'Acknowledged but not replied', 'Ignored interaction', 'Cached response'], ans: 1 },
    { q: 'Which Discord intent is needed for messages?', opts: ['GUILD_MESSAGES', 'MESSAGE_CONTENT', 'GUILD_MESSAGE_CONTENT', 'All correct'], ans: 3 }
  ],
  medium: [
    { q: 'What is the correct way to create a SlashCommandBuilder?', opts: ['new SlashCommand()', 'new SlashCommandBuilder()', 'SlashCommand.create()', 'buildSlash()'], ans: 1 },
    { q: 'How do you handle a button interaction?', opts: ['isButton()', 'interaction.isButton()', 'buttonClick()', 'onButton()'], ans: 1 },
    { q: 'What does "rate limiting" mean?', opts: ['Speed limit', 'API call limit', 'Message limit', 'User limit'], ans: 1 },
    { q: 'Which is the correct Discord API version?', opts: ['v8', 'v9', 'v10', 'v11'], ans: 2 },
    { q: 'How do you defer a reply with ephemeral?', opts: ['deferReply(true)', 'deferReply({ephemeral: true})', 'deferReply({secret: true})', 'ephemeralReply()'], ans: 1 },
    { q: 'What is a "snowflake" in Discord?', opts: ['A frozen user', 'A unique ID', 'A type of channel', 'A role'], ans: 1 },
    { q: 'How do you get a guild\'s members?', opts: ['guild.members', 'guild.members.fetch()', 'guild.getMembers()', 'guild.users'], ans: 1 },
    { q: 'What is a "collector" used for?', opts: ['Gathering data', 'Collecting messages/reactions', 'Storing cache', 'All correct'], ans: 1 },
    { q: 'How do you check permissions?', opts: ['hasPermission()', 'member.permissions.has()', 'checkPerm()', 'permissionCheck()'], ans: 1 },
    { q: 'What does "heartbeat" mean in Discord?', opts: ['User status', 'Connection ping', 'Message indicator', 'Guild activity'], ans: 1 }
  ],
  hard: [
    { q: 'What is the correct REST method for creating a command?', opts: ['POST /applications/:id/commands', 'PUT /commands', 'GET /deploy', 'PATCH /applications'], ans: 0 },
    { q: 'How do you handle modal submissions?', opts: ['isModalSubmit()', 'onSubmit()', 'modalHandler()', 'submitModal()'], ans: 0 },
    { q: 'What is the max length for a slash command name?', opts: ['10 chars', '25 chars', '32 chars', '50 chars'], ans: 2 },
    { q: 'How do you implement cooldowns?', opts: ['setTimeout', 'Timestamp comparison', 'Collection mapping', 'All correct'], ans: 3 },
    { q: 'What is gateway compression used for?', opts: ['Shrink messages', 'Reduce bandwidth', 'Speed boost', 'Cache optimization'], ans: 1 },
    { q: 'Which intents require "MESSAGE_CONTENT"?', opts: ['Reading message content', 'Sending messages', 'Guild events', 'User status'], ans: 0 },
    { q: 'How do you implement a message component interaction?', opts: ['handleComponent()', 'isMessageComponent()', 'componentHandler()', 'customId parsing'], ans: 3 },
    { q: 'What is the max number of slash command options?', opts: ['5', '10', '25', 'Unlimited'], ans: 2 },
    { q: 'How do you cache guild members?', opts: ['Auto cache', 'fetch()', 'Manual cache', 'Partial members'], ans: 1 },
    { q: 'What is "sharding" in Discord bots?', opts: ['Breaking data', 'Load balancing', 'Cache clearing', 'Bot cloning'], ans: 1 },
    { q: 'How do you implement permission overwrites?', opts: ['setPermissions()', 'permissionOverwrites.edit()', 'overwritePerms()', 'setPerm()'], ans: 1 },
    { q: 'What is the correct way to validate a token?', opts: ['Test login', 'Never hardcode', 'Use env vars', 'Both B and C'], ans: 3 },
    { q: 'How do you handle embed field limits?', opts: ['Max 25 fields', 'Max 10 fields', 'Max 50 fields', 'Unlimited'], ans: 0 },
    { q: 'What is a "partials" in Discord.js?', opts: ['Incomplete objects', 'Cached data', 'API requests', 'User settings'], ans: 0 },
    { q: 'How do you properly handle errors in commands?', opts: ['try-catch', 'Error event', 'Promise chains', 'All correct'], ans: 3 }
  ]
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('games')
    .setDescription('Minigames and fun commands')
    .addSubcommand(s => s.setName('rps').setDescription('Rock Paper Scissors')
      .addStringOption(o => o.setName('choice').setDescription('Your choice').setRequired(true).addChoices(
        { name: 'Rock', value: 'rock' },
        { name: 'Paper', value: 'paper' },
        { name: 'Scissors', value: 'scissors' }
      ))
    )
    .addSubcommand(s => s.setName('flip').setDescription('Flip a coin'))
    .addSubcommand(s => s.setName('dice').setDescription('Roll a dice (1-6)'))
    .addSubcommand(s => s.setName('slots').setDescription('Play slots')
      .addIntegerOption(o => o.setName('bet').setDescription('Coins to bet').setRequired(true).setMinValue(1))
    )
    .addSubcommand(s => s.setName('blackjack').setDescription('Play blackjack')
      .addIntegerOption(o => o.setName('bet').setDescription('Coins to bet').setRequired(true).setMinValue(1))
    )
    .addSubcommand(s => s.setName('trivia').setDescription('Discord bot coding trivia')
      .addStringOption(o => o.setName('difficulty').setDescription('Difficulty level').setRequired(true).addChoices(
        { name: 'Easy', value: 'easy' },
        { name: 'Medium', value: 'medium' },
        { name: 'Hard', value: 'hard' }
      ))
    )
    .addSubcommand(s => s.setName('higher-lower').setDescription('Higher or Lower game')
      .addIntegerOption(o => o.setName('bet').setDescription('Coins to bet').setRequired(true).setMinValue(1))
    )
    .addSubcommand(s => s.setName('maze').setDescription('Solve a maze'))
    .addSubcommand(s => s.setName('hangman').setDescription('Play hangman'))
    .addSubcommand(s => s.setName('riddle').setDescription('Answer a riddle'))
    .addSubcommand(s => s.setName('memory').setDescription('Memory game'))
    .addSubcommand(s => s.setName('stats').setDescription('Your game stats'))
    .addSubcommand(s => s.setName('leaderboard').setDescription('Top players'))
    .addSubcommand(s => s.setName('streak').setDescription('Your win streak'))
    .addSubcommand(s => s.setName('badges').setDescription('Your badges')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'rps') {
      const choices = ['rock', 'paper', 'scissors'];
      const playerChoice = interaction.options.getString('choice');
      const botChoice = choices[Math.floor(Math.random() * 3)];

      let result = '';
      if (playerChoice === botChoice) result = '🤝 Tie!';
      else if (
        (playerChoice === 'rock' && botChoice === 'scissors') ||
        (playerChoice === 'paper' && botChoice === 'rock') ||
        (playerChoice === 'scissors' && botChoice === 'paper')
      ) result = '🎉 You won!';
      else result = '💔 You lost!';

      await interaction.editReply({ embeds: [E.gold('Rock Paper Scissors', result, [
        { name: 'Your Choice', value: playerChoice, inline: true },
        { name: 'Bot Choice', value: botChoice, inline: true }
      ])] });
    }

    else if (sub === 'flip') {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      await interaction.editReply({ embeds: [E.success('Coin Flip', result)] });
    }

    else if (sub === 'dice') {
      const roll = Math.floor(Math.random() * 6) + 1;
      await interaction.editReply({ embeds: [E.gold('🎲 Dice Roll', 'You rolled: **' + roll + '**')] });
    }

    else if (sub === 'slots') {
      const bet = interaction.options.getInteger('bet');
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u || (u.coins || 0) < bet) return interaction.editReply({ embeds: [E.error('Insufficient', 'Not enough coins')] });
      
      const symbols = ['🍎', '🍊', '🍋', '🎰', '💎'];
      const result = [symbols[Math.floor(Math.random() * 5)], symbols[Math.floor(Math.random() * 5)], symbols[Math.floor(Math.random() * 5)]];
      const win = result[0] === result[1] && result[1] === result[2];
      const payout = win ? bet * 5 : 0;
      u.coins = (u.coins || 0) - bet + payout;
      await u.save();

      await interaction.editReply({ embeds: [E[win ? 'success' : 'warn'](
        win ? '🎉 JACKPOT!' : '❌ Lost',
        result.join(' ') + '\n\n' + (win ? '+' : '-') + (win ? payout : bet) + ' coins',
        [{ name: 'Balance', value: u.coins + ' coins', inline: true }]
      )] });
    }

    else if (sub === 'trivia') {
      const difficulty = interaction.options.getString('difficulty');
      const questions = TRIVIA_QUESTIONS[difficulty];
      const question = questions[Math.floor(Math.random() * questions.length)];

      // Create numbered options
      const optionsText = question.opts.map((opt, i) => `**${i + 1}.** ${opt}`).join('\n');
      
      // Get reward based on difficulty
      const rewards = { easy: 50, medium: 150, hard: 300 };
      const reward = rewards[difficulty];

      const embed = E.gold('🧠 Discord Bot Trivia - ' + difficulty.toUpperCase(), optionsText, [
        { name: 'Question', value: question.q, inline: false },
        { name: 'Reward', value: reward + ' coins for correct answer', inline: false }
      ]);

      await interaction.editReply({ embeds: [embed], content: `**Reply with the number of your answer!** (1-${question.opts.length})` });

      // Wait for answer
      const filter = m => m.author.id === interaction.user.id && /^[1-9]$/.test(m.content);
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

      collector.on('collect', async (msg) => {
        const answer = parseInt(msg.content) - 1;
        const isCorrect = answer === question.ans;

        let u = await User.findOne({ userId: interaction.user.id });
        if (!u) u = await User.create({ userId: interaction.user.id });

        if (isCorrect) {
          u.coins = (u.coins || 0) + reward;
          u.gameWins = (u.gameWins || 0) + 1;
          u.winStreak = (u.winStreak || 0) + 1;
          await u.save();

          await interaction.followUp({ embeds: [E.success('✅ Correct!', `You earned **${reward}** coins!\n\nCorrect answer: **${question.opts[question.ans]}**`)] });
        } else {
          u.winStreak = 0;
          await u.save();

          await interaction.followUp({ embeds: [E.error('❌ Incorrect!', `The correct answer was: **${question.opts[question.ans]}**\n\nYou selected: **${question.opts[answer]}**`)] });
        }
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ embeds: [E.warn('⏰ Time\'s Up!', 'You didn\'t answer in time!\n\nCorrect answer: **' + question.opts[question.ans] + '**')] }).catch(() => {});
        }
      });
    }

    else if (sub === 'stats') {
      let u = await User.findOne({ userId: interaction.user.id });
      if (!u) u = { games: {} };
      await interaction.editReply({ embeds: [E.gold('Game Stats', '', [
        { name: 'Games Played', value: (u.gamesPlayed || 0).toString(), inline: true },
        { name: 'Wins', value: (u.gameWins || 0).toString(), inline: true },
        { name: 'Streak', value: (u.winStreak || 0).toString(), inline: true }
      ]).setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))] });
    }

    else if (sub === 'leaderboard') {
      const users = await User.find({ gameWins: { $gt: 0 } }).sort({ gameWins: -1 }).limit(10);
      const entries = users.map(u => ({ id: u.userId, val: (u.gameWins || 0) + ' wins' }));
      await interaction.editReply({ embeds: [E.lb('Top Players', entries, interaction.guild)] });
    }

    else if (sub === 'streak') {
      let u = await User.findOne({ userId: interaction.user.id });
      await interaction.editReply({ embeds: [E.success('Win Streak', 'Current: **' + (u?.winStreak || 0) + '**')] });
    }

    else if (sub === 'badges') {
      let u = await User.findOne({ userId: interaction.user.id });
      const badges = (u?.badges || []).join(' ') || 'None yet';
      await interaction.editReply({ embeds: [E.gold('Badges', badges)] });
    }

    else {
      await interaction.editReply({ embeds: [E.info('Game', 'Coming soon!')] });
    }
  }
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');
const { requirePerm } = require('../utils/helpers');
const { Guild } = require('../models/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup').setDescription('⚙️ Server configuration')
    .addSubcommand(s => s.setName('wizard').setDescription('Setup guide'))
    .addSubcommand(s => s.setName('logs').setDescription('Configure log channels')
      .addChannelOption(o => o.setName('general').setDescription('General logs'))
      .addChannelOption(o => o.setName('mod').setDescription('Mod logs'))
      .addChannelOption(o => o.setName('messages').setDescription('Message logs')))
    .addSubcommand(s => s.setName('automod').setDescription('Auto-moderation settings')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable').setRequired(true))
      .addBooleanOption(o => o.setName('anti-spam').setDescription('Anti spam'))
      .addBooleanOption(o => o.setName('anti-links').setDescription('Block links'))
      .addBooleanOption(o => o.setName('anti-invites').setDescription('Block invites'))
      .addBooleanOption(o => o.setName('anti-caps').setDescription('Anti excessive caps')))
    .addSubcommand(s => s.setName('antiraid').setDescription('Anti-raid protection')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable').setRequired(true))
      .addIntegerOption(o => o.setName('threshold').setDescription('Joins to trigger (default 10)').setMinValue(2).setMaxValue(50))
      .addIntegerOption(o => o.setName('window').setDescription('Window in seconds').setMinValue(5).setMaxValue(60))
      .addStringOption(o => o.setName('action').setDescription('Action').addChoices(
        { name: 'Kick', value: 'kick' }, { name: 'Ban', value: 'ban' })))
    .addSubcommand(s => s.setName('antinuke').setDescription('Anti-nuke protection')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable').setRequired(true))
      .addIntegerOption(o => o.setName('threshold').setDescription('Actions to trigger').setMinValue(1).setMaxValue(10))
      .addStringOption(o => o.setName('action').setDescription('Action').addChoices(
        { name: 'Ban', value: 'ban' }, { name: 'Kick', value: 'kick' })))
    .addSubcommand(s => s.setName('leveling').setDescription('XP leveling system')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable').setRequired(true))
      .addIntegerOption(o => o.setName('xp').setDescription('XP per message').setMinValue(1).setMaxValue(100))
      .addIntegerOption(o => o.setName('cooldown').setDescription('Cooldown seconds').setMinValue(5).setMaxValue(300))
      .addChannelOption(o => o.setName('announce').setDescription('Level-up announcement channel')))
    .addSubcommand(s => s.setName('autorole').setDescription('Auto-assign role on join')
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
      .addBooleanOption(o => o.setName('remove').setDescription('Remove from auto-assign')))
    .addSubcommand(s => s.setName('view').setDescription('View current config'))
    .addSubcommand(s => s.setName('counting').setDescription('Start counting game')
      .addChannelOption(o => o.setName('channel').setDescription('Counting channel').setRequired(true)))
    .addSubcommand(s => s.setName('reset').setDescription('Reset all settings')),

  async execute(interaction) {
    if (!(await requirePerm(interaction, PermissionFlagsBits.Administrator))) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'wizard') {
      await interaction.editReply({ embeds: [E.gold('⚙️ DeS Bot™ Setup Wizard',
        'Use these commands to fully configure your server:',
        [
          { name: '👋 Welcome/Farewell', value: '`/welcome setup` • `/welcome farewell`', inline: false },
          { name: '🎫 Tickets', value: '`/ticket setup` then `/ticket panel`', inline: false },
          { name: '📝 Logging', value: '`/setup logs`', inline: false },
          { name: '🛡️ AutoMod', value: '`/setup automod`', inline: false },
          { name: '🚨 Anti-Raid', value: '`/setup antiraid`', inline: false },
          { name: '💣 Anti-Nuke', value: '`/setup antinuke`', inline: false },
          { name: '📈 Leveling', value: '`/setup leveling`', inline: false },
          { name: '🌐 Dashboard', value: '[dotsbot.site/dashboard](http://www.dotsbot.site/dashboard)', inline: false },
        ])] });
    }

    else if (sub === 'logs') {
      const g = interaction.options.getChannel('general');
      const m = interaction.options.getChannel('mod');
      const msg = interaction.options.getChannel('messages');
      const upd = { 'logging.enabled': true };
      if (g) upd['channels.logs'] = g.id;
      if (m) upd['channels.modLogs'] = m.id;
      if (msg) upd['channels.msgLogs'] = msg.id;
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: upd }, { upsert: true });
      await interaction.editReply({ embeds: [E.success('Logs Configured', '',
        [g, m, msg].filter(Boolean).map(ch => ({ name: `📋 ${ch.name}`, value: `<#${ch.id}>`, inline: true }))
      )] });
    }

    else if (sub === 'automod') {
      const en = interaction.options.getBoolean('enabled');
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: {
        'moderation.autoMod': en,
        'moderation.antiSpam': interaction.options.getBoolean('anti-spam') ?? false,
        'moderation.antiLinks': interaction.options.getBoolean('anti-links') ?? false,
        'moderation.antiInvites': interaction.options.getBoolean('anti-invites') ?? false,
        'moderation.antiCaps': interaction.options.getBoolean('anti-caps') ?? false,
      }}, { upsert: true });
      await interaction.editReply({ embeds: [E.success(`AutoMod ${en ? 'Enabled' : 'Disabled'}`, '', [
        { name: '🔇 Anti-Spam', value: interaction.options.getBoolean('anti-spam') ? '✅' : '❌', inline: true },
        { name: '🔗 Anti-Links', value: interaction.options.getBoolean('anti-links') ? '✅' : '❌', inline: true },
        { name: '📨 Anti-Invites', value: interaction.options.getBoolean('anti-invites') ? '✅' : '❌', inline: true },
        { name: '🔤 Anti-Caps', value: interaction.options.getBoolean('anti-caps') ? '✅' : '❌', inline: true },
      ])] });
    }

    else if (sub === 'antiraid') {
      const en = interaction.options.getBoolean('enabled');
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: {
        'antiRaid.enabled': en,
        'antiRaid.threshold': interaction.options.getInteger('threshold') || 10,
        'antiRaid.window': interaction.options.getInteger('window') || 10,
        'antiRaid.action': interaction.options.getString('action') || 'kick',
      }}, { upsert: true });
      await interaction.editReply({ embeds: [E.success(`Anti-Raid ${en ? 'Enabled' : 'Disabled'}`, '', [
        { name: '⚡ Threshold', value: `${interaction.options.getInteger('threshold') || 10} joins`, inline: true },
        { name: '⏱️ Window', value: `${interaction.options.getInteger('window') || 10}s`, inline: true },
        { name: '🔨 Action', value: (interaction.options.getString('action') || 'kick').toUpperCase(), inline: true },
      ])] });
    }

    else if (sub === 'antinuke') {
      const en = interaction.options.getBoolean('enabled');
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: {
        'antiNuke.enabled': en,
        'antiNuke.threshold': interaction.options.getInteger('threshold') || 3,
        'antiNuke.action': interaction.options.getString('action') || 'ban',
      }}, { upsert: true });
      await interaction.editReply({ embeds: [E.success(`Anti-Nuke ${en ? 'Enabled' : 'Disabled'}`, 'Protects against mass deletions, bans, and nuke attacks.', [
        { name: '⚡ Threshold', value: `${interaction.options.getInteger('threshold') || 3} actions`, inline: true },
        { name: '🔨 Action', value: (interaction.options.getString('action') || 'ban').toUpperCase(), inline: true },
      ])] });
    }

    else if (sub === 'leveling') {
      const en = interaction.options.getBoolean('enabled');
      const ch = interaction.options.getChannel('announce');
      await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $set: {
        'leveling.enabled': en,
        'leveling.xpPerMsg': interaction.options.getInteger('xp') || 15,
        'leveling.cooldown': interaction.options.getInteger('cooldown') || 60,
        'channels.levelUp': ch?.id,
      }}, { upsert: true });
      await interaction.editReply({ embeds: [E.success(`Leveling ${en ? 'Enabled' : 'Disabled'}`, '', [
        { name: '⭐ XP/Msg', value: `${interaction.options.getInteger('xp') || 15}`, inline: true },
        { name: '⏱️ Cooldown', value: `${interaction.options.getInteger('cooldown') || 60}s`, inline: true },
        ...(ch ? [{ name: '📢 Announce', value: `<#${ch.id}>`, inline: true }] : []),
      ])] });
    }

    else if (sub === 'autorole') {
      const role = interaction.options.getRole('role');
      const rm = interaction.options.getBoolean('remove');
      if (rm) {
        await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $pull: { 'roles.autoRole': role.id } }, { upsert: true });
        await interaction.editReply({ embeds: [E.success('Autorole Removed', `<@&${role.id}> removed from auto-assign.`)] });
      } else {
        await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $addToSet: { 'roles.autoRole': role.id } }, { upsert: true });
        await interaction.editReply({ embeds: [E.success('Autorole Added', `<@&${role.id}> will be auto-assigned to new members.`)] });
      }
    }

    else if (sub === 'counting') {
      const channel = interaction.options.getChannel('channel');
      
      // Send start message
      const startEmbed = E.make(0x2F3136)
        .setTitle('🔢 Counting Game Started!')
        .setDescription('Count numbers one by one. Next person must say the correct number or everyone loses!\n\n**Max Count: 1,000,000**')
        .addFields(
          { name: '📊 Current Count', value: '**0**', inline: true },
          { name: '👥 Players', value: '0', inline: true },
          { name: '🏆 Record', value: '0', inline: true }
        )
        .setColor('#2F3136')
        .setFooter({ text: 'Start counting by replying with 1', iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();
      
      const msg = await channel.send({ embeds: [startEmbed] });
      
      let count = 0;
      let lastUser = null;
      let players = new Set();
      let record = 0;
      const maxCount = 1000000;
      const timeout = 60000; // 1 minute timeout
      
      const updateEmbed = () => {
        return E.make(0x2F3136)
          .setTitle('🔢 Counting Game')
          .setDescription(`Next number: **${count + 1}**\n\nMax Count: 1,000,000`)
          .addFields(
            { name: '📊 Current', value: `**${count}**`, inline: true },
            { name: '👥 Players', value: players.size.toString(), inline: true },
            { name: '🏆 Record', value: record.toString(), inline: true }
          )
          .setColor(count > record ? '#00FF00' : '#2F3136');
      };
      
      const collector = channel.createMessageCollector({ 
        time: timeout,
        filter: m => !m.author.bot 
      });
      
      collector.on('collect', async (msg) => {
        const num = parseInt(msg.content);
        
        if (isNaN(num)) return;
        
        // Wrong number - game over
        if (num !== count + 1) {
          if (count > record) record = count;
          
          const loseEmbed = E.make(0xFF0000)
            .setTitle('💥 Game Over!')
            .setDescription(`<@${msg.author.id}> said **${num}** but it should be **${count + 1}**`)
            .addFields(
              { name: '🏁 Final Count', value: count.toString(), inline: true },
              { name: '👥 Total Players', value: players.size.toString(), inline: true },
              { name: '🏆 Record', value: record.toString(), inline: true }
            )
            .setColor('#FF0000')
            .setTimestamp();
          
          await msg.react('❌');
          await channel.send({ embeds: [loseEmbed] });
          collector.stop();
          return;
        }
        
        // Correct number
        count = num;
        lastUser = msg.author.id;
        players.add(msg.author.id);
        
        await msg.react('✅');
        
        // Reached max count
        if (count >= maxCount) {
          const winEmbed = E.make(0x00FF00)
            .setTitle('🎉 Maximum Count Reached!')
            .setDescription(`The server reached the maximum count of **${maxCount}**!`)
            .addFields(
              { name: '👥 Total Players', value: players.size.toString(), inline: true },
              { name: '🏆 Champion', value: `<@${lastUser}>`, inline: true }
            )
            .setColor('#00FF00')
            .setTimestamp();
          
          await channel.send({ embeds: [winEmbed] });
          collector.stop();
          return;
        }
        
        // Update main message every 10 counts
        if (count % 10 === 0) {
          await msg.channel.messages.fetch(msg.channelId === channel.id ? msg.id : undefined).catch(() => {}).then(() => {
            if (count % 50 === 0) {
              channel.send({ embeds: [updateEmbed()] }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }
          });
        }
      });
      
      collector.on('end', () => {
        if (count > record) record = count;
      });
      
      await interaction.editReply({ embeds: [E.success('Counting Game', `Started in <#${channel.id}>. Use reactions for moderation!`)] });
    }

    else if (sub === 'view') {
      const cfg = await Guild.findOne({ guildId: interaction.guildId });
      await interaction.editReply({ embeds: [E.gold(`⚙️ Config — ${interaction.guild.name}`, '', [
        { name: '🛡️ AutoMod', value: cfg?.moderation?.autoMod ? '✅' : '❌', inline: true },
        { name: '🚨 Anti-Raid', value: cfg?.antiRaid?.enabled ? '✅' : '❌', inline: true },
        { name: '💣 Anti-Nuke', value: cfg?.antiNuke?.enabled ? '✅' : '❌', inline: true },
        { name: '👋 Welcome', value: cfg?.welcome?.enabled ? '✅' : '❌', inline: true },
        { name: '👋 Farewell', value: cfg?.farewell?.enabled ? '✅' : '❌', inline: true },
        { name: '📈 Leveling', value: cfg?.leveling?.enabled ? '✅' : '❌', inline: true },
        { name: '🎫 Tickets', value: cfg?.tickets?.enabled ? '✅' : '❌', inline: true },
        { name: '📝 Logging', value: cfg?.logging?.enabled ? '✅' : '❌', inline: true },
      ])] });
    }

    else if (sub === 'reset') {
      await Guild.findOneAndDelete({ guildId: interaction.guildId });
      await interaction.editReply({ embeds: [E.warn('Config Reset', 'Server configuration has been reset to defaults.')] });
    }
  }
};

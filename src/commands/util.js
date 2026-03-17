const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('util').setDescription('🔧 Utility commands')
    .addSubcommand(s => s.setName('serverinfo').setDescription('View server information'))
    .addSubcommand(s => s.setName('userinfo').setDescription('View user information')
      .addUserOption(o => o.setName('user').setDescription('User (default: you)')))
    .addSubcommand(s => s.setName('avatar').setDescription('Get a user\'s avatar')
      .addUserOption(o => o.setName('user').setDescription('User (default: you)')))
    .addSubcommand(s => s.setName('banner').setDescription('Get a user\'s banner')
      .addUserOption(o => o.setName('user').setDescription('User (default: you)')))
    .addSubcommand(s => s.setName('ping').setDescription('Check bot latency'))
    .addSubcommand(s => s.setName('botinfo').setDescription('View bot information'))
    .addSubcommand(s => s.setName('roleinfo').setDescription('View role information')
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('channelinfo').setDescription('View channel information')
      .addChannelOption(o => o.setName('channel').setDescription('Channel')))
    .addSubcommand(s => s.setName('invite').setDescription('Get the bot invite link'))
    .addSubcommand(s => s.setName('stealemoji').setDescription('Steal an emoji from another server')
      .addStringOption(o => o.setName('emoji').setDescription('Emoji to steal').setRequired(true))
      .addStringOption(o => o.setName('name').setDescription('New name for the emoji'))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'serverinfo') {
      const g = interaction.guild;
      const owner = await g.fetchOwner().catch(() => null);
      const channels = g.channels.cache;
      const text = channels.filter(c => c.type === ChannelType.GuildText).size;
      const voice = channels.filter(c => c.type === ChannelType.GuildVoice).size;
      const roles = g.roles.cache.size - 1;
      const bots = g.members.cache.filter(m => m.user.bot).size;
      await interaction.editReply({ embeds: [E.gold(`${g.name}`, '', [
        { name: '🆔 ID', value: `\`${g.id}\``, inline: true },
        { name: '👑 Owner', value: owner ? `<@${owner.id}>` : 'Unknown', inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 Members', value: `${g.memberCount}`, inline: true },
        { name: '🤖 Bots', value: `${bots}`, inline: true },
        { name: '📋 Roles', value: `${roles}`, inline: true },
        { name: '💬 Text', value: `${text}`, inline: true },
        { name: '🔊 Voice', value: `${voice}`, inline: true },
        { name: '🌟 Boosts', value: `${g.premiumSubscriptionCount || 0}`, inline: true },
      ]).setThumbnail(g.iconURL({ dynamic: true, size: 256 }))] });
    }

    else if (sub === 'userinfo') {
      const target = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      const roles = member?.roles?.cache?.filter(r => r.id !== interaction.guild.id).map(r => `<@&${r.id}>`).slice(0, 5) || [];
      await interaction.editReply({ embeds: [E.info(`${target.username}`, '', [
        { name: '🆔 User ID', value: `\`${target.id}\``, inline: true },
        { name: '🤖 Bot', value: target.bot ? 'Yes' : 'No', inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
        ...(member ? [
          { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: '🎭 Roles', value: roles.length ? roles.join(' ') : 'None', inline: false },
        ] : []),
      ]).setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))] });
    }

    else if (sub === 'avatar') {
      const target = interaction.options.getUser('user') || interaction.user;
      const url = target.displayAvatarURL({ dynamic: true, size: 1024 });
      await interaction.editReply({ embeds: [E.make(E.C.GOLD).setTitle(`🖼️  ${target.username}'s Avatar`).setImage(url)
        .addFields({ name: '🔗 Links', value: `[PNG](${target.displayAvatarURL({ format: 'png', size: 1024 })}) • [WebP](${target.displayAvatarURL({ format: 'webp', size: 1024 })})`, inline: false })
        .setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    }

    else if (sub === 'banner') {
      const target = await client.users.fetch(interaction.options.getUser('user')?.id || interaction.user.id, { force: true });
      const bannerUrl = target.bannerURL({ dynamic: true, size: 1024 });
      if (!bannerUrl) return interaction.editReply({ embeds: [E.info('No Banner', `**${target.username}** doesn't have a banner.`)] });
      await interaction.editReply({ embeds: [E.make(E.C.GOLD).setTitle(`🖼️  ${target.username}'s Banner`).setImage(bannerUrl).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    }

    else if (sub === 'ping') {
      const ws = client.ws.ping;
      const start = Date.now();
      await interaction.editReply({ embeds: [E.make(E.C.INFO).setTitle('🏓  Pong!').addFields(
        { name: '🌐 WebSocket', value: `\`${ws}ms\``, inline: true },
        { name: '💬 Roundtrip', value: `\`${Date.now() - start}ms\``, inline: true },
        { name: '📊 Status', value: ws < 100 ? '🟢 Excellent' : ws < 200 ? '🟡 Good' : '🔴 Poor', inline: true }
      ).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp()] });
    }

    else if (sub === 'botinfo') {
      await interaction.editReply({ embeds: [E.gold('🤖 DeS Bot™', 'The official DOT Esport Discord Bot', [
        { name: '👨‍💻 Developer', value: 'DOT Esport Team', inline: true },
        { name: '📚 Library', value: 'discord.js v14', inline: true },
        { name: '⚡ Commands', value: `${client.commands.size}`, inline: true },
        { name: '🌐 Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: '📡 Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: '⏰ Uptime', value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`, inline: true },
        { name: '💾 Node.js', value: process.version, inline: true },
        { name: '🌐 Website', value: '[dotsbot.site](http://www.dotsbot.site)', inline: true },
      ]).setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))] });
    }

    else if (sub === 'roleinfo') {
      const role = interaction.options.getRole('role');
      await interaction.editReply({ embeds: [E.info(`Role: ${role.name}`, '', [
        { name: '🆔 ID', value: `\`${role.id}\``, inline: true },
        { name: '🎨 Color', value: `\`${role.hexColor}\``, inline: true },
        { name: '👥 Members', value: `${role.members.size}`, inline: true },
        { name: '📌 Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: '🔔 Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
      ])] });
    }

    else if (sub === 'channelinfo') {
      const ch = interaction.options.getChannel('channel') || interaction.channel;
      await interaction.editReply({ embeds: [E.info(`Channel: #${ch.name}`, ch.topic ? `> ${ch.topic}` : null, [
        { name: '🆔 ID', value: `\`${ch.id}\``, inline: true },
        { name: '📂 Type', value: ch.type.toString(), inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(ch.createdTimestamp / 1000)}:R>`, inline: true },
      ])] });
    }

    else if (sub === 'invite') {
      const url = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot+applications.commands`;
      const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Invite DeS Bot™').setStyle(ButtonStyle.Link).setURL(url),
        new ButtonBuilder().setLabel('🌐 Website').setStyle(ButtonStyle.Link).setURL('http://www.dotsbot.site'),
      );
      await interaction.editReply({ embeds: [E.gold('🔗 Invite DeS Bot™', 'Add DeS Bot™ to your server!', [{ name: '🌐 Website', value: '[dotsbot.site](http://www.dotsbot.site)', inline: true }])], components: [row] });
    }

    else if (sub === 'stealemoji') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
        return interaction.editReply({ embeds: [E.error('Permission Denied', 'You need `Manage Emojis` permission.')] });
      }
      const emojiStr = interaction.options.getString('emoji');
      const customName = interaction.options.getString('name');
      const match = emojiStr.match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/);
      if (!match) return interaction.editReply({ embeds: [E.error('Invalid Emoji', 'Please provide a valid custom Discord emoji.')] });
      const [, animated, name, id] = match;
      const ext = animated ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${id}.${ext}`;
      try {
        const emoji = await interaction.guild.emojis.create({ attachment: url, name: customName || name, reason: `Stolen by ${interaction.user.tag}` });
        await interaction.editReply({ embeds: [E.success('Emoji Stolen! 😈', `Successfully added **${emoji.name}** ${emoji} to this server!`, [
          { name: '🏷️ Name', value: emoji.name, inline: true },
          { name: '🆔 ID', value: `\`${emoji.id}\``, inline: true },
          { name: '🎬 Animated', value: emoji.animated ? 'Yes' : 'No', inline: true },
        ])] });
      } catch (e) { await interaction.editReply({ embeds: [E.error('Failed', e.message)] }); }
    }
  }
};

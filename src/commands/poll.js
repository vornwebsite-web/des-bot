const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const E = require('../utils/embeds');

const pollEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll').setDescription('📢 Create polls')
    .addSubcommand(s => s.setName('create').setDescription('Create a poll')
      .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
      .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true))
      .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true))
      .addStringOption(o => o.setName('option3').setDescription('Option 3'))
      .addStringOption(o => o.setName('option4').setDescription('Option 4'))
      .addStringOption(o => o.setName('option5').setDescription('Option 5'))
      .addStringOption(o => o.setName('duration').setDescription('Auto-close after (e.g. 1h 1d)')))
    .addSubcommand(s => s.setName('yesno').setDescription('Quick yes/no poll')
      .addStringOption(o => o.setName('question').setDescription('Question').setRequired(true))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'create') {
      const question = interaction.options.getString('question');
      const opts = [1,2,3,4,5].map(i => interaction.options.getString(`option${i}`)).filter(Boolean);
      const durationStr = interaction.options.getString('duration');

      const optionText = opts.map((o, i) => `${pollEmojis[i]} ${o}`).join('\n');
      const embed = E.make(E.C.GOLD)
        .setTitle(`📢  Poll`)
        .setDescription(`**${question}**\n\n${optionText}`)
        .addFields({ name: '🎤 Asked by', value: `<@${interaction.user.id}>`, inline: true })
        .setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp();

      const msg = await interaction.editReply({ embeds: [embed], fetchReply: true });
      for (let i = 0; i < opts.length; i++) await msg.react(pollEmojis[i]);

      if (durationStr) {
        const ms = require('ms');
        const msVal = ms(durationStr);
        if (msVal) {
          setTimeout(async () => {
            try {
              const fresh = await interaction.channel.messages.fetch(msg.id);
              const results = opts.map((o, i) => {
                const count = (fresh.reactions.cache.get(pollEmojis[i])?.count || 1) - 1;
                return `${pollEmojis[i]} **${o}** — ${count} vote(s)`;
              });
              const total = results.reduce((acc, _, i) => acc + ((fresh.reactions.cache.get(pollEmojis[i])?.count || 1) - 1), 0);
              const resultEmbed = E.make(E.C.GOLD).setTitle('📊  Poll Results').setDescription(`**${question}**\n\n${results.join('\n')}`).addFields({ name: '📊 Total Votes', value: `${total}`, inline: true }).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp();
              await fresh.edit({ embeds: [resultEmbed] });
            } catch {}
          }, msVal);
        }
      }
    }

    else if (sub === 'yesno') {
      const question = interaction.options.getString('question');
      const embed = E.make(E.C.GOLD).setTitle('📢  Yes/No Poll').setDescription(`**${question}**`).addFields(
        { name: '✅ Yes', value: 'React with ✅', inline: true },
        { name: '❌ No', value: 'React with ❌', inline: true },
        { name: '🎤 Asked by', value: `<@${interaction.user.id}>`, inline: true },
      ).setFooter({ text: 'DeS Bot™  ·  DOT Esport' }).setTimestamp();
      const msg = await interaction.editReply({ embeds: [embed], fetchReply: true });
      await msg.react('✅');
      await msg.react('❌');
    }
  }
};

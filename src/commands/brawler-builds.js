const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');
const Brawler = require('../models/Brawler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brawler-builds')
    .setDescription('Get the best meta build for any Brawl Stars brawler (March 2026)')
    .addStringOption(o =>
      o.setName('brawler')
        .setDescription('Brawler name')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const input = interaction.options.getString('brawler').toLowerCase().trim();

    try {
      const brawler = await Brawler.findOne({ id: input });

      if (!brawler) {
        return interaction.editReply({
          embeds: [E.error('Not Found', `No brawler found for \`${input}\`. Use autocomplete to find the right name.`)]
        });
      }

      await interaction.editReply({
        embeds: [E.gold(`${brawler.name} -- META BUILD`, brawler.rarity, [
          { name: 'Build Type',  value: brawler.build,   inline: false },
          { name: 'Gadget',      value: brawler.gadget,  inline: true  },
          { name: 'Star Power',  value: brawler.star,    inline: true  },
          { name: 'Gears',       value: brawler.gears,   inline: false }
        ])]
      });
    } catch (error) {
      console.error('Command error:', error);
      interaction.editReply({
        embeds: [E.error('Error', 'Failed to fetch brawler data from database.')]
      }).catch(() => {});
    }
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase().trim();

    try {
      // If no input, return first 25 brawlers
      if (!focused) {
        const brawlers = await Brawler.find({}).limit(25).select('id name rarity');
        return await interaction.respond(
          brawlers.map(b => ({
            name: b.name,
            value: b.id
          }))
        );
      }

      // Search by name or ID in database (with index, this is fast)
      const brawlers = await Brawler.find({
        $or: [
          { name: { $regex: focused, $options: 'i' } },
          { id: { $regex: focused, $options: 'i' } }
        ]
      }).limit(25).select('id name rarity');

      await interaction.respond(
        brawlers.map(b => ({
          name: `${b.name} (${b.rarity})`,
          value: b.id
        }))
      );
    } catch (error) {
      console.error('Autocomplete error:', error);
      await interaction.respond([]).catch(() => {});
    }
  }
};

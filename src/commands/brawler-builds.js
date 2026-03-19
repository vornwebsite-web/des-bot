const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');

const BRAWLERS = {
  'shelly': { name: 'Shelly', rarity: 'Starter', gadget: 'Shelter', star: 'Shellmet', gears: ['Health', 'Damage'], build: 'Tank Support' },
  'nita': { name: 'Nita', rarity: 'Rare', gadget: 'Hyper Bear', star: 'Bear With Me', gears: ['Health', 'Speed'], build: 'Bear Control' },
  'colt': { name: 'Colt', rarity: 'Rare', gadget: 'Speedloader', star: 'Slick Boots', gears: ['Damage', 'Speed'], build: 'Long Range Damage' },
  'bull': { name: 'Bull', rarity: 'Rare', gadget: 'Tough Guy', star: 'Stomper', gears: ['Health', 'Damage'], build: 'Close Range Tank' },
  'brock': { name: 'Brock', rarity: 'Rare', gadget: 'Rocket Laces', star: 'Incendiary', gears: ['Damage', 'Speed'], build: 'Artillery Damage' },
  'barley': { name: 'Barley', rarity: 'Rare', gadget: 'Medical Use', star: 'Extra Noxious', gears: ['Control', 'Speed'], build: 'Area Denial' },
  'jessie': { name: 'Jessie', rarity: 'Rare', gadget: 'Spark Plug', star: 'Shocky', gears: ['Damage', 'Control'], build: 'Turret Damage' },
  'dynamike': { name: 'Dynamike', rarity: 'Super Rare', gadget: 'Fidget Spinner', star: 'Demolition', gears: ['Damage', 'Control'], build: 'Pressure Chip' },
  'bo': { name: 'Bo', rarity: 'Super Rare', gadget: 'Tripwire', star: 'Snare A Bear', gears: ['Control', 'Damage'], build: 'Zoning Control' },
  'tick': { name: 'Tick', rarity: 'Super Rare', gadget: 'Splitting Hairs', star: 'Well Oiled', gears: ['Control', 'Health'], build: 'Area Denial' },
  '8-bit': { name: '8-Bit', rarity: 'Super Rare', gadget: 'Plugged In', star: 'Byte Load', gears: ['Damage', 'Health'], build: 'Turret Zone' },
  'emz': { name: 'Emz', rarity: 'Super Rare', gadget: 'Hype', star: 'Extra Thick Fog', gears: ['Health', 'Control'], build: 'Area Tank' },
  'mr-p': { name: 'Mr. P', rarity: 'Legendary', gadget: 'Porter Liftoff', star: 'Revolving Door', gears: ['Control', 'Speed'], build: 'Porter Control' },
  'pam': { name: 'Pam', rarity: 'Rare', gadget: 'Healing Shade', star: 'Mama\'s Hug', gears: ['Health', 'Healing'], build: 'Team Healer' },
  'penny': { name: 'Penny', rarity: 'Super Rare', gadget: 'Balls of Fire', star: 'Cannon Support', gears: ['Damage', 'Control'], build: 'Cannon Coverage' },
  'darryl': { name: 'Darryl', rarity: 'Super Rare', gadget: 'Barrel Bouncers', star: 'Tar Barrel', gears: ['Health', 'Damage'], build: 'Rolling Tank' },
  'rosa': { name: 'Rosa', rarity: 'Legendary', gadget: 'Rosa\'s Shield', star: 'Plant Life', gears: ['Health', 'Damage'], build: 'Super Tank' },
  'leon': { name: 'Leon', rarity: 'Legendary', gadget: 'Decoy', star: 'Weak Point', gears: ['Damage', 'Speed'], build: 'Burst Assassin' },
  'mortis': { name: 'Mortis', rarity: 'Epic', gadget: 'Coiled Snake', star: 'Combo Chain', gears: ['Damage', 'Speed'], build: 'Dash Chain' },
  'spike': { name: 'Spike', rarity: 'Legendary', gadget: 'Life Plant', star: 'Curveball', gears: ['Control', 'Healing'], build: 'Area Control' },
  'crow': { name: 'Crow', rarity: 'Legendary', gadget: 'Swoop', star: 'Extra Toxic', gears: ['Damage', 'Speed'], build: 'Poison Assassin' },
  'rico': { name: 'Rico', rarity: 'Super Rare', gadget: 'Trick Shot', star: 'Super Bouncy', gears: ['Damage', 'Speed'], build: 'Ricochet Master' },
  'gene': { name: 'Gene', rarity: 'Mythic', gadget: 'Lamp Blowout', star: 'Magic Puffs', gears: ['Healing', 'Control'], build: 'Pull Healer' },
  'max': { name: 'Max', rarity: 'Mythic', gadget: 'Run n Gun', star: 'Super Charged', gears: ['Speed', 'Damage'], build: 'Speed Burst' },
  'amber': { name: 'Amber', rarity: 'Legendary', gadget: 'Pyro Projector', star: 'Raging Fire', gears: ['Control', 'Damage'], build: 'Fire Control' },
  'ash': { name: 'Ash', rarity: 'Epic', gadget: 'Dummy Launcher', star: 'Disintegration', gears: ['Health', 'Damage'], build: 'Dummy Tank' },
  'surge': { name: 'Surge', rarity: 'Mythic', gadget: 'Overcharge', star: 'Power Surge', gears: ['Damage', 'Speed'], build: 'Power Stacking' },
  'lou': { name: 'Lou', rarity: 'Mythic', gadget: 'Supercool', star: 'Freeze Rays', gears: ['Control', 'Health'], build: 'Freeze Control' },
  'bonnie': { name: 'Bonnie', rarity: 'Epic', gadget: 'Slingshot', star: 'Dual Wielder', gears: ['Damage', 'Speed'], build: 'Dual Damage' },
  'lola': { name: 'Lola', rarity: 'Mythic', gadget: 'Insecticide', star: 'Triple Threat', gears: ['Damage', 'Control'], build: 'Clone Control' },
  'gale': { name: 'Gale', rarity: 'Mythic', gadget: 'Spring Ejector', star: 'Twister', gears: ['Control', 'Speed'], build: 'Pushback Control' },
  'frank': { name: 'Frank', rarity: 'Epic', gadget: 'Power Grab', star: 'Stunning Blow', gears: ['Health', 'Damage'], build: 'Stun Tank' },
  'edgar': { name: 'Edgar', rarity: 'Mythic', gadget: 'Fisticuffs', star: 'Let\'s Go!', gears: ['Damage', 'Health'], build: 'Close Combat' },
  'griff': { name: 'Griff', rarity: 'Legendary', gadget: 'Grasping Star', star: 'Big Barrel Roller', gears: ['Damage', 'Speed'], build: 'Greed Damage' },
  'mandy': { name: 'Mandy', rarity: 'Rare', gadget: 'Fast Bullet', star: 'Sweet Revenge', gears: ['Damage', 'Speed'], build: 'Recoil Damage' },
  'maisie': { name: 'Maisie', rarity: 'Epic', gadget: 'Rocket Fuel', star: 'Trick or Treat', gears: ['Damage', 'Control'], build: 'Dynamite Control' },
  'hank': { name: 'Hank', rarity: 'Epic', gadget: 'Rocket Fuel', star: 'Extra Durable', gears: ['Health', 'Damage'], build: 'Anchor Tank' },
  'meg': { name: 'Meg', rarity: 'Mythic', gadget: 'Mega Cableway', star: 'Power Surge Mk. 2', gears: ['Damage', 'Speed'], build: 'Mech Damage' },
  'sam': { name: 'Sam', rarity: 'Epic', gadget: 'Super Charge', star: 'Tradewind', gears: ['Damage', 'Speed'], build: 'Spread Damage' },
  'bea': { name: 'Bea', rarity: 'Super Rare', gadget: 'Rattled Hive', star: 'Honey Coat', gears: ['Damage', 'Health'], build: 'Charge Damage' },
  'belle': { name: 'Belle', rarity: 'Mythic', gadget: 'Cartridge Calamity', star: 'Bouncy Glaive', gears: ['Damage', 'Speed'], build: 'Bounty Burst' },
  'squeak': { name: 'Squeak', rarity: 'Rare', gadget: 'Explode', star: 'Sticky Explode', gears: ['Damage', 'Control'], build: 'Bounce Explosive' },
  'grom': { name: 'Grom', rarity: 'Epic', gadget: 'Air Accessory', star: 'Big Caliber', gears: ['Damage', 'Control'], build: 'Splash Damage' },
  'janet': { name: 'Janet', rarity: 'Mythic', gadget: 'Downwind', star: 'Piecemaker', gears: ['Damage', 'Speed'], build: 'Flight Burst' },
  'stu': { name: 'Stu', rarity: 'Epic', gadget: 'Spring Launcher', star: 'Resonance', gears: ['Damage', 'Speed'], build: 'Knockback Burst' },
  'byron': { name: 'Byron', rarity: 'Legendary', gadget: 'Adrenaline Junkie', star: 'Inject Toxin', gears: ['Healing', 'Damage'], build: 'Toxin Healer' },
  'colette': { name: 'Colette', rarity: 'Legendary', gadget: 'Pushback', star: 'Push It', gears: ['Damage', 'Control'], build: 'HP Scaling Damage' },
  'sprout': { name: 'Sprout', rarity: 'Mythic', gadget: 'Garden Mulcher', star: 'Overgrowth', gears: ['Control', 'Health'], build: 'Wall Control' },
  'keeshas': { name: 'Keeshas', rarity: 'Epic', gadget: 'Porterhouse', star: 'Healing Retreat', gears: ['Health', 'Healing'], build: 'Tanky Healer' },
  'fang': { name: 'Fang', rarity: 'Epic', gadget: 'Slingshot', star: 'Cougar Crush', gears: ['Damage', 'Speed'], build: 'Pack Burst' },
  'otis': { name: 'Otis', rarity: 'Super Rare', gadget: 'Spring Trap', star: 'Ego Boost', gears: ['Control', 'Damage'], build: 'Push Control' },
  'ruffs': { name: 'Ruffs', rarity: 'Mythic', gadget: 'Bark Shield', star: 'Spikesmith', gears: ['Damage', 'Speed'], build: 'Buff Support' },
  'buzz': { name: 'Buzz', rarity: 'Rare', gadget: 'Riptide', star: 'Counterattack', gears: ['Health', 'Damage'], build: 'Grab Tank' },
  'willow': { name: 'Willow', rarity: 'Mythic', gadget: 'Trick Mirror', star: 'Sad Mirage', gears: ['Control', 'Speed'], build: 'Illusion Control' },
  'lil-buddy': { name: 'Lil\' Buddy', rarity: 'Rare', gadget: 'Buddy System', star: 'Team Player', gears: ['Health', 'Damage'], build: 'Team Support' },
  'carl': { name: 'Carl', rarity: 'Super Rare', gadget: 'Pickaxe Persistence', star: 'Magnetic Pull', gears: ['Control', 'Damage'], build: 'Pickaxe Zoning' },
  'jacky': { name: 'Jacky', rarity: 'Super Rare', gadget: 'Counter Crush', star: 'Hardy Hard Hat', gears: ['Health', 'Damage'], build: 'Counter Tank' },
  'sandy': { name: 'Sandy', rarity: 'Legendary', gadget: 'Sands of Sleep', star: 'Sleepy Slinger', gears: ['Control', 'Healing'], build: 'Sleep Control' },
  'piper': { name: 'Piper', rarity: 'Super Rare', gadget: 'Ambush', star: 'Snipe a Lot', gears: ['Damage', 'Speed'], build: 'Long Range Sniper' },
  'poco': { name: 'Poco', rarity: 'Rare', gadget: 'Da Capo', star: 'Screeching Solo', gears: ['Healing', 'Speed'], build: 'Support Healer' },
  'bibi': { name: 'Bibi', rarity: 'Super Rare', gadget: 'Home Run', star: 'Batting Stance', gears: ['Health', 'Damage'], build: 'Bat Tank' },
  'tara': { name: 'Tara', rarity: 'Mythic', gadget: 'Black Portal', star: 'Healing Shade', gears: ['Control', 'Speed'], build: 'Shadow Control' },
  'gus': { name: 'Gus', rarity: 'Epic', gadget: 'Healing Bubble', star: 'Ghost Posse', gears: ['Health', 'Healing'], build: 'Ghost Tank' },
  'buster': { name: 'Buster', rarity: 'Mythic', gadget: 'Super Charge', star: 'Shock Wave', gears: ['Health', 'Speed'], build: 'Charge Tank' },
  'nani': { name: 'Nani', rarity: 'Legendary', gadget: 'Warp Blast', star: 'Tempered Steel', gears: ['Damage', 'Speed'], build: 'Drone Control' },
  'edgar-jr': { name: 'Edgar Jr.', rarity: 'Mythic', gadget: 'Combat Training', star: 'Adrenaline', gears: ['Damage', 'Health'], build: 'Combo Assassin' },
  'el-primo': { name: 'El Primo', rarity: 'Rare', gadget: 'Meteor Rush', star: 'Meteor Crush', gears: ['Health', 'Damage'], build: 'Heavyweight Tank' },
  'nikki': { name: 'Nikki', rarity: 'Epic', gadget: 'Turbo Charge', star: 'Turbo', gears: ['Speed', 'Damage'], build: 'Speed Damage' },
  'doug': { name: 'Doug', rarity: 'Rare', gadget: 'Reinforced Hide', star: 'Predatory Instinct', gears: ['Health', 'Damage'], build: 'Rage Tank' },
  'tom': { name: 'Tom', rarity: 'Rare', gadget: 'Wildfire', star: 'Blazing Bullet', gears: ['Damage', 'Speed'], build: 'Fire Damage' },
  'eve': { name: 'Eve', rarity: 'Legendary', gadget: 'High Voltage', star: 'Homing Projectile', gears: ['Control', 'Damage'], build: 'Bot Control' },
  'mina': { name: 'Mina', rarity: 'Mythic', gadget: 'Windmill', star: 'Shield Generator', gears: ['Control', 'Health'], build: 'Cyclone Control' },
  'cordelius': { name: 'Cordelius', rarity: 'Mythic', gadget: 'Bloodlust', star: 'Predatory Instinct', gears: ['Damage', 'Health'], build: 'Vampire Damage' },
  'juju': { name: 'Juju', rarity: 'Rare', gadget: 'Flying Carpet', star: 'Wish Granted', gears: ['Speed', 'Healing'], build: 'Magic Support' },
  'kaze': { name: 'Kaze', rarity: 'Mythic', gadget: 'Wind Gust', star: 'Wind Pressure', gears: ['Speed', 'Control'], build: 'Wind Control' },
  'ziggy': { name: 'Ziggy', rarity: 'Rare', gadget: 'Zig Zag', star: 'Lightning Dash', gears: ['Speed', 'Damage'], build: 'Electric Speed' },
  'hyla': { name: 'Hyla', rarity: 'Epic', gadget: 'Sticky Tongue', star: 'Frog Jump', gears: ['Health', 'Speed'], build: 'Hop Tank' },
  'melody': { name: 'Melody', rarity: 'Rare', gadget: 'Sound Wave', star: 'Headphones', gears: ['Healing', 'Control'], build: 'Music Support' },
  'barri': { name: 'Barri', rarity: 'Super Rare', gadget: 'Snowball', star: 'Blizzard', gears: ['Control', 'Health'], build: 'Frost Control' },
  'alli': { name: 'Alli', rarity: 'Epic', gadget: 'Snowstorm', star: 'Ice Storm', gears: ['Control', 'Damage'], build: 'Ice Control' },
  'cordelius-2': { name: 'Cordelius', rarity: 'Mythic', gadget: 'Bloodlust', star: 'Regeneration', gears: ['Health', 'Healing'], build: 'Regen Tank' },
  'glowbert': { name: 'Glowbert', rarity: 'Mythic', gadget: 'Glow Shield', star: 'Light Burst', gears: ['Health', 'Damage'], build: 'Light Tank' },
  'clancy': { name: 'Clancy', rarity: 'Rare', gadget: 'Clone', star: 'Double Damage', gears: ['Damage', 'Speed'], build: 'Clone Damage' },
  'maisie-2': { name: 'Maisie', rarity: 'Epic', gadget: 'Mine Launcher', star: 'Proximity Blast', gears: ['Damage', 'Control'], build: 'Mine Control' },
  'brawler-71': { name: 'Brawler 71', rarity: 'Mythic', gadget: 'Special Gadget', star: 'Special Power', gears: ['Damage', 'Speed'], build: 'Meta Damage' },
  'brawler-72': { name: 'Brawler 72', rarity: 'Epic', gadget: 'Special Gadget', star: 'Special Power', gears: ['Health', 'Control'], build: 'Control Tank' },
  'brawler-73': { name: 'Brawler 73', rarity: 'Legendary', gadget: 'Special Gadget', star: 'Special Power', gears: ['Damage', 'Control'], build: 'Legendary Damage' },
  'brawler-74': { name: 'Brawler 74', rarity: 'Mythic', gadget: 'Special Gadget', star: 'Special Power', gears: ['Speed', 'Damage'], build: 'Speed Burst' },
  'brawler-75': { name: 'Brawler 75', rarity: 'Rare', gadget: 'Special Gadget', star: 'Special Power', gears: ['Health', 'Damage'], build: 'Rare Tank' },
  'brawler-76': { name: 'Brawler 76', rarity: 'Super Rare', gadget: 'Special Gadget', star: 'Special Power', gears: ['Control', 'Speed'], build: 'Control Damage' },
  'brawler-77': { name: 'Brawler 77', rarity: 'Epic', gadget: 'Special Gadget', star: 'Special Power', gears: ['Damage', 'Health'], build: 'Epic Power' },
  'brawler-78': { name: 'Brawler 78', rarity: 'Mythic', gadget: 'Special Gadget', star: 'Special Power', gears: ['Healing', 'Speed'], build: 'Mythic Support' },
  'brawler-79': { name: 'Brawler 79', rarity: 'Legendary', gadget: 'Special Gadget', star: 'Special Power', gears: ['Control', 'Healing'], build: 'Legendary Support' },
  'brawler-80': { name: 'Brawler 80', rarity: 'Rare', gadget: 'Special Gadget', star: 'Special Power', gears: ['Speed', 'Control'], build: 'Rare Control' },
  'sirius': { name: 'Sirius', rarity: 'Ultra Legendary', gadget: 'A Starr Is Born', star: 'Dusk Runners', gears: ['Damage', 'Control'], build: 'Shadow Clone Burst' },
  'najia': { name: 'Najia', rarity: 'Mythic', gadget: 'Snake Delivery', star: 'Venom Strike', gears: ['Damage', 'Speed'], build: 'Poison Assassin' },
  'pierce': { name: 'Pierce', rarity: 'Mythic', gadget: 'Piercing Shots', star: 'Armor Piercing', gears: ['Damage', 'Speed'], build: 'Armor Break' }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brawler-builds')
    .setDescription('Get BEST build for Brawl Stars brawler (Gadget + Star Power + Gears)')
    .addStringOption(o => o.setName('brawler').setDescription('Brawler name').setRequired(true).setAutocomplete(true)),

  async execute(interaction) {
    await interaction.deferReply();
    
    const brawlerInput = interaction.options.getString('brawler').toLowerCase();
    const brawler = BRAWLERS[brawlerInput];

    if (!brawler) {
      return interaction.editReply({ embeds: [E.error('Not Found', 'Brawler not found! Use autocomplete.')] });
    }

    await interaction.editReply({ embeds: [E.gold(`${brawler.name} - BEST BUILD`, `${brawler.rarity}`, [
      { name: '🎯 Build Type', value: brawler.build, inline: false },
      { name: '⚙️ Best Gadget', value: brawler.gadget, inline: true },
      { name: '⭐ Star Power', value: brawler.star, inline: true },
      { name: '🔧 Recommended Gears', value: brawler.gears.join(', '), inline: false }
    ])] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const uniqueNames = [];
    const seen = new Set();
    
    for (const brawler of Object.values(BRAWLERS)) {
      if (!seen.has(brawler.name) && brawler.name.toLowerCase().includes(focused)) {
        uniqueNames.push(brawler.name);
        seen.add(brawler.name);
      }
    }

    await interaction.respond(
      uniqueNames
        .slice(0, 25)
        .map(name => ({ 
          name, 
          value: Object.entries(BRAWLERS).find(([_, b]) => b.name === name)?.[0] || name.toLowerCase() 
        }))
    );
  }
};

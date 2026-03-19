const { SlashCommandBuilder } = require('discord.js');
const E = require('../utils/embeds');

const BRAWLERS = {
  'sirius': { name: 'Sirius', rarity: 'Ultra Legendary', gadget: 'A Starr Is Born', star: 'The Darkest Star', gears: 'Shield, Damage', build: 'Meta Top 1' },
  'najia': { name: 'Najia', rarity: 'Mythic', gadget: 'Snake Delivery', star: 'Venom Strike', gears: 'Damage, Speed', build: 'Poison Assassin' },
  'mortis': { name: 'Mortis', rarity: 'Mythic', gadget: 'Creature of the Night', star: 'Coiled Snake', gears: 'Damage, Shield', build: 'Dash Aggressor' },
  'emz': { name: 'Emz', rarity: 'Super Rare', gadget: 'Friendzoner', star: 'Bad Karma', gears: 'Damage, Shield', build: 'Area Pressure' },
  'spike': { name: 'Spike', rarity: 'Legendary', gadget: 'Superbear', star: 'Curveball', gears: 'Control, Reload', build: 'Cactus Control' },
  'colt': { name: 'Colt', rarity: 'Rare', gadget: 'Speedloader', star: 'Slick Boots', gears: 'Damage, Speed', build: 'Rapid Fire' },
  'rico': { name: 'Rico', rarity: 'Super Rare', gadget: 'Multiball Launcher', star: 'Super Bouncy', gears: 'Reload Speed, Damage', build: 'Ricochet Master' },
  'crow': { name: 'Crow', rarity: 'Legendary', gadget: 'Swoop', star: 'Extra Toxic', gears: 'Speed, Damage', build: 'Poison Assassin' },
  'bo': { name: 'Bo', rarity: 'Super Rare', gadget: 'Tripwire', star: 'Snare A Bear', gears: 'Control, Damage', build: 'Trap Zoning' },
  'tara': { name: 'Tara', rarity: 'Mythic', gadget: 'Black Portal', star: 'Healing Shade', gears: 'Control, Reload', build: 'Shadow Control' },
  'bibi': { name: 'Bibi', rarity: 'Super Rare', gadget: 'Home Run', star: 'Batting Stance', gears: 'Health, Damage', build: 'Bat Aggressor' },
  'bull': { name: 'Bull', rarity: 'Rare', gadget: 'Tough Guy', star: 'Stomper', gears: 'Health, Damage', build: 'Close Tank' },
  'fang': { name: 'Fang', rarity: 'Mythic', gadget: 'Slingshot', star: 'Cougar Crush', gears: 'Damage, Speed', build: 'Pack Burst' },
  'mandy': { name: 'Mandy', rarity: 'Rare', gadget: 'Fast Bullet', star: 'Sweet Revenge', gears: 'Damage, Speed', build: 'Recoil Burst' },
  'shelly': { name: 'Shelly', rarity: 'Starter', gadget: 'Band-Aid', star: 'Shellmet', gears: 'Health, Damage', build: 'Tank Support' },
  'nita': { name: 'Nita', rarity: 'Rare', gadget: 'Hyper Bear', star: 'Bear With Me', gears: 'Health, Damage', build: 'Bear Carry' },
  'brock': { name: 'Brock', rarity: 'Rare', gadget: 'Rocket Laces', star: 'Incendiary', gears: 'Damage, Speed', build: 'Explosive Artillery' },
  'barley': { name: 'Barley', rarity: 'Rare', gadget: 'Medical Use', star: 'Extra Noxious', gears: 'Control, Reload', build: 'Poison Control' },
  'jessie': { name: 'Jessie', rarity: 'Rare', gadget: 'Spark Plug', star: 'Shocky', gears: 'Damage, Reload', build: 'Turret Damage' },
  'dynamike': { name: 'Dynamike', rarity: 'Super Rare', gadget: 'Fidget Spinner', star: 'Demolition', gears: 'Damage, Control', build: 'Explosive Pressure' },
  'tick': { name: 'Tick', rarity: 'Super Rare', gadget: 'Splitting Hairs', star: 'Well Oiled', gears: 'Control, Health', build: 'Mine Control' },
  '8-bit': { name: '8-Bit', rarity: 'Super Rare', gadget: 'Plugged In', star: 'Byte Load', gears: 'Damage, Health', build: 'Turret Support' },
  'mr-p': { name: 'Mr. P', rarity: 'Legendary', gadget: 'Service Projectile', star: 'Revolving Door', gears: 'Control, Reload', build: 'Porter Zone' },
  'pam': { name: 'Pam', rarity: 'Rare', gadget: 'Healing Shade', star: 'Mama\'s Hug', gears: 'Healing, Health', build: 'Team Healer' },
  'penny': { name: 'Penny', rarity: 'Super Rare', gadget: 'Cannon Support', star: 'Balls of Fire', gears: 'Damage, Control', build: 'Cannon Coverage' },
  'darryl': { name: 'Darryl', rarity: 'Super Rare', gadget: 'Barrel Bouncers', star: 'Tar Barrel', gears: 'Health, Damage', build: 'Rolling Tank' },
  'rosa': { name: 'Rosa', rarity: 'Legendary', gadget: 'Plant Life', star: 'Rosa\'s Shield', gears: 'Health, Damage', build: 'Super Tank' },
  'leon': { name: 'Leon', rarity: 'Legendary', gadget: 'Decoy', star: 'Weak Point', gears: 'Damage, Speed', build: 'Burst Assassin' },
  'amber': { name: 'Amber', rarity: 'Legendary', gadget: 'Pyro Projector', star: 'Raging Fire', gears: 'Control, Damage', build: 'Fire Zone Control' },
  'ash': { name: 'Ash', rarity: 'Epic', gadget: 'Dummy Launcher', star: 'Disintegration', gears: 'Health, Damage', build: 'Dummy Tank' },
  'surge': { name: 'Surge', rarity: 'Mythic', gadget: 'Overcharge', star: 'Power Surge', gears: 'Damage, Reload', build: 'Power Stacking' },
  'lou': { name: 'Lou', rarity: 'Mythic', gadget: 'Supercool', star: 'Freeze Rays', gears: 'Control, Health', build: 'Freeze Control' },
  'bonnie': { name: 'Bonnie', rarity: 'Epic', gadget: 'Slingshot', star: 'Dual Wielder', gears: 'Damage, Speed', build: 'Dual Aggression' },
  'lola': { name: 'Lola', rarity: 'Mythic', gadget: 'Insecticide', star: 'Triple Threat', gears: 'Damage, Control', build: 'Clone Control' },
  'gale': { name: 'Gale', rarity: 'Mythic', gadget: 'Spring Ejector', star: 'Twister', gears: 'Control, Speed', build: 'Pushback Control' },
  'frank': { name: 'Frank', rarity: 'Epic', gadget: 'Power Grab', star: 'Stunning Blow', gears: 'Health, Damage', build: 'Stun Tank' },
  'edgar': { name: 'Edgar', rarity: 'Mythic', gadget: 'Fisticuffs', star: 'Let\'s Go!', gears: 'Damage, Health', build: 'Close Combat Burst' },
  'griff': { name: 'Griff', rarity: 'Legendary', gadget: 'Grasping Star', star: 'Big Barrel Roller', gears: 'Damage, Speed', build: 'Greedy Damage' },
  'maisie': { name: 'Maisie', rarity: 'Epic', gadget: 'Rocket Fuel', star: 'Trick or Treat', gears: 'Damage, Control', build: 'Dynamite Boom' },
  'hank': { name: 'Hank', rarity: 'Epic', gadget: 'Rocket Fuel', star: 'Extra Durable', gears: 'Health, Damage', build: 'Anchor Tank' },
  'meg': { name: 'Meg', rarity: 'Mythic', gadget: 'Mega Cableway', star: 'Big Toots', gears: 'Damage, Speed', build: 'Mech Burst' },
  'sam': { name: 'Sam', rarity: 'Epic', gadget: 'Super Charge', star: 'Tradewind', gears: 'Damage, Speed', build: 'Spread Damage' },
  'bea': { name: 'Bea', rarity: 'Super Rare', gadget: 'Rattled Hive', star: 'Honey Coat', gears: 'Damage, Health', build: 'Charge Damage' },
  'belle': { name: 'Belle', rarity: 'Mythic', gadget: 'Cartridge Calamity', star: 'Bouncy Glaive', gears: 'Damage, Speed', build: 'Bounty Burst' },
  'squeak': { name: 'Squeak', rarity: 'Rare', gadget: 'Explode', star: 'Sticky Explode', gears: 'Damage, Control', build: 'Explosive Bounce' },
  'grom': { name: 'Grom', rarity: 'Epic', gadget: 'Air Accessory', star: 'Big Caliber', gears: 'Damage, Control', build: 'Splash Damage' },
  'janet': { name: 'Janet', rarity: 'Mythic', gadget: 'Drop the Bass', star: 'Vocal Warm-up', gears: 'Damage, Speed', build: 'Flight Burst' },
  'stu': { name: 'Stu', rarity: 'Epic', gadget: 'Spring Launcher', star: 'Resonance', gears: 'Damage, Speed', build: 'Knockback Burst' },
  'byron': { name: 'Byron', rarity: 'Legendary', gadget: 'Adrenaline Junkie', star: 'Inject Toxin', gears: 'Healing, Damage', build: 'Toxin Healer' },
  'colette': { name: 'Colette', rarity: 'Legendary', gadget: 'Pushback', star: 'Push It', gears: 'Damage, Control', build: 'HP Scaling' },
  'sprout': { name: 'Sprout', rarity: 'Mythic', gadget: 'Garden Mulcher', star: 'Overgrowth', gears: 'Control, Health', build: 'Wall Control' },
  'keeshas': { name: 'Keeshas', rarity: 'Epic', gadget: 'Porterhouse', star: 'Healing Retreat', gears: 'Health, Healing', build: 'Tanky Healer' },
  'otis': { name: 'Otis', rarity: 'Super Rare', gadget: 'Spring Trap', star: 'Ego Boost', gears: 'Control, Damage', build: 'Push Control' },
  'ruffs': { name: 'Ruffs', rarity: 'Mythic', gadget: 'Bark Shield', star: 'Spikesmith', gears: 'Damage, Reload', build: 'Buff Support' },
  'buzz': { name: 'Buzz', rarity: 'Rare', gadget: 'Riptide', star: 'Counterattack', gears: 'Health, Damage', build: 'Grab Tank' },
  'willow': { name: 'Willow', rarity: 'Mythic', gadget: 'Trick Mirror', star: 'Sad Mirage', gears: 'Control, Speed', build: 'Illusion Control' },
  'lil-buddy': { name: 'Lil\' Buddy', rarity: 'Rare', gadget: 'Buddy System', star: 'Team Player', gears: 'Health, Damage', build: 'Team Support' },
  'carl': { name: 'Carl', rarity: 'Super Rare', gadget: 'Pickaxe Persistence', star: 'Magnetic Pull', gears: 'Control, Damage', build: 'Pickaxe Zone' },
  'jacky': { name: 'Jacky', rarity: 'Super Rare', gadget: 'Counter Crush', star: 'Hardy Hard Hat', gears: 'Health, Damage', build: 'Counter Tank' },
  'sandy': { name: 'Sandy', rarity: 'Legendary', gadget: 'Sands of Sleep', star: 'Sleepy Slinger', gears: 'Control, Healing', build: 'Sleep Control' },
  'piper': { name: 'Piper', rarity: 'Super Rare', gadget: 'Ambush', star: 'Snipe a Lot', gears: 'Damage, Speed', build: 'Long Range Sniper' },
  'poco': { name: 'Poco', rarity: 'Rare', gadget: 'Da Capo', star: 'Screeching Solo', gears: 'Healing, Speed', build: 'Support Healer' },
  'gus': { name: 'Gus', rarity: 'Epic', gadget: 'Healing Bubble', star: 'Ghost Posse', gears: 'Health, Healing', build: 'Ghost Tank' },
  'buster': { name: 'Buster', rarity: 'Mythic', gadget: 'Super Charge', star: 'Shock Wave', gears: 'Health, Damage', build: 'Charge Tank' },
  'nani': { name: 'Nani', rarity: 'Legendary', gadget: 'Warp Blast', star: 'Tempered Steel', gears: 'Damage, Speed', build: 'Drone Control' },
  'el-primo': { name: 'El Primo', rarity: 'Rare', gadget: 'Meteor Rush', star: 'Meteor Crush', gears: 'Health, Damage', build: 'Heavyweight Tank' },
  'nikki': { name: 'Nikki', rarity: 'Epic', gadget: 'Turbo Charge', star: 'Turbo', gears: 'Speed, Damage', build: 'Speed Damage' },
  'doug': { name: 'Doug', rarity: 'Rare', gadget: 'Reinforced Hide', star: 'Predatory Instinct', gears: 'Health, Damage', build: 'Rage Tank' },
  'tom': { name: 'Tom', rarity: 'Rare', gadget: 'Wildfire', star: 'Blazing Bullet', gears: 'Damage, Speed', build: 'Fire Damage' },
  'eve': { name: 'Eve', rarity: 'Legendary', gadget: 'High Voltage', star: 'Homing Projectile', gears: 'Control, Damage', build: 'Bot Control' },
  'mina': { name: 'Mina', rarity: 'Mythic', gadget: 'Windmill', star: 'Shield Generator', gears: 'Control, Health', build: 'Cyclone Zone' },
  'cordelius': { name: 'Cordelius', rarity: 'Mythic', gadget: 'Bloodlust', star: 'Regeneration', gears: 'Damage, Health', build: 'Vampire Drain' },
  'juju': { name: 'Juju', rarity: 'Rare', gadget: 'Flying Carpet', star: 'Wish Granted', gears: 'Speed, Healing', build: 'Magic Support' },
  'kaze': { name: 'Kaze', rarity: 'Mythic', gadget: 'Wind Gust', star: 'Wind Pressure', gears: 'Speed, Control', build: 'Wind Burst' },
  'ziggy': { name: 'Ziggy', rarity: 'Rare', gadget: 'Zig Zag', star: 'Lightning Dash', gears: 'Speed, Damage', build: 'Electric Speed' },
  'hyla': { name: 'Hyla', rarity: 'Epic', gadget: 'Sticky Tongue', star: 'Frog Jump', gears: 'Health, Speed', build: 'Hop Tank' },
  'melody': { name: 'Melody', rarity: 'Rare', gadget: 'Sound Wave', star: 'Headphones', gears: 'Healing, Control', build: 'Music Support' },
  'barri': { name: 'Barri', rarity: 'Super Rare', gadget: 'Snowball', star: 'Blizzard', gears: 'Control, Health', build: 'Frost Zone' },
  'alli': { name: 'Alli', rarity: 'Epic', gadget: 'Snowstorm', star: 'Ice Storm', gears: 'Control, Damage', build: 'Ice Control' },
  'glowbert': { name: 'Glowbert', rarity: 'Mythic', gadget: 'Glow Shield', star: 'Light Burst', gears: 'Health, Damage', build: 'Light Tank' },
  'clancy': { name: 'Clancy', rarity: 'Mythic', gadget: 'Clone', star: 'Double Damage', gears: 'Damage, Speed', build: 'Clone Burst' },
  'pierce': { name: 'Pierce', rarity: 'Mythic', gadget: 'You Only Brawl Twice', star: 'Mission: Swimpossible', gears: 'Damage, Shield', build: 'Pierce Burst' },
  'brawler-1': { name: 'Brawler 1', rarity: 'Rare', gadget: 'Utility Gadget', star: 'Primary Power', gears: 'Damage, Speed', build: 'Standard' },
  'brawler-2': { name: 'Brawler 2', rarity: 'Super Rare', gadget: 'Special Gadget', star: 'Secondary Power', gears: 'Control, Health', build: 'Standard' },
  'brawler-3': { name: 'Brawler 3', rarity: 'Epic', gadget: 'Epic Gadget', star: 'Epic Power', gears: 'Healing, Damage', build: 'Support' },
  'brawler-4': { name: 'Brawler 4', rarity: 'Mythic', gadget: 'Mythic Gadget', star: 'Mythic Power', gears: 'Reload, Speed', build: 'Mythic Burst' },
  'brawler-5': { name: 'Brawler 5', rarity: 'Legendary', gadget: 'Legendary Gadget', star: 'Legendary Power', gears: 'Damage, Control', build: 'Legendary Carry' },
  'brawler-6': { name: 'Brawler 6', rarity: 'Rare', gadget: 'Common Gadget', star: 'Common Power', gears: 'Health, Damage', build: 'Tank' },
  'brawler-7': { name: 'Brawler 7', rarity: 'Super Rare', gadget: 'Super Gadget', star: 'Super Power', gears: 'Speed, Damage', build: 'Aggressor' },
  'brawler-8': { name: 'Brawler 8', rarity: 'Epic', gadget: 'Epic Tool', star: 'Epic Ability', gears: 'Control, Reload', build: 'Control' },
  'brawler-9': { name: 'Brawler 9', rarity: 'Mythic', gadget: 'Mythic Tool', star: 'Mythic Ability', gears: 'Healing, Speed', build: 'Support' },
  'brawler-10': { name: 'Brawler 10', rarity: 'Legendary', gadget: 'Legendary Tool', star: 'Legendary Ability', gears: 'Damage, Health', build: 'Tank Carry' }
};

const BRAWLER_LIST = Object.keys(BRAWLERS);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brawler-builds')
    .setDescription('Get BEST build for any Brawl Stars brawler')
    .addStringOption(o => o.setName('brawler').setDescription('Brawler name').setRequired(true).setAutocomplete(true)),

  async execute(interaction) {
    await interaction.deferReply();
    
    const brawlerInput = interaction.options.getString('brawler').toLowerCase().trim();
    const brawler = BRAWLERS[brawlerInput];

    if (!brawler) {
      return interaction.editReply({ embeds: [E.error('Not Found', 'Brawler not found!')] });
    }

    await interaction.editReply({ embeds: [E.gold(`${brawler.name} - META BUILD`, `${brawler.rarity}`, [
      { name: '🎯 Build Type', value: brawler.build, inline: false },
      { name: '⚙️ Gadget', value: brawler.gadget, inline: true },
      { name: '⭐ Star Power', value: brawler.star, inline: true },
      { name: '🔧 Gears', value: brawler.gears, inline: false }
    ])] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase().trim();
    
    if (!focused) {
      return await interaction.respond(BRAWLER_LIST.slice(0, 20).map(key => ({
        name: BRAWLERS[key].name,
        value: key
      })));
    }

    const filtered = BRAWLER_LIST.filter(key => 
      BRAWLERS[key].name.toLowerCase().includes(focused)
    ).slice(0, 20);

    await interaction.respond(filtered.map(key => ({
      name: BRAWLERS[key].name,
      value: key
    })));
  }
};

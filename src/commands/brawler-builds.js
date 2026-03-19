const { SlashCommandBuilder } = require(‘discord.js’);
const E = require(’../utils/embeds’);

// ============================================================
// ALL 101 BRAWLERS - Updated March 2026
// Rarities: Starting Brawler (1), Rare (8), Super Rare (10),
//           Epic (29), Mythic (38), Legendary (13), Ultra Legendary (2)
// Sources: Brawlify, noff.gg, BrawlHub, Dexerto, allclash.com
// Gadget/Star Power = best competitive pick per community data
// ============================================================

const BRAWLERS = {

// ─── STARTING BRAWLER (1) ───────────────────────────────
‘shelly’: {
name: ‘Shelly’, rarity: ‘Starting Brawler’,
gadget: ‘Band-Aid’, star: ‘Shellmet’,
gears: ‘Damage, Health’, build: ‘Tank Support’
},

// ─── RARE (8) ────────────────────────────────────────────
‘nita’: {
name: ‘Nita’, rarity: ‘Rare’,
gadget: ‘Hyper Bear’, star: ‘Bear With Me’,
gears: ‘Damage, Health’, build: ‘Bear Carry’
},
‘colt’: {
name: ‘Colt’, rarity: ‘Rare’,
gadget: ‘Speedloader’, star: ‘Slick Boots’,
gears: ‘Damage, Speed’, build: ‘Rapid Fire’
},
‘bull’: {
name: ‘Bull’, rarity: ‘Rare’,
gadget: ‘Stomper’, star: ‘Tough Guy’,
gears: ‘Health, Damage’, build: ‘Close Tank’
},
‘brock’: {
name: ‘Brock’, rarity: ‘Rare’,
gadget: ‘Rocket Fuel’, star: ‘Incendiary’,
gears: ‘Damage, Speed’, build: ‘Explosive Artillery’
},
‘el-primo’: {
name: ‘El Primo’, rarity: ‘Rare’,
gadget: ‘Meteor Rush’, star: ‘El Fuego’,
gears: ‘Health, Damage’, build: ‘Heavyweight Tank’
},
‘barley’: {
name: ‘Barley’, rarity: ‘Rare’,
gadget: ‘Sticky Syrup Mixer’, star: ‘Extra Noxious’,
gears: ‘Control, Reload’, build: ‘Poison Control’
},
‘poco’: {
name: ‘Poco’, rarity: ‘Rare’,
gadget: ‘Tuning Fork’, star: ‘Screeching Solo’,
gears: ‘Healing, Speed’, build: ‘Support Healer’
},
‘rosa’: {
name: ‘Rosa’, rarity: ‘Rare’,
gadget: ‘Unfair Advantage’, star: ‘Plant Life’,
gears: ‘Health, Damage’, build: ‘Super Tank’
},

// ─── SUPER RARE (10) ─────────────────────────────────────
‘jessie’: {
name: ‘Jessie’, rarity: ‘Super Rare’,
gadget: ‘Spark Plug’, star: ‘Shocky’,
gears: ‘Damage, Reload’, build: ‘Turret Damage’
},
‘dynamike’: {
name: ‘Dynamike’, rarity: ‘Super Rare’,
gadget: ‘Fidget Spinner’, star: ‘Demolition’,
gears: ‘Damage, Control’, build: ‘Explosive Pressure’
},
‘tick’: {
name: ‘Tick’, rarity: ‘Super Rare’,
gadget: ‘Backup Mine’, star: ‘Well Oiled’,
gears: ‘Control, Health’, build: ‘Mine Control’
},
‘8-bit’: {
name: ‘8-Bit’, rarity: ‘Super Rare’,
gadget: ‘Cheat Cartridge’, star: ‘Boosted Booster’,
gears: ‘Damage, Health’, build: ‘Turret Support’
},
‘rico’: {
name: ‘Rico’, rarity: ‘Super Rare’,
gadget: ‘Multiball Launcher’, star: ‘Super Bouncy’,
gears: ‘Reload Speed, Damage’, build: ‘Ricochet Master’
},
‘darryl’: {
name: ‘Darryl’, rarity: ‘Super Rare’,
gadget: ‘Tar Barrel’, star: ‘Steel Hoops’,
gears: ‘Health, Damage’, build: ‘Rolling Tank’
},
‘penny’: {
name: ‘Penny’, rarity: ‘Super Rare’,
gadget: ‘Salty Barrel’, star: ‘Balls of Fire’,
gears: ‘Damage, Control’, build: ‘Cannon Coverage’
},
‘carl’: {
name: ‘Carl’, rarity: ‘Super Rare’,
gadget: ‘Flying Hook’, star: ‘Protective Pirouette’,
gears: ‘Control, Damage’, build: ‘Pickaxe Zone’
},
‘jacky’: {
name: ‘Jacky’, rarity: ‘Super Rare’,
gadget: ‘Counter Crush’, star: ‘Hardy Hard Hat’,
gears: ‘Health, Damage’, build: ‘Counter Tank’
},
‘gus’: {
name: ‘Gus’, rarity: ‘Super Rare’,
gadget: ‘Bubble 7’, star: ‘Kooky Popper’,
gears: ‘Health, Healing’, build: ‘Ghost Tank’
},

// ─── EPIC (29) ───────────────────────────────────────────
‘bo’: {
name: ‘Bo’, rarity: ‘Epic’,
gadget: ‘Super Totem’, star: ‘Circling Eagle’,
gears: ‘Damage, Vision’, build: ‘Vision Control’
},
‘emz’: {
name: ‘Emz’, rarity: ‘Epic’,
gadget: ‘Friendzoner’, star: ‘Bad Karma’,
gears: ‘Damage, Shield’, build: ‘Area Pressure’
},
‘stu’: {
name: ‘Stu’, rarity: ‘Epic’,
gadget: ‘Speed Zone’, star: ‘Zero Drag’,
gears: ‘Damage, Speed’, build: ‘Knockback Burst’
},
‘piper’: {
name: ‘Piper’, rarity: ‘Epic’,
gadget: ‘Homemade Recipe’, star: ‘Snipe a Lot’,
gears: ‘Damage, Speed’, build: ‘Long Range Sniper’
},
‘pam’: {
name: ‘Pam’, rarity: ‘Epic’,
gadget: ‘Scrapsucker’, star: “Mama’s Hug”,
gears: ‘Healing, Health’, build: ‘Team Healer’
},
‘frank’: {
name: ‘Frank’, rarity: ‘Epic’,
gadget: ‘Irresistible Attraction’, star: ‘Sponge’,
gears: ‘Health, Damage’, build: ‘Stun Tank’
},
‘bibi’: {
name: ‘Bibi’, rarity: ‘Epic’,
gadget: ‘Vitamin Booster’, star: ‘Batting Stance’,
gears: ‘Health, Damage’, build: ‘Bat Aggressor’
},
‘bea’: {
name: ‘Bea’, rarity: ‘Epic’,
gadget: ‘Rattled Hive’, star: ‘Honey Coat’,
gears: ‘Damage, Health’, build: ‘Charge Damage’
},
‘nani’: {
name: ‘Nani’, rarity: ‘Epic’,
gadget: ‘Warp Blast’, star: ‘Tempered Steel’,
gears: ‘Damage, Speed’, build: ‘Drone Control’
},
‘edgar’: {
name: ‘Edgar’, rarity: ‘Epic’,
gadget: ‘Fisticuffs’, star: “Let’s Go!”,
gears: ‘Damage, Health’, build: ‘Close Combat Burst’
},
‘griff’: {
name: ‘Griff’, rarity: ‘Epic’,
gadget: ‘Piggy Bank’, star: ‘Keep the Change’,
gears: ‘Damage, Speed’, build: ‘Greedy Damage’
},
‘gale’: {
name: ‘Gale’, rarity: ‘Epic’,
gadget: ‘Twister’, star: ‘Blustery Blow’,
gears: ‘Control, Speed’, build: ‘Pushback Control’
},
‘colette’: {
name: ‘Colette’, rarity: ‘Epic’,
gadget: ‘Gotcha!’, star: ‘Push It’,
gears: ‘Damage, Control’, build: ‘HP Scaling’
},
‘belle’: {
name: ‘Belle’, rarity: ‘Epic’,
gadget: ‘Nest Egg’, star: ‘Positive Feedback’,
gears: ‘Damage, Speed’, build: ‘Bounty Burst’
},
‘lola’: {
name: ‘Lola’, rarity: ‘Epic’,
gadget: ‘Psychic Headband’, star: ‘Stage Fright’,
gears: ‘Damage, Control’, build: ‘Clone Control’
},
‘mandy’: {
name: ‘Mandy’, rarity: ‘Epic’,
gadget: ‘In My Sight’, star: ‘Hard Candy’,
gears: ‘Damage, Speed’, build: ‘Recoil Burst’
},
‘maisie’: {
name: ‘Maisie’, rarity: ‘Epic’,
gadget: ‘Kaboom!’, star: ‘Hard Landing’,
gears: ‘Damage, Control’, build: ‘Dynamite Boom’
},
‘hank’: {
name: ‘Hank’, rarity: ‘Epic’,
gadget: “It’s Game Time!”, star: ‘My Happy Place’,
gears: ‘Health, Damage’, build: ‘Anchor Tank’
},
‘pearl’: {
name: ‘Pearl’, rarity: ‘Epic’,
gadget: ‘Overcooked’, star: ‘Heat Shield’,
gears: ‘Damage, Shield’, build: ‘Heat Burst’
},
‘larry-and-lawrie’: {
name: ‘Larry & Lawrie’, rarity: ‘Epic’,
gadget: ‘Lawrie Lives!’, star: ‘On Call’,
gears: ‘Damage, Speed’, build: ‘Duo Assault’
},
‘angelo’: {
name: ‘Angelo’, rarity: ‘Epic’,
gadget: ‘Master Fletcher’, star: ‘Vantage Point’,
gears: ‘Damage, Speed’, build: ‘Aerial Sniper’
},
‘berry’: {
name: ‘Berry’, rarity: ‘Epic’,
gadget: ‘Fruit Cake’, star: ‘Sugar Rush’,
gears: ‘Healing, Damage’, build: ‘Support Healer’
},
‘shade’: {
name: ‘Shade’, rarity: ‘Epic’,
gadget: ‘Longarms’, star: ‘Hardened Hoodie’,
gears: ‘Damage, Shield’, build: ‘Shadow Assassin’
},
‘sam’: {
name: ‘Sam’, rarity: ‘Epic’,
gadget: ‘Magnetic Catch’, star: ‘Wild Glove’,
gears: ‘Damage, Speed’, build: ‘Knuckle Aggressor’
},
‘grom’: {
name: ‘Grom’, rarity: ‘Epic’,
gadget: ‘Floor Is Lava’, star: ‘Waveband’,
gears: ‘Damage, Control’, build: ‘Splash Artillery’
},
‘bonnie’: {
name: ‘Bonnie’, rarity: ‘Epic’,
gadget: ‘Sugar Rush’, star: ‘Hop Skip Jump’,
gears: ‘Damage, Speed’, build: ‘Dual Aggression’
},
‘ash’: {
name: ‘Ash’, rarity: ‘Epic’,
gadget: ‘Chill Pill’, star: ‘First Bash’,
gears: ‘Health, Damage’, build: ‘Rage Tank’
},
‘trunk’: {
name: ‘Trunk’, rarity: ‘Epic’,
gadget: ‘For the Queen’, star: ‘New Insect Overlords’,
gears: ‘Damage, Health’, build: ‘Artillery Control’
},
‘meeple’: {
name: ‘Meeple’, rarity: ‘Epic’,
gadget: ‘Mansions of Meeple’, star: ‘Do Not Pass Go’,
gears: ‘Shield, Damage’, build: ‘Zone Barrier’
},

// ─── MYTHIC (38) ─────────────────────────────────────────
‘mortis’: {
name: ‘Mortis’, rarity: ‘Mythic’,
gadget: ‘Combo Spinner’, star: ‘Creepy Harvest’,
gears: ‘Damage, Shield’, build: ‘Dash Aggressor’
},
‘tara’: {
name: ‘Tara’, rarity: ‘Mythic’,
gadget: ‘Black Portal’, star: ‘Healing Shade’,
gears: ‘Control, Reload’, build: ‘Shadow Control’
},
‘gene’: {
name: ‘Gene’, rarity: ‘Mythic’,
gadget: ‘Lamp Blowout’, star: ‘Magic Puffs’,
gears: ‘Healing, Control’, build: ‘Pull Support’
},
‘mr-p’: {
name: ‘Mr. P’, rarity: ‘Mythic’,
gadget: ‘Suitcase Stash’, star: ‘Revolving Door’,
gears: ‘Control, Reload’, build: ‘Porter Zone’
},
‘max’: {
name: ‘Max’, rarity: ‘Mythic’,
gadget: ‘Phase Shifter’, star: ‘Run N Gun’,
gears: ‘Damage, Shield’, build: ‘Speed Support’
},
‘sprout’: {
name: ‘Sprout’, rarity: ‘Mythic’,
gadget: ‘Garden Mulcher’, star: ‘Overgrowth’,
gears: ‘Control, Health’, build: ‘Wall Control’
},
‘lou’: {
name: ‘Lou’, rarity: ‘Mythic’,
gadget: ‘Supercool’, star: ‘Hypothermia’,
gears: ‘Control, Health’, build: ‘Freeze Control’
},
‘byron’: {
name: ‘Byron’, rarity: ‘Mythic’,
gadget: ‘Booster Shots’, star: ‘Injection’,
gears: ‘Healing, Damage’, build: ‘Toxin Healer’
},
‘ruffs’: {
name: ‘Ruffs’, rarity: ‘Mythic’,
gadget: ‘Air Support’, star: ‘Field Promotion’,
gears: ‘Damage, Reload’, build: ‘Buff Support’
},
‘squeak’: {
name: ‘Squeak’, rarity: ‘Mythic’,
gadget: ‘Residue’, star: ‘Sticky Goo’,
gears: ‘Damage, Control’, build: ‘Sticky Bounce’
},
‘buzz’: {
name: ‘Buzz’, rarity: ‘Mythic’,
gadget: ‘Rip Cord’, star: ‘Eyes Sharp’,
gears: ‘Health, Damage’, build: ‘Grab Tank’
},
‘fang’: {
name: ‘Fang’, rarity: ‘Mythic’,
gadget: ‘Roundhouse Kick’, star: ‘Fresh Kicks’,
gears: ‘Damage, Speed’, build: ‘Pack Burst’
},
‘eve’: {
name: ‘Eve’, rarity: ‘Mythic’,
gadget: ‘Giga Egg’, star: ‘Unnatural Selections’,
gears: ‘Control, Damage’, build: ‘Bot Control’
},
‘janet’: {
name: ‘Janet’, rarity: ‘Mythic’,
gadget: ‘Drop the Bass’, star: ‘Vocal Warm-up’,
gears: ‘Damage, Speed’, build: ‘Flight Burst’
},
‘otis’: {
name: ‘Otis’, rarity: ‘Mythic’,
gadget: ‘Oil Spill’, star: ‘Stencil Glue’,
gears: ‘Control, Damage’, build: ‘Silence Control’
},
‘buster’: {
name: ‘Buster’, rarity: ‘Mythic’,
gadget: ‘Slo-Mo Replay’, star: ‘Blockbuster’,
gears: ‘Health, Damage’, build: ‘Charge Tank’
},
‘gray’: {
name: ‘Gray’, rarity: ‘Mythic’,
gadget: ‘Fake Injury’, star: ‘Lucky Bounces’,
gears: ‘Damage, Speed’, build: ‘Portal Control’
},
‘r-t’: {
name: ‘R-T’, rarity: ‘Mythic’,
gadget: ‘Out of Line’, star: ‘Quick Maths’,
gears: ‘Control, Damage’, build: ‘Split Pressure’
},
‘willow’: {
name: ‘Willow’, rarity: ‘Mythic’,
gadget: ‘Dive’, star: ‘Heart of Glass’,
gears: ‘Control, Speed’, build: ‘Mind Control’
},
‘doug’: {
name: ‘Doug’, rarity: ‘Mythic’,
gadget: ‘Extra Mustard’, star: ‘No Preservatives’,
gears: ‘Health, Damage’, build: ‘Heal Burst’
},
‘chuck’: {
name: ‘Chuck’, rarity: ‘Mythic’,
gadget: ‘Locomotive Launch’, star: ‘Off The Rails’,
gears: ‘Speed, Damage’, build: ‘Rail Aggressor’
},
‘charlie’: {
name: ‘Charlie’, rarity: ‘Mythic’,
gadget: ‘Spiders’, star: ‘Digestive’,
gears: ‘Damage, Shield’, build: ‘Cocoon Control’
},
‘mico’: {
name: ‘Mico’, rarity: ‘Mythic’,
gadget: ‘Clipping Scream’, star: ‘Monkey Business’,
gears: ‘Damage, Speed’, build: ‘Hop Assassin’
},
‘melodie’: {
name: ‘Melodie’, rarity: ‘Mythic’,
gadget: ‘Interlude’, star: ‘Perfect Pitch’,
gears: ‘Speed, Damage’, build: ‘Note Aggressor’
},
‘lily’: {
name: ‘Lily’, rarity: ‘Mythic’,
gadget: ‘Lurk’, star: ‘Petal Pirouette’,
gears: ‘Damage, Speed’, build: ‘Stealth Assassin’
},
‘clancy’: {
name: ‘Clancy’, rarity: ‘Mythic’,
gadget: ‘Cover Fire’, star: ‘Ready to Riot’,
gears: ‘Damage, Speed’, build: ‘Stage Burst’
},
‘moe’: {
name: ‘Moe’, rarity: ‘Mythic’,
gadget: ‘Dodgy Digging’, star: ‘Skipping Stones’,
gears: ‘Damage, Shield’, build: ‘Tunnel Burst’
},
‘juju’: {
name: ‘Juju’, rarity: ‘Mythic’,
gadget: ‘Elementalist’, star: ‘Numbing Needles’,
gears: ‘Shield, Damage’, build: ‘Element Control’
},
‘ollie’: {
name: ‘Ollie’, rarity: ‘Mythic’,
gadget: ‘Regulate’, star: ‘Renegade’,
gears: ‘Damage, Shield’, build: ‘Stun Aggressor’
},
‘lumi’: {
name: ‘Lumi’, rarity: ‘Mythic’,
gadget: ‘Grim and Frostbitten’, star: ‘Half-Time’,
gears: ‘Shield, Damage’, build: ‘Light Burst’
},
‘finx’: {
name: ‘Finx’, rarity: ‘Mythic’,
gadget: ‘Back to the Finxture’, star: ‘Hieroglyph Halt’,
gears: ‘Shield, Damage’, build: ‘Time Rewind’
},
‘jae-yong’: {
name: ‘Jae-Yong’, rarity: ‘Mythic’,
gadget: ‘Weekend Warrior’, star: ‘Extra High Note’,
gears: ‘Damage, Shield’, build: ‘K-Pop Burst’
},
‘alli’: {
name: ‘Alli’, rarity: ‘Mythic’,
gadget: ‘Cold-Blooded’, star: ‘You Better Run, You Better Take Cover’,
gears: ‘Shield, Damage’, build: ‘Enrage Assassin’
},
‘mina’: {
name: ‘Mina’, rarity: ‘Mythic’,
gadget: ‘Capo-What?’, star: ‘Zum Zum Zum’,
gears: ‘Damage, Shield’, build: ‘Cyclone Zone’
},
‘ziggy’: {
name: ‘Ziggy’, rarity: ‘Mythic’,
gadget: ‘Electric Shuffle’, star: ‘The Great Ziggini’,
gears: ‘Shield, Damage’, build: ‘Lightning Control’
},
‘gigi’: {
name: ‘Gigi’, rarity: ‘Mythic’,
gadget: ‘Longer Strings’, star: ‘A Helping Hand’,
gears: ‘Shield, Damage’, build: ‘Portal Damage’
},
‘glowbert’: {
name: ‘Glowbert’, rarity: ‘Mythic’,
gadget: ‘Slippery Savior’, star: ‘Parasitism’,
gears: ‘Damage, Shield’, build: ‘Tether Support’
},
‘najia’: {
name: ‘Najia’, rarity: ‘Mythic’,
gadget: ‘Toxic Top-Up’, star: ‘Venomous’,
gears: ‘Vision, Shield’, build: ‘Poison Assassin’
},

// ─── LEGENDARY (13) ──────────────────────────────────────
‘spike’: {
name: ‘Spike’, rarity: ‘Legendary’,
gadget: ‘Popping Pincushion’, star: ‘Fertilize’,
gears: ‘Control, Reload’, build: ‘Cactus Control’
},
‘crow’: {
name: ‘Crow’, rarity: ‘Legendary’,
gadget: ‘Defensive Booster’, star: ‘Extra Toxic’,
gears: ‘Speed, Damage’, build: ‘Poison Assassin’
},
‘leon’: {
name: ‘Leon’, rarity: ‘Legendary’,
gadget: ‘Lollipop Drop’, star: ‘Smoke Trails’,
gears: ‘Damage, Speed’, build: ‘Burst Assassin’
},
‘sandy’: {
name: ‘Sandy’, rarity: ‘Legendary’,
gadget: ‘Healing Winds’, star: ‘Rude Sands’,
gears: ‘Control, Healing’, build: ‘Sleep Control’
},
‘surge’: {
name: ‘Surge’, rarity: ‘Legendary’,
gadget: ‘Power Surge’, star: ‘To the Max!’,
gears: ‘Damage, Reload’, build: ‘Power Stacking’
},
‘amber’: {
name: ‘Amber’, rarity: ‘Legendary’,
gadget: ‘Dancing Flames’, star: ‘Scorchin' Siphon’,
gears: ‘Control, Damage’, build: ‘Fire Zone Control’
},
‘meg’: {
name: ‘Meg’, rarity: ‘Legendary’,
gadget: ‘Jolting Volts’, star: ‘Force Field’,
gears: ‘Damage, Speed’, build: ‘Mech Burst’
},
‘chester’: {
name: ‘Chester’, rarity: ‘Legendary’,
gadget: ‘Spicy Dice’, star: “Single Bell’O’Mania”,
gears: ‘Damage, Shield’, build: ‘Random Chaos’
},
‘cordelius’: {
name: ‘Cordelius’, rarity: ‘Legendary’,
gadget: ‘Shroom Boom’, star: ‘Fungi Figurine’,
gears: ‘Damage, Health’, build: ‘Mushroom Drain’
},
‘kit’: {
name: ‘Kit’, rarity: ‘Legendary’,
gadget: ‘Cardboard Box’, star: ‘Power Hungry’,
gears: ‘Damage, Shield’, build: ‘Jump Assassin’
},
‘draco’: {
name: ‘Draco’, rarity: ‘Legendary’,
gadget: ‘Last Stand’, star: ‘Shredding’,
gears: ‘Damage, Shield’, build: ‘Dragon Carry’
},
‘kenji’: {
name: ‘Kenji’, rarity: ‘Legendary’,
gadget: ‘Hosomaki Healing’, star: ‘Nigiri Nemesis’,
gears: ‘Damage, Shield’, build: ‘Sushi Assassin’
},
‘pierce’: {
name: ‘Pierce’, rarity: ‘Legendary’,
gadget: ‘You Only Brawl Twice’, star: ‘Mission: Swimpossible’,
gears: ‘Damage, Shield’, build: ‘Pierce Burst’
},

// ─── ULTRA LEGENDARY (2) ─────────────────────────────────
‘kaze’: {
name: ‘Kaze’, rarity: ‘Ultra Legendary’,
gadget: ‘Gracious Host’, star: ‘Advanced Techniques’,
gears: ‘Damage, Shield’, build: ‘Dual-Form Assassin’
},
‘sirius’: {
name: ‘Sirius’, rarity: ‘Ultra Legendary’,
gadget: ‘A Starr Is Born’, star: ‘The Darkest Star’,
gears: ‘Shield, Damage’, build: ‘Shadow Army’
}
};

const BRAWLER_LIST = Object.keys(BRAWLERS);

module.exports = {
data: new SlashCommandBuilder()
.setName(‘brawler-builds’)
.setDescription(‘Get the best meta build for any Brawl Stars brawler (March 2026)’)
.addStringOption(o =>
o.setName(‘brawler’)
.setDescription(‘Brawler name’)
.setRequired(true)
.setAutocomplete(true)
),

async execute(interaction) {
await interaction.deferReply();

```
const input = interaction.options.getString('brawler').toLowerCase().trim();
const brawler = BRAWLERS[input];

if (!brawler) {
  return interaction.editReply({
    embeds: [E.error('Not Found', `No brawler found for \`${input}\`. Use autocomplete to find the right name.`)]
  });
}

await interaction.editReply({
  embeds: [E.gold(`${brawler.name} — META BUILD`, brawler.rarity, [
    { name: '🎯 Build Type',    value: brawler.build,   inline: false },
    { name: '⚙️ Gadget',        value: brawler.gadget,  inline: true  },
    { name: '⭐ Star Power',    value: brawler.star,    inline: true  },
    { name: '🔧 Gears',         value: brawler.gears,   inline: false }
  ])]
});
```

},

async autocomplete(interaction) {
const focused = interaction.options.getFocused().toLowerCase().trim();

```
if (!focused) {
  return interaction.respond(
    BRAWLER_LIST.slice(0, 25).map(key => ({
      name: BRAWLERS[key].name,
      value: key
    }))
  );
}

const filtered = BRAWLER_LIST
  .filter(key =>
    BRAWLERS[key].name.toLowerCase().includes(focused) ||
    key.includes(focused)
  )
  .slice(0, 25);

await interaction.respond(
  filtered.map(key => ({
    name: `${BRAWLERS[key].name} (${BRAWLERS[key].rarity})`,
    value: key
  }))
);
```

}
};
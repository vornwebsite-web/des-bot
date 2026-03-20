const mongoose = require('mongoose');
const Brawler = require('./Brawler');

// Replace with your MongoDB URI
const mongoUri = 'mongodb+srv://bsdestroyer29_db_user:fm7A8GWIMPNk2wKf@cluster0.bhmjjne.mongodb.net/?appName=Cluster0';

const BRAWLERS_DATA = [
  // STARTING BRAWLER
  { id: 'shelly', name: 'Shelly', rarity: 'Starting Brawler', gadget: 'Clay Pigeons', star: 'Band-Aid', gears: 'Damage, Shield', build: 'Tank Support' },

  // RARE
  { id: 'nita', name: 'Nita', rarity: 'Rare', gadget: 'Bear Paws', star: 'Hyper Bear', gears: 'Damage, Shield', build: 'Bear Carry' },
  { id: 'colt', name: 'Colt', rarity: 'Rare', gadget: 'Speedloader', star: 'Magnum Special', gears: 'Damage, Shield', build: 'Rapid Fire' },
  { id: 'bull', name: 'Bull', rarity: 'Rare', gadget: 'Stomper', star: 'Tough Guy', gears: 'Damage, Health', build: 'Close Tank' },
  { id: 'brock', name: 'Brock', rarity: 'Rare', gadget: 'Rocket Laces', star: 'Rocket No. 4', gears: 'Reload Speed, Shield', build: 'Explosive Artillery' },
  { id: 'el-primo', name: 'El Primo', rarity: 'Rare', gadget: 'Meteor Rush', star: 'El Fuego', gears: 'Health, Damage', build: 'Heavyweight Tank' },
  { id: 'barley', name: 'Barley', rarity: 'Rare', gadget: 'Sticky Syrup Mixer', star: 'Extra Noxious', gears: 'Damage, Shield', build: 'Poison Control' },
  { id: 'poco', name: 'Poco', rarity: 'Rare', gadget: 'Tuning Fork', star: 'Screeching Solo', gears: 'Healing, Speed', build: 'Support Healer' },
  { id: 'rosa', name: 'Rosa', rarity: 'Rare', gadget: 'Unfriendly Bushes', star: 'Plant Life', gears: 'Damage, Speed', build: 'Super Tank' },

  // SUPER RARE
  { id: 'jessie', name: 'Jessie', rarity: 'Super Rare', gadget: 'Spark Plug', star: 'Shocky', gears: 'Damage, Reload', build: 'Turret Damage' },
  { id: 'dynamike', name: 'Dynamike', rarity: 'Super Rare', gadget: 'Satchel Charge', star: 'Dyna-Jump', gears: 'Shield, Gadget Cooldown', build: 'Explosive Pressure' },
  { id: 'tick', name: 'Tick', rarity: 'Super Rare', gadget: 'Last Hurrah', star: 'Well Oiled', gears: 'Thicc Head, Shield', build: 'Mine Control' },
  { id: '8-bit', name: '8-Bit', rarity: 'Super Rare', gadget: 'Cheat Cartridge', star: 'Boosted Booster', gears: 'Damage, Health', build: 'Turret Support' },
  { id: 'rico', name: 'Rico', rarity: 'Super Rare', gadget: 'Multiball Launcher', star: 'Super Bouncy', gears: 'Reload Speed, Damage', build: 'Ricochet Master' },
  { id: 'darryl', name: 'Darryl', rarity: 'Super Rare', gadget: 'Recoiling Rotator', star: 'Steel Hoops', gears: 'Damage, Shield', build: 'Rolling Tank' },
  { id: 'penny', name: 'Penny', rarity: 'Super Rare', gadget: 'Salty Barrel', star: 'Heavy Coffers', gears: 'Pet Power, Shield', build: 'Cannon Coverage' },
  { id: 'carl', name: 'Carl', rarity: 'Super Rare', gadget: 'Flying Hook', star: 'Protective Pirouette', gears: 'Damage, Shield', build: 'Pickaxe Zone' },
  { id: 'jacky', name: 'Jacky', rarity: 'Super Rare', gadget: 'Pneumatic Booster', star: 'Counter Crush', gears: 'Damage, Super Charge', build: 'Counter Tank' },
  { id: 'gus', name: 'Gus', rarity: 'Super Rare', gadget: 'Kooky Popper', star: 'Spirit Animal', gears: 'Damage, Shield', build: 'Ghost Support' },

  // EPIC
  { id: 'bo', name: 'Bo', rarity: 'Epic', gadget: 'Tripwire', star: 'Snare a Bear', gears: 'Damage, Shield', build: 'Trap Control' },
  { id: 'emz', name: 'Emz', rarity: 'Epic', gadget: 'Friendzoner', star: 'Bad Karma', gears: 'Damage, Shield', build: 'Area Pressure' },
  { id: 'stu', name: 'Stu', rarity: 'Epic', gadget: 'Breakthrough', star: 'Gaso-Heal', gears: 'Shield, Damage', build: 'Knockback Burst' },
  { id: 'piper', name: 'Piper', rarity: 'Epic', gadget: 'Auto Aimer', star: 'Snappy Sniping', gears: 'Shield, Damage', build: 'Long Range Sniper' },
  { id: 'pam', name: 'Pam', rarity: 'Epic', gadget: 'Scrapsucker', star: "Mama's Hug", gears: 'Healing, Health', build: 'Team Healer' },
  { id: 'frank', name: 'Frank', rarity: 'Epic', gadget: 'Irresistible Attraction', star: 'Power Grab', gears: 'Damage, Shield', build: 'Stun Tank' },
  { id: 'bibi', name: 'Bibi', rarity: 'Epic', gadget: 'Vitamin Booster', star: 'Home Run', gears: 'Damage, Shield', build: 'Bat Aggressor' },
  { id: 'bea', name: 'Bea', rarity: 'Epic', gadget: 'Honey Molasses', star: 'Insta Beaload', gears: 'Shield, Damage', build: 'Charge Damage' },
  { id: 'nani', name: 'Nani', rarity: 'Epic', gadget: 'Warp Blast', star: 'Tempered Steel', gears: 'Damage, Speed', build: 'Drone Control' },
  { id: 'edgar', name: 'Edgar', rarity: 'Epic', gadget: 'Fisticuffs', star: "Let's Go!", gears: 'Damage, Health', build: 'Close Combat Burst' },
  { id: 'griff', name: 'Griff', rarity: 'Epic', gadget: 'Piggy Bank', star: 'Business Resilience', gears: 'Reload Speed, Damage', build: 'Greedy Damage' },
  { id: 'gale', name: 'Gale', rarity: 'Epic', gadget: 'Twister', star: 'Blustery Blow', gears: 'Control, Speed', build: 'Pushback Control' },
  { id: 'colette', name: 'Colette', rarity: 'Epic', gadget: 'Gotcha!', star: 'Push It', gears: 'Damage, Control', build: 'HP Scaling' },
  { id: 'belle', name: 'Belle', rarity: 'Epic', gadget: 'Nest Egg', star: 'Positive Feedback', gears: 'Damage, Speed', build: 'Bounty Burst' },
  { id: 'lola', name: 'Lola', rarity: 'Epic', gadget: 'Psychic Headband', star: 'Stage Fright', gears: 'Damage, Control', build: 'Clone Control' },
  { id: 'mandy', name: 'Mandy', rarity: 'Epic', gadget: 'Cookie Crumbs', star: 'In My Sights', gears: 'Shield, Damage', build: 'Sniper Damage' },
  { id: 'maisie', name: 'Maisie', rarity: 'Epic', gadget: 'Disengage!', star: 'Tremors', gears: 'Damage, Shield', build: 'Artillery Burst' },
  { id: 'hank', name: 'Hank', rarity: 'Epic', gadget: "It's Game Time!", star: 'My Happy Place', gears: 'Health, Damage', build: 'Anchor Tank' },
  { id: 'pearl', name: 'Pearl', rarity: 'Epic', gadget: 'Overcooked', star: 'Heat Shield', gears: 'Damage, Shield', build: 'Heat Burst' },
  { id: 'larry-and-lawrie', name: 'Larry & Lawrie', rarity: 'Epic', gadget: 'Lawrie Lives!', star: 'On Call', gears: 'Damage, Speed', build: 'Duo Assault' },
  { id: 'angelo', name: 'Angelo', rarity: 'Epic', gadget: 'Master Fletcher', star: 'Vantage Point', gears: 'Damage, Speed', build: 'Aerial Sniper' },
  { id: 'berry', name: 'Berry', rarity: 'Epic', gadget: 'Friendship is Great', star: 'Sugar Rush', gears: 'Healing, Damage', build: 'Support Healer' },
  { id: 'shade', name: 'Shade', rarity: 'Epic', gadget: 'Longarms', star: 'Hardened Hoodie', gears: 'Damage, Shield', build: 'Shadow Assassin' },
  { id: 'sam', name: 'Sam', rarity: 'Epic', gadget: 'Magnetic Catch', star: 'Wild Glove', gears: 'Damage, Speed', build: 'Knuckle Aggressor' },
  { id: 'grom', name: 'Grom', rarity: 'Epic', gadget: 'Radio Check', star: 'X-Factor', gears: 'Damage, Shield', build: 'Splash Artillery' },
  { id: 'bonnie', name: 'Bonnie', rarity: 'Epic', gadget: 'Sugar Rush', star: 'Hop Skip Jump', gears: 'Damage, Speed', build: 'Dual Aggression' },
  { id: 'ash', name: 'Ash', rarity: 'Epic', gadget: 'Chill Pill', star: 'First Bash', gears: 'Health, Damage', build: 'Rage Tank' },
  { id: 'trunk', name: 'Trunk', rarity: 'Epic', gadget: 'For the Queen', star: 'New Insect Overlords', gears: 'Damage, Health', build: 'Artillery Control' },
  { id: 'meeple', name: 'Meeple', rarity: 'Epic', gadget: 'Mansions of Meeple', star: 'Do Not Pass Go', gears: 'Shield, Damage', build: 'Zone Barrier' },

  // MYTHIC
  { id: 'mortis', name: 'Mortis', rarity: 'Mythic', gadget: 'Combo Spinner', star: 'Creepy Harvest', gears: 'Damage, Shield', build: 'Dash Aggressor' },
  { id: 'tara', name: 'Tara', rarity: 'Mythic', gadget: 'Support From Beyond', star: 'Healing Shade', gears: 'Control, Reload', build: 'Shadow Control' },
  { id: 'gene', name: 'Gene', rarity: 'Mythic', gadget: 'Lamp Blowout', star: 'Magic Puffs', gears: 'Healing, Control', build: 'Pull Support' },
  { id: 'max', name: 'Max', rarity: 'Mythic', gadget: 'Phase Shifter', star: 'Run N Gun', gears: 'Damage, Shield', build: 'Speed Support' },
  { id: 'mr-p', name: 'Mr. P', rarity: 'Mythic', gadget: 'Service Bell', star: 'Revolving Door', gears: 'Pet Power, Damage', build: 'Porter Zone' },
  { id: 'sprout', name: 'Sprout', rarity: 'Mythic', gadget: 'Transplant', star: 'Overgrowth', gears: 'Control, Health', build: 'Wall Control' },
  { id: 'byron', name: 'Byron', rarity: 'Mythic', gadget: 'Booster Shots', star: 'Injection', gears: 'Healing, Damage', build: 'Toxin Healer' },
  { id: 'lou', name: 'Lou', rarity: 'Mythic', gadget: 'Supercool', star: 'Hypothermia', gears: 'Control, Health', build: 'Freeze Control' },
  { id: 'ruffs', name: 'Ruffs', rarity: 'Mythic', gadget: 'Air Support', star: 'Field Promotion', gears: 'Damage, Reload', build: 'Buff Support' },
  { id: 'squeak', name: 'Squeak', rarity: 'Mythic', gadget: 'Windup', star: 'Sticky Goo', gears: 'Damage, Control', build: 'Sticky Bounce' },
  { id: 'buzz', name: 'Buzz', rarity: 'Mythic', gadget: 'Rip Cord', star: 'Eyes Sharp', gears: 'Health, Damage', build: 'Grab Tank' },
  { id: 'fang', name: 'Fang', rarity: 'Mythic', gadget: 'Roundhouse Kick', star: 'Fresh Kicks', gears: 'Damage, Speed', build: 'Pack Burst' },
  { id: 'eve', name: 'Eve', rarity: 'Mythic', gadget: 'Giga Egg', star: 'Unnatural Selections', gears: 'Control, Damage', build: 'Bot Control' },
  { id: 'janet', name: 'Janet', rarity: 'Mythic', gadget: 'Drop the Bass', star: 'Vocal Warm-up', gears: 'Damage, Speed', build: 'Flight Burst' },
  { id: 'otis', name: 'Otis', rarity: 'Mythic', gadget: 'Phat Splatter', star: 'Stencil Glue', gears: 'Control, Damage', build: 'Silence Control' },
  { id: 'buster', name: 'Buster', rarity: 'Mythic', gadget: 'Slo-Mo Replay', star: 'Blockbuster', gears: 'Health, Damage', build: 'Charge Tank' },
  { id: 'gray', name: 'Gray', rarity: 'Mythic', gadget: 'Fake Injury', star: 'Lucky Bounces', gears: 'Damage, Speed', build: 'Portal Control' },
  { id: 'r-t', name: 'R-T', rarity: 'Mythic', gadget: 'Out of Line', star: 'Recording', gears: 'Damage, Shield', build: 'Split Pressure' },
  { id: 'willow', name: 'Willow', rarity: 'Mythic', gadget: 'Dive', star: 'Love Is Blind', gears: 'Shield, Damage', build: 'Mind Control' },
  { id: 'doug', name: 'Doug', rarity: 'Mythic', gadget: 'Extra Mustard', star: 'No Preservatives', gears: 'Health, Damage', build: 'Heal Burst' },
  { id: 'chuck', name: 'Chuck', rarity: 'Mythic', gadget: 'Locomotive Launch', star: 'Off The Rails', gears: 'Speed, Damage', build: 'Rail Aggressor' },
  { id: 'charlie', name: 'Charlie', rarity: 'Mythic', gadget: 'Spiders', star: 'Digestive', gears: 'Damage, Shield', build: 'Cocoon Control' },
  { id: 'mico', name: 'Mico', rarity: 'Mythic', gadget: 'Clipping Scream', star: 'Monkey Business', gears: 'Damage, Speed', build: 'Hop Assassin' },
  { id: 'melodie', name: 'Melodie', rarity: 'Mythic', gadget: 'Interlude', star: 'Fast Beats', gears: 'Damage, Shield', build: 'Note Aggressor' },
  { id: 'lily', name: 'Lily', rarity: 'Mythic', gadget: 'Lurk', star: 'Petal Pirouette', gears: 'Damage, Speed', build: 'Stealth Assassin' },
  { id: 'clancy', name: 'Clancy', rarity: 'Mythic', gadget: 'Cover Fire', star: 'Ready to Riot', gears: 'Damage, Speed', build: 'Stage Burst' },
  { id: 'moe', name: 'Moe', rarity: 'Mythic', gadget: 'Dodgy Digging', star: 'Skipping Stones', gears: 'Damage, Shield', build: 'Tunnel Burst' },
  { id: 'juju', name: 'Juju', rarity: 'Mythic', gadget: 'Elementalist', star: 'Numbing Needles', gears: 'Shield, Damage', build: 'Element Control' },
  { id: 'ollie', name: 'Ollie', rarity: 'Mythic', gadget: 'Regulate', star: 'Renegade', gears: 'Damage, Shield', build: 'Hypnotize Tank' },
  { id: 'lumi', name: 'Lumi', rarity: 'Mythic', gadget: 'Grim and Frostbitten', star: 'Half-Time', gears: 'Shield, Damage', build: 'Light Burst' },
  { id: 'finx', name: 'Finx', rarity: 'Mythic', gadget: 'Back to the Finxture', star: 'Hieroglyph Halt', gears: 'Shield, Damage', build: 'Time Rewind' },
  { id: 'jae-yong', name: 'Jae-Yong', rarity: 'Mythic', gadget: 'Weekend Warrior', star: 'Extra High Note', gears: 'Damage, Shield', build: 'K-Pop Burst' },
  { id: 'alli', name: 'Alli', rarity: 'Mythic', gadget: 'Cold-Blooded', star: 'You Better Run, You Better Take Cover', gears: 'Shield, Damage', build: 'Enrage Assassin' },
  { id: 'mina', name: 'Mina', rarity: 'Mythic', gadget: 'Capo-What?', star: 'Zum Zum Zum', gears: 'Damage, Shield', build: 'Cyclone Zone' },
  { id: 'ziggy', name: 'Ziggy', rarity: 'Mythic', gadget: 'Electric Shuffle', star: 'The Great Ziggini', gears: 'Shield, Damage', build: 'Lightning Control' },
  { id: 'gigi', name: 'Gigi', rarity: 'Mythic', gadget: 'Longer Strings', star: 'A Helping Hand', gears: 'Shield, Damage', build: 'Portal Damage' },
  { id: 'glowbert', name: 'Glowbert', rarity: 'Mythic', gadget: 'Slippery Savior', star: 'Parasitism', gears: 'Damage, Shield', build: 'Tether Support' },
  { id: 'najia', name: 'Najia', rarity: 'Mythic', gadget: 'Najia Jar', star: 'Venomous', gears: 'Damage, Shield', build: 'Poison Assassin' },

  // LEGENDARY
  { id: 'spike', name: 'Spike', rarity: 'Legendary', gadget: 'Popping Pincushion', star: 'Fertilize', gears: 'Damage, Control', build: 'Cactus Control' },
  { id: 'crow', name: 'Crow', rarity: 'Legendary', gadget: 'Instapoison', star: 'Extra Toxic', gears: 'Speed, Damage', build: 'Poison Assassin' },
  { id: 'leon', name: 'Leon', rarity: 'Legendary', gadget: 'Lollipop Drop', star: 'Smoke Trails', gears: 'Damage, Speed', build: 'Burst Assassin' },
  { id: 'sandy', name: 'Sandy', rarity: 'Legendary', gadget: 'Sweet Dreams', star: 'Rude Sands', gears: 'Control, Healing', build: 'Sleep Control' },
  { id: 'amber', name: 'Amber', rarity: 'Legendary', gadget: 'Dancing Flames', star: "Scorchin' Siphon", gears: 'Control, Damage', build: 'Fire Zone Control' },
  { id: 'meg', name: 'Meg', rarity: 'Legendary', gadget: 'Jolting Volts', star: 'Force Field', gears: 'Damage, Speed', build: 'Mech Burst' },
  { id: 'surge', name: 'Surge', rarity: 'Legendary', gadget: 'Power Surge', star: 'To the Max!', gears: 'Damage, Reload', build: 'Power Stacking' },
  { id: 'chester', name: 'Chester', rarity: 'Legendary', gadget: 'Spicy Dice', star: "Single Bell'O'Mania", gears: 'Damage, Shield', build: 'Random Chaos' },
  { id: 'cordelius', name: 'Cordelius', rarity: 'Legendary', gadget: 'Shroom Boom', star: 'Fungi Figurine', gears: 'Damage, Health', build: 'Mushroom Drain' },
  { id: 'kit', name: 'Kit', rarity: 'Legendary', gadget: 'Cardboard Box', star: 'Power Hungry', gears: 'Damage, Shield', build: 'Jump Assassin' },
  { id: 'draco', name: 'Draco', rarity: 'Legendary', gadget: 'Last Stand', star: 'Shredding', gears: 'Damage, Shield', build: 'Dragon Carry' },
  { id: 'kenji', name: 'Kenji', rarity: 'Legendary', gadget: 'Hosomaki Healing', star: 'Nigiri Nemesis', gears: 'Damage, Shield', build: 'Sushi Assassin' },
  { id: 'pierce', name: 'Pierce', rarity: 'Legendary', gadget: 'You Only Brawl Twice', star: 'Mission: Swimpossible', gears: 'Damage, Shield', build: 'Pierce Burst' },

  // ULTRA LEGENDARY
  { id: 'kaze', name: 'Kaze', rarity: 'Ultra Legendary', gadget: 'Gracious Host', star: 'Advanced Techniques', gears: 'Damage, Shield', build: 'Dual-Form Assassin' },
  { id: 'sirius', name: 'Sirius', rarity: 'Ultra Legendary', gadget: 'A Starr Is Born', star: 'The Darkest Starr', gears: 'Shield, Damage', build: 'Shadow Army' }
];

async function seedBrawlers() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing brawlers
    await Brawler.deleteMany({});
    console.log('🗑️ Cleared old brawlers');

    // Insert all brawlers
    await Brawler.insertMany(BRAWLERS_DATA);
    console.log(`✅ Seeded ${BRAWLERS_DATA.length} brawlers into database`);

    // Create indexes
    await Brawler.collection.createIndex({ name: 'text', id: 'text' });
    console.log('📊 Created text indexes for fast searching');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding brawlers:', err.message);
    process.exit(1);
  }
}

seedBrawlers();

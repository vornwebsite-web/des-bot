# ══════════════════════════════════════════════════════
#   DeS Bot™ — Railway + GitHub Deployment Guide
# ══════════════════════════════════════════════════════

## 🚀 Quick Deploy to Railway

### Step 1 — Fork / Push to GitHub
Push this entire folder to a GitHub repository.

### Step 2 — Create Railway Project
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository

### Step 3 — Add Environment Variables
In Railway dashboard → Variables, add:

```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
CLIENT_SECRET=your_bot_client_secret
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=random_long_string
DOMAIN=http://www.dotsbot.site
OWNER_IDS=your_discord_user_id
PORT=3000
```

### Step 4 — Deploy Commands
After first deploy, open Railway terminal and run:
```bash
node src/deploy.js
```

### Step 5 — Custom Domain
In Railway → Settings → Domains, add `www.dotsbot.site`

---

## 📁 Project Structure

```
des-bot/
├── src/
│   ├── index.js              # Bot entry point
│   ├── deploy.js             # Command deployer
│   ├── commands/             # All slash commands
│   │   ├── mod.js            # /mod (14 subcommands)
│   │   ├── tournament.js     # /tournament (9 subcommands)
│   │   ├── ticket.js         # /ticket (11 subcommands)
│   │   ├── stats.js          # /stats (4 subcommands)
│   │   ├── setup.js          # /setup (9 subcommands)
│   │   ├── welcome.js        # /welcome (7 subcommands)
│   │   ├── owner.js          # /owner (21 subcommands)
│   │   ├── premium.js        # /premium (7 subcommands)
│   │   ├── giveaway.js       # /giveaway (5 subcommands)
│   │   ├── economy.js        # /economy (6 subcommands)
│   │   ├── role.js           # /role (7 subcommands)
│   │   ├── util.js           # /util (10 subcommands)
│   │   ├── poll.js           # /poll (2 subcommands)
│   │   ├── reminder.js       # /reminder (3 subcommands)
│   │   ├── suggest.js        # /suggest (4 subcommands)
│   │   └── help.js           # /help
│   ├── events/               # Discord event handlers
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   ├── guildMemberAdd.js
│   │   ├── guildMemberRemove.js
│   │   ├── messageCreate.js
│   │   ├── messageDelete.js
│   │   ├── messageUpdate.js
│   │   ├── guildBanAdd.js
│   │   └── antinuke.js
│   ├── models/
│   │   └── index.js          # All Mongoose models
│   ├── utils/
│   │   ├── embeds.js         # Gold-themed embed builder
│   │   ├── helpers.js        # Permission & premium checks
│   │   └── logger.js         # Winston logger
│   └── dashboard/
│       ├── server.js         # Express + Passport + Socket.io
│       ├── routes/index.js   # All dashboard routes + API
│       └── views/            # EJS templates
│           ├── home.ejs      # Landing page
│           ├── dashboard.ejs # Server selector
│           ├── guild.ejs     # Server config panel
│           ├── premium.ejs   # Premium page
│           └── error.ejs     # Error page
├── logs/                     # Auto-created log files
├── .env.example              # Environment template
├── package.json
└── README.md
```

## 🎮 Commands Summary

| Command | Subcommands | Description |
|---------|-------------|-------------|
| /mod | 14 | Full moderation suite |
| /tournament | 9 | Tournament management |
| /ticket | 11 | Ticket support system |
| /stats | 4 | Player statistics |
| /setup | 9 | Server configuration |
| /welcome | 7 | Welcome/farewell |
| /owner | 21 | Bot owner tools |
| /premium | 7 | Premium features |
| /giveaway | 5 | Giveaway system |
| /economy | 6 | Economy & coins |
| /role | 7 | Role management |
| /util | 10 | Utility tools |
| /poll | 2 | Polls |
| /reminder | 3 | Reminders |
| /suggest | 4 | Suggestions |
| /help | - | Command list |

**Total: 16 commands, 119 subcommands**

## 🔑 Key Features
- ✅ Anti-Raid (join flood detection)
- ✅ Anti-Nuke (mass deletion/ban protection)
- ✅ Auto-Moderation (spam, links, invites, caps)
- ✅ Welcome/Farewell with custom messages
- ✅ Ultra-designed ticket system with transcripts
- ✅ Tournament system (4 formats)
- ✅ XP leveling with level-up announcements
- ✅ Full economy with gambling
- ✅ Giveaway system with reroll
- ✅ Premium system with 3 tiers
- ✅ Owner commands (21 subcommands)
- ✅ Steal emoji command
- ✅ Full mod logging with case numbers
- ✅ Live web dashboard with real-time updates
- ✅ MongoDB for persistent data

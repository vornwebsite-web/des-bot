require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const logger = require('../utils/logger');

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: '*' } });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'cdn.socket.io'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'cdn.discordapp.com', 'images.discordapp.net', 'i.imgur.com'],
    }
  }
}));
app.use(cors());

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'des-bot-secret',
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGODB_URI ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI }) : undefined,
  cookie: { maxAge: 86400000 * 7 }
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// ── Passport Discord ──────────────────────────────────────────
passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: `${process.env.DOMAIN || 'http://localhost:3000'}/auth/callback`,
  scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ── Auth middleware ───────────────────────────────────────────
function isAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
}
function isOwner(req, res, next) {
  const owners = (process.env.OWNER_IDS || '').split(',').map(s => s.trim());
  if (req.isAuthenticated() && owners.includes(req.user.id)) return next();
  res.status(403).render('error', { user: req.user, message: 'Owner access required.' });
}

// ── Routes ────────────────────────────────────────────────────
const routes = require('./routes/index');
app.use('/', (req, res, next) => { res.locals.user = req.user; next(); }, routes(io));

// ── Auth Routes ───────────────────────────────────────────────
app.get('/auth/login', passport.authenticate('discord'));
app.get('/auth/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  res.redirect(req.session.returnTo || '/dashboard');
  delete req.session.returnTo;
});
app.get('/auth/logout', (req, res) => { req.logout(() => res.redirect('/')); });

// ── Socket.io ─────────────────────────────────────────────────
io.use((socket, next) => { sessionMiddleware(socket.request, {}, next); });
io.on('connection', (socket) => {
  socket.on('join-guild', (guildId) => socket.join(`guild:${guildId}`));
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).render('error', { user: req.user, message: 'Page not found.' }));

// ── Start ─────────────────────────────────────────────────────
function startDashboard(client) {
  app.locals.client = client;
  app.locals.io = io;
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => logger.info(`🌐 Dashboard running on port ${PORT}`));
}

module.exports = { startDashboard };

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
  callbackURL: 'https://www.dotsbot.site/callback',
  scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => {
  done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// ── Middleware to set res.locals ──────────────────────────────
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

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
app.use('/', routes(io));

// ── Auth Routes ───────────────────────────────────────────────
app.get('/auth/login', passport.authenticate('discord'));

app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  const returnTo = req.session.returnTo || '/dashboard';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error(`Logout error: ${err.message}`);
    }
    res.redirect('/');
  });
});

// ── Socket.io ─────────────────────────────────────────────────
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
  socket.on('join-guild', (guildId) => {
    socket.join(`guild:${guildId}`);
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).render('error', { user: req.user || null, message: 'Page not found.' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Global error handler: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'An error occurred' 
    : err.message;
  
  res.status(err.status || 500).render('error', { 
    user: req.user || null, 
    message: message 
  }).catch(renderErr => {
    logger.error(`Error rendering error page: ${renderErr.message}`);
    res.status(500).send('Internal Server Error');
  });
});

// ── Start ─────────────────────────────────────────────────────
function startDashboard(client) {
  app.locals.client = client;
  app.locals.io = io;
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, () => {
    logger.info(`🌐 Dashboard running on port ${PORT}`);
  });
  
  // Handle server errors
  server.on('error', (err) => {
    logger.error(`Server error: ${err.message}`);
  });
}

module.exports = { startDashboard };

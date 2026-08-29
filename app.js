const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const expressLayouts = require('express-ejs-layouts');

const SiteSettings = require('./models/SiteSettings');
const publicRoutes = require('./routes/public');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

/* ------------------------------ View engine ----------------------------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

/* -------------------------------- Security ------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Base64 images render as data: URIs; fonts/scripts come from CDN + inline for small init scripts.
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", 'https://www.google.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: process.env.BASE_URL || true, credentials: true }));
app.use(mongoSanitize());

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

/* -------------------------------- Parsing -------------------------------- */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_session_secret',
    resave: false,
    saveUninitialized: false,
    // Kept close to the JWT admin-session length (7d) so a long-open admin
    // tab doesn't get invalid-CSRF errors mid-session; flash messages for
    // anonymous visitors don't need nearly this long but sharing one cookie
    // config keeps things simple.
    cookie: { secure: process.env.COOKIE_SECURE === 'true', maxAge: 8 * 60 * 60 * 1000 },
  })
);
app.use(flash());

/* -------------------------------- Static --------------------------------- */
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

/* --------------------------- Global template data ------------------------ */
app.use(async (req, res, next) => {
  try {
    res.locals.settings = await SiteSettings.getSiteSettings();
    res.locals.currentPath = req.path;
    res.locals.successMessages = req.flash('success');
    res.locals.errorMessages = req.flash('error');
    next();
  } catch (err) {
    next(err);
  }
});

/* --------------------------------- Routes --------------------------------- */
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/products', productRoutes);
app.use('/', publicRoutes);

/* ------------------------------ Error handling ---------------------------- */
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

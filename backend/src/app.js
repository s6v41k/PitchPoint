require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const pitchRoutes = require('./routes/pitchRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// Sets a standard set of protective HTTP response headers (no more than
// that — this is a pure JSON API with no server-rendered HTML/scripts to
// apply a Content-Security-Policy to, so helmet's defaults are enough).
app.use(helmet());

// In development, Vite auto-bumps to 5174/5175/... whenever a previous
// dev server is still holding 5173, so a single hardcoded origin
// constantly falls out of sync. Allow any localhost port there; in
// production, only the configured CLIENT_URL may call this API.
const corsOrigin =
  process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : /^http:\/\/localhost:\d+$/;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/pitches', pitchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Anything that falls through every route above is a 404 — forward it to
// the centralized error handler instead of letting Express send its
// default HTML error page.
app.use((req, res, next) => {
  next(new ApiError(404, `No route for ${req.method} ${req.originalUrl}`));
});

// Must be registered last: Express identifies error-handling middleware by
// its 4-argument signature, and only calls the ones after the point where
// next(err) was invoked.
app.use(errorHandler);

module.exports = app;

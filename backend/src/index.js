require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');

const logger = require('./middleware/logger');

const {
  metricsMiddleware,
  metricsRouter
} = require('./metrics/prometheus');

const authRoutes = require('../routes/auth');
const analyzeRoutes = require('../routes/analyze');
const historyRoutes = require('../routes/history');

const { connectRedis } = require('./middleware/redis');

const app = express();

const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
// Security & Middleware
// ─────────────────────────────────────────────────────────────

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(compression());

app.use(express.json({
  limit: '100kb'
}));

app.use(
  morgan('combined', {
    stream: {
      write: (msg) => logger.info(msg.trim())
    }
  })
);

app.use(metricsMiddleware);

// ─────────────────────────────────────────────────────────────
// Health Route
// ─────────────────────────────────────────────────────────────

app.get('/health', async (req, res) => {

  const mongoState =
    mongoose.connection.readyState === 1
      ? 'ok'
      : 'error';

  res.json({
    status: 'ok',

    timestamp: new Date().toISOString(),

    services: {
      mongodb: mongoState,

      redis:
        global.redisClient?.status === 'ready'
          ? 'ok'
          : 'degraded'
    },

    version: '1.0.0'
  });
});

// Metrics endpoint
app.use('/metrics', metricsRouter);

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);

app.use('/api/analyze', analyzeRoutes);

app.use('/api/history', historyRoutes);

// ─────────────────────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────────────────────

app.use((req, res) => {

  res.status(404).json({
    error: 'Route not found'
  });

});

// ─────────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {

  logger.error(`Unhandled error: ${err.message}`);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });

});

// ─────────────────────────────────────────────────────────────
// Bootstrap Server
// ─────────────────────────────────────────────────────────────

async function start() {

  try {

    await mongoose.connect(process.env.MONGO_URI);

    logger.info('MongoDB connected');

    await connectRedis();

    logger.info('Redis connected');

    app.listen(PORT, () => {

      logger.info(`Backend running on port ${PORT}`);

    });

  } catch (err) {

    logger.error(`Startup failed: ${err.message}`);

    process.exit(1);

  }
}

start();

// ─────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {

  logger.info('SIGTERM received — shutting down gracefully');

  await mongoose.connection.close();

  process.exit(0);

});
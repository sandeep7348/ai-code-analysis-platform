const client = require('prom-client');
const express = require('express');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'codelens_' });

// ─── Custom Metrics ──────────────────────────────────────────
const httpRequestDuration = new client.Histogram({
  name: 'codelens_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: 'codelens_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const aiAnalysisTotal = new client.Counter({
  name: 'codelens_ai_analysis_total',
  help: 'Total number of AI code analyses',
  labelNames: ['mode', 'language', 'status'],
  registers: [register]
});

const aiAnalysisDuration = new client.Histogram({
  name: 'codelens_ai_analysis_duration_seconds',
  help: 'Duration of AI analysis calls',
  labelNames: ['mode', 'language'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30],
  registers: [register]
});

const cacheHits = new client.Counter({
  name: 'codelens_cache_hits_total',
  help: 'Total Redis cache hits',
  labelNames: ['cache_type'],
  registers: [register]
});

const cacheMisses = new client.Counter({
  name: 'codelens_cache_misses_total',
  help: 'Total Redis cache misses',
  labelNames: ['cache_type'],
  registers: [register]
});

const activeUsers = new client.Gauge({
  name: 'codelens_active_users',
  help: 'Number of currently active users',
  registers: [register]
});

const mongodbOperations = new client.Counter({
  name: 'codelens_mongodb_operations_total',
  help: 'Total MongoDB operations',
  labelNames: ['operation', 'collection'],
  registers: [register]
});

// ─── Middleware ───────────────────────────────────────────────
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    const duration = (Date.now() - start) / 1000;
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  next();
}

const metricsRouter = express.Router();
metricsRouter.get('/', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = {
  metricsMiddleware,
  metricsRouter,
  aiAnalysisTotal,
  aiAnalysisDuration,
  cacheHits,
  cacheMisses,
  activeUsers,
  mongodbOperations
};

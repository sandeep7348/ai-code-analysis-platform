const Redis = require('ioredis');
const logger = require('./logger');

let redisClient;

async function connectRedis() {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true
  });

  redisClient.on('error', err => logger.warn(`Redis error: ${err.message}`));
  redisClient.on('connect', () => logger.info('Redis connected'));

  await redisClient.connect();
  global.redisClient = redisClient;
  return redisClient;
}

async function getCache(key) {
  try {
    const val = await redisClient?.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function setCache(key, value, ttlSeconds = 3600) {
  try {
    await redisClient?.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn(`Redis set failed: ${err.message}`);
  }
}

async function delCache(key) {
  try { await redisClient?.del(key); } catch {}
}

module.exports = { connectRedis, getCache, setCache, delCache };

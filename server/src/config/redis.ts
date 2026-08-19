// src/config/redis.ts
import Redis from 'ioredis';
import { env } from './env';

const createRedisClient = (): Redis => {
  // Production: Upstash Redis
  if (env.redisUrl && env.redisToken) {
    console.log('Connecting to Upstash Redis...');
    return new Redis({
      host: new URL(env.redisUrl).hostname,
      port: 6379,
      password: env.redisToken,
      tls: {
        rejectUnauthorized: false,
      },
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        console.log(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  // Development: Local Redis
  console.log('Connecting to local Redis...');
  return new Redis({
    host: env.redisHost || 'localhost',
    port: parseInt(env.redisPort || '6379'),
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

const redis = createRedisClient();

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('ready', () => {
  console.log('Redis ready for operations');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error.message);
  // Don't crash the app - Redis is optional for caching/rate limiting
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

// Connect lazily (won't crash if Redis is unavailable)
redis.connect().catch((err) => {
  console.warn('Redis not available, running without cache:', err.message);
});

export { redis };

export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
};
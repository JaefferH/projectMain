import { redis } from '@config/redis';
import { AppError } from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;      // Time window in milliseconds (e.g., 60000 = 1 minute)
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Redis key prefix for grouping
  skipOnError?: boolean; // Allow request if Redis fails
}

export const rateLimiter = (options: RateLimitOptions) => {
  const { 
    windowMs = 60000, 
    maxRequests = 10, 
    keyPrefix = 'ratelimit',
    skipOnError = true 
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create unique key based on IP and route
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
        || req.ip 
        || req.socket.remoteAddress 
        || 'unknown';
      
      const route = req.originalUrl || req.url;
      const key = `${keyPrefix}:${ip}:${route}`;

      // Get current request count
      const current = await redis.get(key);
      const count = current ? parseInt(current) : 0;

      // Set headers
      const ttl = Math.ceil(windowMs / 1000);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count - 1));
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);

      if (count >= maxRequests) {
        const remainingTtl = await redis.ttl(key);
        const retryAfter = remainingTtl > 0 ? remainingTtl : ttl;
        
        res.setHeader('Retry-After', retryAfter);
        
        throw new AppError(
          `Too many requests. Please try again in ${retryAfter} seconds.`,
          429
        );
      }

      // Increment count with expiry
      if (count === 0) {
        await redis.setex(key, ttl, '1');
      } else {
        await redis.incr(key);
        // Reset expiry on each request within window
        await redis.expire(key, ttl);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else if (skipOnError) {
        // Redis is down - allow the request through
        console.warn('Rate limiter: Redis unavailable, skipping rate limit');
        next();
      } else {
        next(error);
      }
    }
  };
};

// Pre-configured rate limiters for different scenarios
export const rateLimiters = {
  // Strict: Login, password reset (prevent brute force)
  auth: rateLimiter({ 
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5, 
    keyPrefix: 'rl:auth' 
  }),
  
  // Moderate: API endpoints
  api: rateLimiter({ 
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60, 
    keyPrefix: 'rl:api' 
  }),
  
  // Generous: GET requests
  read: rateLimiter({ 
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 120, 
    keyPrefix: 'rl:read' 
  }),
  
  // Strict: Create/Update/Delete operations
  write: rateLimiter({ 
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30, 
    keyPrefix: 'rl:write' 
  }),
  
  // Very strict: Password reset, token generation
  sensitive: rateLimiter({ 
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 3, 
    keyPrefix: 'rl:sensitive' 
  }),
};
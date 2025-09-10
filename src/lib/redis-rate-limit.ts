import { createClient, RedisClientType } from 'redis';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 1; // 1 request per minute per IP
const MAX_REQUESTS_PER_HOUR = 20; // 20 requests per hour per IP
const MAX_REQUESTS_PER_DAY = 50; // 50 requests per day per IP

// Redis client instance
let redisClient: RedisClientType | null = null;

// Initialize Redis client
const initializeRedis = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    await redisClient.connect();
  }
  return redisClient;
};

// Interface for rate limit result
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limitType?: string;
  totalRequests: {
    minute: number;
    hour: number;
    day: number;
  };
}

// Interface for IP analytics
interface IPAnalytics {
  ip: string;
  totalRequests: number;
  firstSeen: string;
  lastSeen: string;
  requestsByMinute: number;
  requestsByHour: number;
  requestsByDay: number;
  blockedRequests: number;
}

// Helper function to get client IP
export const getClientIP = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
};

// Log IP request activity
const logIPActivity = async (ip: string, allowed: boolean, limitType?: string) => {
  try {
    const client = await initializeRedis();
    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    
    // Create a log entry
    const logEntry = {
      ip,
      timestamp,
      allowed,
      limitType: limitType || 'none',
      userAgent: 'unknown' // You can extract this from request headers if needed
    };

    // Store in Redis with TTL of 30 days
    await client.lPush(`ip_logs:${ip}`, JSON.stringify(logEntry));
    await client.expire(`ip_logs:${ip}`, 30 * 24 * 60 * 60); // 30 days TTL

    // Update IP analytics
    const analyticsKey = `ip_analytics:${ip}`;
    const analytics = await client.hGetAll(analyticsKey);
    
    const currentAnalytics: IPAnalytics = {
      ip,
      totalRequests: parseInt(analytics.totalRequests || '0') + 1,
      firstSeen: analytics.firstSeen || timestamp,
      lastSeen: timestamp,
      requestsByMinute: parseInt(analytics.requestsByMinute || '0'),
      requestsByHour: parseInt(analytics.requestsByHour || '0'),
      requestsByDay: parseInt(analytics.requestsByDay || '0'),
      blockedRequests: parseInt(analytics.blockedRequests || '0') + (allowed ? 0 : 1)
    };

    // Update analytics
    await client.hSet(analyticsKey, {
      totalRequests: currentAnalytics.totalRequests.toString(),
      firstSeen: currentAnalytics.firstSeen,
      lastSeen: currentAnalytics.lastSeen,
      requestsByMinute: currentAnalytics.requestsByMinute.toString(),
      requestsByHour: currentAnalytics.requestsByHour.toString(),
      requestsByDay: currentAnalytics.requestsByDay.toString(),
      blockedRequests: currentAnalytics.blockedRequests.toString()
    });

    // Set TTL for analytics (30 days)
    await client.expire(analyticsKey, 30 * 24 * 60 * 60);

    console.log(`IP Activity Logged: ${ip} - ${allowed ? 'ALLOWED' : 'BLOCKED'} - ${limitType || 'none'}`);
  } catch (error) {
    console.error('Failed to log IP activity:', error);
  }
};

// Main rate limiting function with Redis
export const checkRateLimit = async (ip: string): Promise<RateLimitResult> => {
  try {
    const client = await initializeRedis();
    const now = Date.now();
    
    // Define time windows
    const minuteWindow = Math.floor(now / RATE_LIMIT_WINDOW);
    const hourWindow = Math.floor(now / (60 * 60 * 1000));
    const dayWindow = Math.floor(now / (24 * 60 * 60 * 1000));
    
    // Create keys for different time windows
    const minuteKey = `rate_limit:minute:${ip}:${minuteWindow}`;
    const hourKey = `rate_limit:hour:${ip}:${hourWindow}`;
    const dayKey = `rate_limit:day:${ip}:${dayWindow}`;
    
    // Get current counts using pipeline for efficiency
    const pipeline = client.multi();
    pipeline.get(minuteKey);
    pipeline.get(hourKey);
    pipeline.get(dayKey);
    
    const results = await pipeline.exec();
    const minuteCount = parseInt((results?.[0] as any)?.[1] as string || '0');
    const hourCount = parseInt((results?.[1] as any)?.[1] as string || '0');
    const dayCount = parseInt((results?.[2] as any)?.[1] as string || '0');
    
    // Check limits BEFORE incrementing
    if (minuteCount >= MAX_REQUESTS_PER_WINDOW) {
      await logIPActivity(ip, false, 'minute');
      return {
        allowed: false,
        remaining: 0,
        resetTime: (minuteWindow + 1) * RATE_LIMIT_WINDOW,
        limitType: 'minute',
        totalRequests: { minute: minuteCount, hour: hourCount, day: dayCount }
      };
    }
    
    if (hourCount >= MAX_REQUESTS_PER_HOUR) {
      await logIPActivity(ip, false, 'hour');
      return {
        allowed: false,
        remaining: 0,
        resetTime: (hourWindow + 1) * (60 * 60 * 1000),
        limitType: 'hour',
        totalRequests: { minute: minuteCount, hour: hourCount, day: dayCount }
      };
    }
    
    if (dayCount >= MAX_REQUESTS_PER_DAY) {
      await logIPActivity(ip, false, 'day');
      return {
        allowed: false,
        remaining: 0,
        resetTime: (dayWindow + 1) * (24 * 60 * 60 * 1000),
        limitType: 'day',
        totalRequests: { minute: minuteCount, hour: hourCount, day: dayCount }
      };
    }
    
    // Increment counters only if all limits are not exceeded
    const incrementPipeline = client.multi();
    incrementPipeline.incr(minuteKey);
    incrementPipeline.expire(minuteKey, 60); // 1 minute TTL
    incrementPipeline.incr(hourKey);
    incrementPipeline.expire(hourKey, 3600); // 1 hour TTL
    incrementPipeline.incr(dayKey);
    incrementPipeline.expire(dayKey, 86400); // 1 day TTL
    
    await incrementPipeline.exec();
    
    // Log successful request
    await logIPActivity(ip, true);
    
    const remaining = Math.min(
      MAX_REQUESTS_PER_WINDOW - minuteCount - 1,
      MAX_REQUESTS_PER_HOUR - hourCount - 1,
      MAX_REQUESTS_PER_DAY - dayCount - 1
    );
    
    return {
      allowed: true,
      remaining,
      resetTime: (minuteWindow + 1) * RATE_LIMIT_WINDOW,
      totalRequests: { 
        minute: minuteCount + 1, 
        hour: hourCount + 1, 
        day: dayCount + 1 
      }
    };
    
  } catch (error) {
    console.error('Redis rate limit check failed:', error);
    // Fallback: allow request if Redis is down
    return {
      allowed: true,
      remaining: 0,
      resetTime: Date.now() + RATE_LIMIT_WINDOW,
      totalRequests: { minute: 0, hour: 0, day: 0 }
    };
  }
};

// Get IP analytics
export const getIPAnalytics = async (ip: string): Promise<IPAnalytics | null> => {
  try {
    const client = await initializeRedis();
    const analyticsKey = `ip_analytics:${ip}`;
    const analytics = await client.hGetAll(analyticsKey);
    
    if (!analytics.totalRequests) {
      return null;
    }
    
    return {
      ip,
      totalRequests: parseInt(analytics.totalRequests),
      firstSeen: analytics.firstSeen,
      lastSeen: analytics.lastSeen,
      requestsByMinute: parseInt(analytics.requestsByMinute || '0'),
      requestsByHour: parseInt(analytics.requestsByHour || '0'),
      requestsByDay: parseInt(analytics.requestsByDay || '0'),
      blockedRequests: parseInt(analytics.blockedRequests || '0')
    };
  } catch (error) {
    console.error('Failed to get IP analytics:', error);
    return null;
  }
};

// Get all IPs with their analytics
export const getAllIPAnalytics = async (): Promise<IPAnalytics[]> => {
  try {
    const client = await initializeRedis();
    const keys = await client.keys('ip_analytics:*');
    const analytics: IPAnalytics[] = [];
    
    for (const key of keys) {
      const ip = key.replace('ip_analytics:', '');
      const ipAnalytics = await getIPAnalytics(ip);
      if (ipAnalytics) {
        analytics.push(ipAnalytics);
      }
    }
    
    return analytics.sort((a, b) => b.totalRequests - a.totalRequests);
  } catch (error) {
    console.error('Failed to get all IP analytics:', error);
    return [];
  }
};

// Get IP request logs
export const getIPLogs = async (ip: string, limit: number = 100): Promise<any[]> => {
  try {
    const client = await initializeRedis();
    const logs = await client.lRange(`ip_logs:${ip}`, 0, limit - 1);
    return logs.map(log => JSON.parse(log));
  } catch (error) {
    console.error('Failed to get IP logs:', error);
    return [];
  }
};

// Cleanup old data (run periodically)
export const cleanupOldData = async (): Promise<void> => {
  try {
    const client = await initializeRedis();
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Clean up old logs
    const logKeys = await client.keys('ip_logs:*');
    for (const key of logKeys) {
      const logs = await client.lRange(key, 0, -1);
      const validLogs = logs.filter(log => {
        const logData = JSON.parse(log);
        return new Date(logData.timestamp).getTime() > thirtyDaysAgo;
      });
      
      if (validLogs.length === 0) {
        await client.del(key);
      } else {
        await client.del(key);
        for (const log of validLogs) {
          await client.lPush(key, log);
        }
      }
    }
    
    console.log('Old data cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup old data:', error);
  }
};

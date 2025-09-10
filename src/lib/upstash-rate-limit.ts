import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 1; // 1 request per minute per IP
const MAX_REQUESTS_PER_HOUR = 20; // 20 requests per hour per IP
const MAX_REQUESTS_PER_DAY = 50; // 50 requests per day per IP

// Storage type configuration
type StorageType = 'redis' | 'upstash-rest' | 'memory' | 'disabled';

// Get storage type from environment
const getStorageType = (): StorageType => {
  const storageType = process.env.STORAGE_TYPE?.toLowerCase();
  if (storageType === 'upstash-rest') return 'upstash-rest';
  if (storageType === 'memory' || storageType === 'disabled') {
    return storageType;
  }
  return 'redis'; // Default to Redis
};

// Redis client instance
let redisClient: RedisClientType | null = null;

// In-memory fallback storage
const memoryStore = {
  rateLimit: new Map<string, { count: number; resetTime: number }>(),
  hourly: new Map<string, { count: number; resetTime: number }>(),
  daily: new Map<string, { count: number; resetTime: number }>(),
  analytics: new Map<string, any>(),
  logs: new Map<string, any[]>()
};

// Upstash REST API client
class UpstashRestClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.UPSTASH_REDIS_REST_URL || '';
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  }

  async get(key: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/get/${encodeURIComponent(key)}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Upstash REST GET failed:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const url = ttl 
        ? `${this.baseUrl}/setex/${encodeURIComponent(key)}/${ttl}/${encodeURIComponent(value)}`
        : `${this.baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Upstash REST SET failed:', error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/incr/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Upstash REST INCR failed:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/expire/${encodeURIComponent(key)}/${seconds}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Upstash REST EXPIRE failed:', error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/keys/${encodeURIComponent(pattern)}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Upstash REST KEYS failed:', error);
      return [];
    }
  }

  async lPush(key: string, ...values: string[]): Promise<number> {
    try {
      const encodedValues = values.map(v => encodeURIComponent(v)).join('/');
      const response = await fetch(`${this.baseUrl}/lpush/${encodeURIComponent(key)}/${encodedValues}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Upstash REST LPUSH failed:', error);
      return 0;
    }
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lrange/${encodeURIComponent(key)}/${start}/${stop}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Upstash REST LRANGE failed:', error);
      return [];
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/hgetall/${encodeURIComponent(key)}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result || {};
    } catch (error) {
      console.error('Upstash REST HGETALL failed:', error);
      return {};
    }
  }

  async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/hset/${encodeURIComponent(key)}/${encodeURIComponent(field)}/${encodeURIComponent(value)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Upstash REST HSET failed:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Upstash REST DEL failed:', error);
      return false;
    }
  }
}

let upstashClient: UpstashRestClient | null = null;

// Initialize Redis client
const initializeRedis = async (): Promise<RedisClientType | null> => {
  const storageType = getStorageType();
  
  if (storageType !== 'redis') {
    console.log(`Using ${storageType} storage instead of Redis`);
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        console.log('Falling back to in-memory storage...');
      });

      redisClient.on('connect', () => {
        console.log('Connected to Redis');
      });

      await redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      console.log('Falling back to in-memory storage...');
      redisClient = null;
    }
  }
  return redisClient;
};

// Initialize Upstash REST client
const initializeUpstash = (): UpstashRestClient => {
  if (!upstashClient) {
    upstashClient = new UpstashRestClient();
    console.log('Initialized Upstash REST client');
  }
  return upstashClient;
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

// In-memory rate limiting function
const checkRateLimitMemory = (ip: string): RateLimitResult => {
  const now = Date.now();
  
  // Clean up expired entries
  for (const [key, value] of memoryStore.rateLimit.entries()) {
    if (now > value.resetTime) {
      memoryStore.rateLimit.delete(key);
    }
  }
  
  for (const [key, value] of memoryStore.hourly.entries()) {
    if (now > value.resetTime) {
      memoryStore.hourly.delete(key);
    }
  }
  
  for (const [key, value] of memoryStore.daily.entries()) {
    if (now > value.resetTime) {
      memoryStore.daily.delete(key);
    }
  }
  
  // Get or create data for this IP
  const minuteData = memoryStore.rateLimit.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  if (now > minuteData.resetTime) {
    minuteData.count = 0;
    minuteData.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  const hourData = memoryStore.hourly.get(ip) || { count: 0, resetTime: now + (60 * 60 * 1000) };
  if (now > hourData.resetTime) {
    hourData.count = 0;
    hourData.resetTime = now + (60 * 60 * 1000);
  }
  
  const dayData = memoryStore.daily.get(ip) || { count: 0, resetTime: now + (24 * 60 * 60 * 1000) };
  if (now > dayData.resetTime) {
    dayData.count = 0;
    dayData.resetTime = now + (24 * 60 * 60 * 1000);
  }
  
  // Check limits BEFORE incrementing counters
  if (minuteData.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetTime: minuteData.resetTime, limitType: 'minute', totalRequests: { minute: minuteData.count, hour: hourData.count, day: dayData.count } };
  }
  
  if (hourData.count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0, resetTime: hourData.resetTime, limitType: 'hour', totalRequests: { minute: minuteData.count, hour: hourData.count, day: dayData.count } };
  }
  
  if (dayData.count >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, remaining: 0, resetTime: dayData.resetTime, limitType: 'day', totalRequests: { minute: minuteData.count, hour: hourData.count, day: dayData.count } };
  }
  
  // Only increment counters if all limits are not exceeded
  minuteData.count++;
  hourData.count++;
  dayData.count++;
  
  memoryStore.rateLimit.set(ip, minuteData);
  memoryStore.hourly.set(ip, hourData);
  memoryStore.daily.set(ip, dayData);
  
  const remaining = Math.min(
    MAX_REQUESTS_PER_WINDOW - minuteData.count,
    MAX_REQUESTS_PER_HOUR - hourData.count,
    MAX_REQUESTS_PER_DAY - dayData.count
  );
  
  return { allowed: true, remaining, resetTime: minuteData.resetTime, totalRequests: { minute: minuteData.count, hour: hourData.count, day: dayData.count } };
};

// Upstash REST rate limiting function
const checkRateLimitUpstash = async (ip: string): Promise<RateLimitResult> => {
  try {
    const client = initializeUpstash();
    const now = Date.now();
    
    // Define time windows
    const minuteWindow = Math.floor(now / RATE_LIMIT_WINDOW);
    const hourWindow = Math.floor(now / (60 * 60 * 1000));
    const dayWindow = Math.floor(now / (24 * 60 * 60 * 1000));
    
    // Create keys for different time windows
    const minuteKey = `rate_limit:minute:${ip}:${minuteWindow}`;
    const hourKey = `rate_limit:hour:${ip}:${hourWindow}`;
    const dayKey = `rate_limit:day:${ip}:${dayWindow}`;
    
    // Get current counts
    const minuteCount = parseInt(await client.get(minuteKey) || '0');
    const hourCount = parseInt(await client.get(hourKey) || '0');
    const dayCount = parseInt(await client.get(dayKey) || '0');
    
    // Check limits BEFORE incrementing
    if (minuteCount >= MAX_REQUESTS_PER_WINDOW) {
      await logIPActivityUpstash(ip, false, 'minute');
      return {
        allowed: false,
        remaining: 0,
        resetTime: (minuteWindow + 1) * RATE_LIMIT_WINDOW,
        limitType: 'minute',
        totalRequests: { minute: minuteCount, hour: hourCount, day: dayCount }
      };
    }
    
    if (hourCount >= MAX_REQUESTS_PER_HOUR) {
      await logIPActivityUpstash(ip, false, 'hour');
      return {
        allowed: false,
        remaining: 0,
        resetTime: (hourWindow + 1) * (60 * 60 * 1000),
        limitType: 'hour',
        totalRequests: { minute: minuteCount, hour: hourCount, day: dayCount }
      };
    }
    
    if (dayCount >= MAX_REQUESTS_PER_DAY) {
      await logIPActivityUpstash(ip, false, 'day');
      return {
        allowed: false,
        remaining: 0,
        resetTime: (dayWindow + 1) * (24 * 60 * 60 * 1000),
        limitType: 'day',
        totalRequests: { minute: minuteCount, hour: hourCount, day: dayCount }
      };
    }
    
    // Increment counters only if all limits are not exceeded
    await client.incr(minuteKey);
    await client.expire(minuteKey, 60); // 1 minute TTL
    await client.incr(hourKey);
    await client.expire(hourKey, 3600); // 1 hour TTL
    await client.incr(dayKey);
    await client.expire(dayKey, 86400); // 1 day TTL
    
    // Log successful request
    await logIPActivityUpstash(ip, true);
    
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
    console.error('Upstash rate limit check failed:', error);
    // Fallback to memory storage
    return checkRateLimitMemory(ip);
  }
};

// Log IP activity (Upstash version)
const logIPActivityUpstash = async (ip: string, allowed: boolean, limitType?: string) => {
  try {
    const client = initializeUpstash();
    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    
    // Create a log entry
    const logEntry = {
      ip,
      timestamp,
      allowed,
      limitType: limitType || 'none',
      userAgent: 'unknown'
    };

    // Store in Upstash with TTL of 30 days
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
    await client.hSet(analyticsKey, 'totalRequests', currentAnalytics.totalRequests.toString());
    await client.hSet(analyticsKey, 'firstSeen', currentAnalytics.firstSeen);
    await client.hSet(analyticsKey, 'lastSeen', currentAnalytics.lastSeen);
    await client.hSet(analyticsKey, 'requestsByMinute', currentAnalytics.requestsByMinute.toString());
    await client.hSet(analyticsKey, 'requestsByHour', currentAnalytics.requestsByHour.toString());
    await client.hSet(analyticsKey, 'requestsByDay', currentAnalytics.requestsByDay.toString());
    await client.hSet(analyticsKey, 'blockedRequests', currentAnalytics.blockedRequests.toString());

    // Set TTL for analytics (30 days)
    await client.expire(analyticsKey, 30 * 24 * 60 * 60);

    console.log(`IP Activity Logged (Upstash): ${ip} - ${allowed ? 'ALLOWED' : 'BLOCKED'} - ${limitType || 'none'}`);
  } catch (error) {
    console.error('Failed to log IP activity:', error);
    // Fallback to memory
    logIPActivityMemory(ip, allowed, limitType);
  }
};

// Log IP activity (memory version)
const logIPActivityMemory = (ip: string, allowed: boolean, limitType?: string) => {
  const now = Date.now();
  const timestamp = new Date(now).toISOString();
  
  const logEntry = {
    ip,
    timestamp,
    allowed,
    limitType: limitType || 'none',
    userAgent: 'unknown'
  };

  // Store in memory
  if (!memoryStore.logs.has(ip)) {
    memoryStore.logs.set(ip, []);
  }
  const logs = memoryStore.logs.get(ip)!;
  logs.unshift(logEntry); // Add to beginning
  if (logs.length > 100) {
    logs.splice(100); // Keep only last 100 logs
  }

  // Update analytics
  const analyticsKey = ip;
  const analytics = memoryStore.analytics.get(analyticsKey) || {
    ip,
    totalRequests: 0,
    firstSeen: timestamp,
    lastSeen: timestamp,
    requestsByMinute: 0,
    requestsByHour: 0,
    requestsByDay: 0,
    blockedRequests: 0
  };

  analytics.totalRequests++;
  analytics.lastSeen = timestamp;
  if (!allowed) {
    analytics.blockedRequests++;
  }

  memoryStore.analytics.set(analyticsKey, analytics);
  console.log(`IP Activity Logged (Memory): ${ip} - ${allowed ? 'ALLOWED' : 'BLOCKED'} - ${limitType || 'none'}`);
};

// Redis-based rate limiting function
const checkRateLimitRedis = async (ip: string): Promise<RateLimitResult> => {
  try {
    const client = await initializeRedis();
    if (!client) {
      return checkRateLimitMemory(ip);
    }

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
      await logIPActivityRedis(ip, false, 'minute');
      return {
        allowed: false,
        remaining: 0,
        resetTime: (minuteWindow + 1) * RATE_LIMIT_WINDOW,
        limitType: 'minute',
        totalRequests: { minute: minuteCount, hour: hourCount, day: dayCount }
      };
    }
    
    if (hourCount >= MAX_REQUESTS_PER_HOUR) {
      await logIPActivityRedis(ip, false, 'hour');
      return {
        allowed: false,
        remaining: 0,
        resetTime: (hourWindow + 1) * (60 * 60 * 1000),
        limitType: 'hour',
        totalRequests: { minute: minuteCount, hour: hourCount, day: dayCount }
      };
    }
    
    if (dayCount >= MAX_REQUESTS_PER_DAY) {
      await logIPActivityRedis(ip, false, 'day');
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
    await logIPActivityRedis(ip, true);
    
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
    // Fallback to memory storage
    return checkRateLimitMemory(ip);
  }
};

// Log IP activity (Redis version)
const logIPActivityRedis = async (ip: string, allowed: boolean, limitType?: string) => {
  try {
    const client = await initializeRedis();
    if (!client) {
      logIPActivityMemory(ip, allowed, limitType);
      return;
    }

    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    
    // Create a log entry
    const logEntry = {
      ip,
      timestamp,
      allowed,
      limitType: limitType || 'none',
      userAgent: 'unknown'
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

    console.log(`IP Activity Logged (Redis): ${ip} - ${allowed ? 'ALLOWED' : 'BLOCKED'} - ${limitType || 'none'}`);
  } catch (error) {
    console.error('Failed to log IP activity:', error);
    // Fallback to memory
    logIPActivityMemory(ip, allowed, limitType);
  }
};

// Main rate limiting function with automatic fallback
export const checkRateLimit = async (ip: string): Promise<RateLimitResult> => {
  const storageType = getStorageType();
  
  if (storageType === 'disabled') {
    // No rate limiting
    return {
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + RATE_LIMIT_WINDOW,
      totalRequests: { minute: 0, hour: 0, day: 0 }
    };
  }
  
  if (storageType === 'memory') {
    return checkRateLimitMemory(ip);
  }
  
  if (storageType === 'upstash-rest') {
    return await checkRateLimitUpstash(ip);
  }
  
  // Try Redis first, fallback to memory
  try {
    return await checkRateLimitRedis(ip);
  } catch (error) {
    console.error('Rate limiting failed, using memory fallback:', error);
    return checkRateLimitMemory(ip);
  }
};

// Get IP analytics with fallback
export const getIPAnalytics = async (ip: string): Promise<IPAnalytics | null> => {
  const storageType = getStorageType();
  
  if (storageType === 'disabled') {
    return null;
  }
  
  if (storageType === 'memory') {
    return memoryStore.analytics.get(ip) || null;
  }
  
  if (storageType === 'upstash-rest') {
    try {
      const client = initializeUpstash();
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
      return memoryStore.analytics.get(ip) || null;
    }
  }
  
  try {
    const client = await initializeRedis();
    if (!client) {
      return memoryStore.analytics.get(ip) || null;
    }

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
    return memoryStore.analytics.get(ip) || null;
  }
};

// Get all IPs with their analytics
export const getAllIPAnalytics = async (): Promise<IPAnalytics[]> => {
  const storageType = getStorageType();
  
  if (storageType === 'disabled') {
    return [];
  }
  
  if (storageType === 'memory') {
    return Array.from(memoryStore.analytics.values());
  }
  
  if (storageType === 'upstash-rest') {
    try {
      const client = initializeUpstash();
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
      return Array.from(memoryStore.analytics.values());
    }
  }
  
  try {
    const client = await initializeRedis();
    if (!client) {
      return Array.from(memoryStore.analytics.values());
    }

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
    return Array.from(memoryStore.analytics.values());
  }
};

// Get IP request logs with fallback
export const getIPLogs = async (ip: string, limit: number = 100): Promise<any[]> => {
  const storageType = getStorageType();
  
  if (storageType === 'disabled') {
    return [];
  }
  
  if (storageType === 'memory') {
    return memoryStore.logs.get(ip)?.slice(0, limit) || [];
  }
  
  if (storageType === 'upstash-rest') {
    try {
      const client = initializeUpstash();
      const logs = await client.lRange(`ip_logs:${ip}`, 0, limit - 1);
      return logs.map(log => JSON.parse(log));
    } catch (error) {
      console.error('Failed to get IP logs:', error);
      return memoryStore.logs.get(ip)?.slice(0, limit) || [];
    }
  }
  
  try {
    const client = await initializeRedis();
    if (!client) {
      return memoryStore.logs.get(ip)?.slice(0, limit) || [];
    }

    const logs = await client.lRange(`ip_logs:${ip}`, 0, limit - 1);
    return logs.map(log => JSON.parse(log));
  } catch (error) {
    console.error('Failed to get IP logs:', error);
    return memoryStore.logs.get(ip)?.slice(0, limit) || [];
  }
};

// Cleanup old data
export const cleanupOldData = async (): Promise<void> => {
  const storageType = getStorageType();
  
  if (storageType === 'disabled' || storageType === 'memory') {
    // Memory cleanup happens automatically
    return;
  }
  
  if (storageType === 'upstash-rest') {
    try {
      const client = initializeUpstash();
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
    return;
  }
  
  try {
    const client = await initializeRedis();
    if (!client) {
      return;
    }

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

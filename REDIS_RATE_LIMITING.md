# Redis-Based Rate Limiting with IP Analytics

This implementation provides comprehensive rate limiting and IP tracking using Redis as the backend storage.

## Features

### 🚦 Rate Limiting
- **1 request per minute** per IP
- **20 requests per hour** per IP  
- **50 requests per day** per IP
- Automatic cleanup of expired data
- Graceful fallback if Redis is unavailable

### 📊 IP Analytics & Logging
- **Detailed request logs** for each IP
- **Analytics dashboard** at `/analytics`
- **Real-time tracking** of request patterns
- **Success/failure rates** per IP
- **First seen / Last seen** timestamps

### 🔍 API Endpoints

#### Rate Limiting
- `POST /api/generate-headshot` - Main API with rate limiting

#### Analytics
- `GET /api/analytics` - Get all IP analytics
- `GET /api/analytics?ip=192.168.1.1` - Get specific IP analytics
- `GET /api/analytics?action=logs&ip=192.168.1.1` - Get IP request logs

## Setup Instructions

### 1. Install Redis

#### macOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

#### Using Docker
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 2. Environment Configuration

Create a `.env.local` file:
```env
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start the Application
```bash
npm run dev
```

### 4. View Analytics Dashboard
Visit: `http://localhost:3000/analytics`

## Redis Data Structure

### Rate Limiting Keys
```
rate_limit:minute:{ip}:{window}  # Minute-based counters
rate_limit:hour:{ip}:{window}     # Hour-based counters  
rate_limit:day:{ip}:{window}     # Day-based counters
```

### Analytics Keys
```
ip_analytics:{ip}                # IP analytics data
ip_logs:{ip}                     # Request logs for IP
```

## Analytics Dashboard Features

### Overview Tab
- **Summary cards**: Total IPs, requests, blocked requests, success rate
- **IP table**: Detailed view of all IPs with statistics
- **Click "View Logs"** to see detailed request history

### Logs Tab
- **Request history** for selected IP
- **Status indicators**: ALLOWED/BLOCKED
- **Limit type**: Which rate limit was triggered
- **Timestamps**: When each request occurred

## API Response Examples

### Successful Request
```json
{
  "image": "data:image/jpeg;base64,...",
  "success": true,
  "prompt": "...",
  "rateLimit": {
    "remaining": 0,
    "resetTime": 1703123456789,
    "totalRequests": {
      "minute": 1,
      "hour": 5,
      "day": 12
    }
  }
}
```

### Rate Limited Request
```json
{
  "error": "Rate limit exceeded: 1 requests per minute",
  "retryAfter": 45,
  "limit": "minute"
}
```

### Analytics Response
```json
{
  "success": true,
  "analytics": [
    {
      "ip": "192.168.1.100",
      "totalRequests": 15,
      "firstSeen": "2023-12-20T10:30:00.000Z",
      "lastSeen": "2023-12-20T15:45:00.000Z",
      "requestsByMinute": 1,
      "requestsByHour": 8,
      "requestsByDay": 15,
      "blockedRequests": 3
    }
  ],
  "summary": {
    "totalIPs": 25,
    "totalRequests": 150,
    "totalBlocked": 12,
    "topIPs": [...]
  }
}
```

## Monitoring & Maintenance

### Automatic Cleanup
- **Logs**: Automatically expire after 30 days
- **Analytics**: Automatically expire after 30 days
- **Rate limits**: Automatically expire based on time windows

### Manual Cleanup
```typescript
import { cleanupOldData } from '@/lib/redis-rate-limit';
await cleanupOldData(); // Remove data older than 30 days
```

### Redis Commands for Debugging
```bash
# View all rate limit keys
redis-cli keys "rate_limit:*"

# View all analytics keys  
redis-cli keys "ip_analytics:*"

# View logs for specific IP
redis-cli lrange "ip_logs:192.168.1.100" 0 -1

# Clear all data (use with caution!)
redis-cli flushall
```

## Production Considerations

### Redis Configuration
- Use **Redis Cluster** for high availability
- Configure **persistence** (RDB + AOF)
- Set appropriate **memory limits**
- Monitor **memory usage** and **connection count**

### Security
- **Restrict Redis access** to application servers only
- Use **Redis AUTH** for authentication
- Consider **Redis ACLs** for fine-grained access control

### Performance
- **Pipeline operations** for better performance
- **Connection pooling** for high concurrency
- **Monitor Redis performance** metrics

## Troubleshooting

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Check Redis status
redis-cli info server

# View Redis logs
tail -f /var/log/redis/redis-server.log
```

### Application Issues
- Check **environment variables** are set correctly
- Verify **Redis URL** format
- Check **network connectivity** to Redis
- Review **application logs** for Redis errors

## Benefits Over In-Memory Storage

✅ **Persistent**: Data survives server restarts  
✅ **Scalable**: Works across multiple server instances  
✅ **Reliable**: Redis handles high concurrency  
✅ **Analytics**: Rich data for monitoring and insights  
✅ **Maintainable**: Easy to debug and monitor  
✅ **Production-ready**: Industry standard solution

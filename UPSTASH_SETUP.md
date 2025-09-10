# Upstash Redis Setup Guide

## 🎯 Your Upstash Configuration

You have: `UPSTASH_REDIS_REST_URL="https://saved-bullfrog-63108.upstash.io"`

## 🔑 Get Your Token

1. Go to [console.upstash.com](https://console.upstash.com)
2. Click on your database: `saved-bullfrog-63108`
3. Find the **"REST Token"** section
4. Copy the token (starts with `AX...`)

## ⚙️ Environment Variables

Create `.env.local`:
```env
STORAGE_TYPE=upstash-rest
UPSTASH_REDIS_REST_URL=https://saved-bullfrog-63108.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
GEMINI_API_KEY=your_gemini_api_key
```

## 🚀 Test Your Setup

```bash
# Test the connection
node -e "
const { checkRateLimit } = require('./src/lib/upstash-rate-limit.ts');
async function test() {
  console.log('Testing Upstash connection...');
  const result = await checkRateLimit('192.168.1.100');
  console.log('Result:', result);
}
test().catch(console.error);
"
```

## ✅ What You Get

- ✅ **Persistent rate limiting** (survives server restarts)
- ✅ **IP analytics** with detailed tracking
- ✅ **Request logs** for each IP
- ✅ **Free tier**: 10,000 requests/day
- ✅ **No local Redis needed**

## 🔄 Fallback System

If Upstash fails, it automatically falls back to:
1. **Memory storage** (temporary)
2. **Disabled** (no rate limiting)

Your app will never break!

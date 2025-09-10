// Test script for Redis-based analytics
const API_URL = 'http://localhost:3000/api/analytics';

async function testAnalytics() {
  console.log('Testing Redis-based Analytics API...\n');

  try {
    // Test getting all analytics
    console.log('1. Testing GET /api/analytics (all analytics):');
    const response = await fetch(API_URL);
    const data = await response.json();
    
    if (data.success) {
      console.log(`  ✅ Success! Found ${data.count} IPs`);
      console.log(`  Summary:`);
      console.log(`    - Total IPs: ${data.summary?.totalIPs || 0}`);
      console.log(`    - Total Requests: ${data.summary?.totalRequests || 0}`);
      console.log(`    - Blocked Requests: ${data.summary?.totalBlocked || 0}`);
      
      if (data.analytics && data.analytics.length > 0) {
        console.log(`  Top IPs:`);
        data.analytics.slice(0, 3).forEach((ip, index) => {
          console.log(`    ${index + 1}. ${ip.ip} - ${ip.totalRequests} requests (${ip.blockedRequests} blocked)`);
        });
      }
    } else {
      console.log(`  ❌ Failed: ${data.error}`);
    }
    
    console.log('\n2. Testing Redis connection directly:');
    const redis = require('redis');
    const client = redis.createClient({ url: 'redis://localhost:6379' });
    
    await client.connect();
    console.log('  ✅ Redis connected successfully');
    
    // Check for rate limit keys
    const rateLimitKeys = await client.keys('rate_limit:*');
    console.log(`  📊 Found ${rateLimitKeys.length} rate limit keys`);
    
    // Check for analytics keys
    const analyticsKeys = await client.keys('ip_analytics:*');
    console.log(`  📈 Found ${analyticsKeys.length} analytics keys`);
    
    // Check for log keys
    const logKeys = await client.keys('ip_logs:*');
    console.log(`  📝 Found ${logKeys.length} log keys`);
    
    await client.disconnect();
    console.log('  ✅ Redis disconnected');
    
  } catch (error) {
    console.error('❌ Analytics test failed:', error.message);
  }
}

// Run the test
testAnalytics().catch(console.error);

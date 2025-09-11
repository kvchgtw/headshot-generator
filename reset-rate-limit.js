// Script to reset rate limit for testing
const { createClient } = require('redis');

async function resetRateLimit() {
  try {
    const client = createClient({ url: 'redis://localhost:6379' });
    await client.connect();
    
    console.log('Connected to Redis');
    
    // Get all rate limit keys
    const keys = await client.keys('rate_limit:*');
    console.log(`Found ${keys.length} rate limit keys`);
    
    if (keys.length > 0) {
      // Delete all rate limit keys
      await client.del(keys);
      console.log('✅ All rate limit keys deleted');
    } else {
      console.log('No rate limit keys found');
    }
    
    await client.disconnect();
    console.log('Rate limit reset complete!');
  } catch (error) {
    console.error('Error resetting rate limit:', error.message);
  }
}

resetRateLimit();

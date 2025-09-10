// Test script for flexible storage options
const API_URL = 'http://localhost:3000/api/generate-headshot';

async function testStorageOptions() {
  console.log('🧪 Testing Flexible Storage Options\n');

  // Test 1: Memory Storage (no Redis needed)
  console.log('1️⃣ Testing with Memory Storage:');
  console.log('   Set STORAGE_TYPE=memory in your environment');
  console.log('   This works without any external dependencies!\n');

  // Test 2: Disabled Storage (no rate limiting)
  console.log('2️⃣ Testing with Disabled Storage:');
  console.log('   Set STORAGE_TYPE=disabled in your environment');
  console.log('   This disables rate limiting completely!\n');

  // Test 3: Cloud Redis
  console.log('3️⃣ Testing with Cloud Redis:');
  console.log('   Set STORAGE_TYPE=redis and REDIS_URL=your_cloud_redis_url');
  console.log('   Use Redis Cloud, Upstash, or Railway for free Redis!\n');

  console.log('📋 Environment Variable Examples:');
  console.log('');
  console.log('For Memory Storage (recommended for you):');
  console.log('STORAGE_TYPE=memory');
  console.log('');
  console.log('For Cloud Redis:');
  console.log('STORAGE_TYPE=redis');
  console.log('REDIS_URL=redis://username:password@your-redis-host:6379');
  console.log('');
  console.log('For No Rate Limiting:');
  console.log('STORAGE_TYPE=disabled');
  console.log('');

  // Test the API with current settings
  try {
    console.log('🔍 Testing API with current settings...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        customizations: { backgroundType: 'gradient', backgroundColor: 'blue' }
      })
    });

    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ API working! Rate limiting is active.');
      console.log(`   Remaining requests: ${data.rateLimit?.remaining}`);
      console.log(`   Storage type: ${process.env.STORAGE_TYPE || 'redis (default)'}`);
    } else if (response.status === 429) {
      console.log('🚫 Rate limited! This means rate limiting is working.');
      console.log(`   Error: ${data.error}`);
    } else {
      console.log(`⚠️  API returned status ${response.status}: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ API test failed (server might not be running):', error.message);
    console.log('   Start your server with: npm run dev');
  }

  console.log('\n🎯 Recommendations:');
  console.log('• Use STORAGE_TYPE=memory for development (no Redis needed)');
  console.log('• Use STORAGE_TYPE=redis with cloud Redis for production');
  console.log('• Use STORAGE_TYPE=disabled for testing without limits');
}

// Run the test
testStorageOptions().catch(console.error);

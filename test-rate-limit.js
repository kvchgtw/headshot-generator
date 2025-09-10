// Simple test script to verify rate limiting
const fs = require('fs');

// Read sample image and convert to base64
const sampleImagePath = './public/sample.jpg';
const imageBuffer = fs.readFileSync(sampleImagePath);
const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

const API_URL = 'http://localhost:3000/api/generate-headshot';

async function testRateLimit() {
  console.log('Testing rate limiting...');
  console.log('Expected limits: 1 request per minute, 20 per hour, 50 per day');
  console.log('Making 3 requests to test minute limit...\n');

  for (let i = 1; i <= 3; i++) {
    try {
      console.log(`Request ${i}:`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          customizations: {
            backgroundType: 'gradient',
            backgroundColor: 'blue',
            clothing: 'formal'
          }
        })
      });

      const data = await response.json();
      
      if (response.status === 429) {
        console.log(`  ❌ Rate limited (expected for request ${i}): ${data.error}`);
        console.log(`  Retry after: ${data.retryAfter} seconds`);
        console.log(`  Limit type: ${data.limit}`);
      } else if (response.status === 200) {
        console.log(`  ✅ Success: ${data.success}`);
        console.log(`  Remaining requests: ${data.rateLimit?.remaining}`);
        console.log(`  Total requests - Minute: ${data.rateLimit?.totalRequests?.minute}, Hour: ${data.rateLimit?.totalRequests?.hour}, Day: ${data.rateLimit?.totalRequests?.day}`);
      } else {
        console.log(`  ⚠️  Unexpected status ${response.status}: ${data.error}`);
      }
      
      console.log('');
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`  ❌ Request ${i} failed: ${error.message}`);
    }
  }
}

// Run the test
testRateLimit().catch(console.error);

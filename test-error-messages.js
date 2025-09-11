// Test script to verify improved rate limit error messages
const API_URL = 'http://localhost:3000/api/generate-headshot';

async function testErrorMessages() {
  console.log('🧪 Testing improved rate limit error messages...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        customizations: { backgroundType: 'gradient', backgroundColor: 'blue' }
      })
    });

    const data = await response.json();
    
    if (response.status === 429) {
      console.log('✅ Rate limit error message test:');
      console.log(`   Error: ${data.error}`);
      console.log(`   Retry after: ${data.retryAfter} seconds`);
      
      if (data.totalRequests) {
        console.log(`   📊 Usage info: ${data.totalRequests.day}/5 images generated today`);
        console.log(`   ⏰ Time until reset: ${Math.floor(data.retryAfter / 3600)} hours and ${Math.floor((data.retryAfter % 3600) / 60)} minutes`);
      }
      
      console.log('\n🎯 Expected user message:');
      const hoursLeft = Math.floor(data.retryAfter / 3600);
      const minutesLeft = Math.floor((data.retryAfter % 3600) / 60);
      const currentUsage = data.totalRequests?.day || 0;
      const remaining = Math.max(0, 5 - currentUsage);
      
      let timeMessage = '';
      if (hoursLeft > 0) {
        timeMessage = `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} and ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
      } else {
        timeMessage = `${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
      }
      
      if (remaining > 0) {
        console.log(`   "Daily limit reached! You've generated ${currentUsage}/5 images today. ${remaining} images remaining. Try again in ${timeMessage}."`);
      } else {
        console.log(`   "Daily limit reached! You've generated ${currentUsage}/5 images today. Try again in ${timeMessage}."`);
      }
      
    } else if (response.status === 200) {
      console.log('✅ Success! Rate limiting is working correctly.');
      console.log(`   Generated: ${data.rateLimit?.totalRequests?.day}/5`);
      console.log(`   Remaining: ${data.rateLimit?.remaining}`);
    } else {
      console.log(`⚠️  Unexpected status ${response.status}: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testErrorMessages().catch(console.error);

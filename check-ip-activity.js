// Script to check IP activity in Upstash Redis
const https = require('https');

// Your Upstash Redis REST API credentials
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://saved-bullfrog-63108.upstash.io';
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_TOKEN) {
  console.error('❌ UPSTASH_REDIS_REST_TOKEN not found in environment variables');
  console.log('Please set UPSTASH_REDIS_REST_TOKEN in your .env.local file');
  process.exit(1);
}

const IP_TO_CHECK = '49.218.94.73';

// Function to make Upstash Redis REST API calls
async function upstashRedisCall(command, key, value = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(UPSTASH_REDIS_REST_URL);
    const postData = JSON.stringify({
      command: command,
      key: key,
      value: value
    });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function checkIPActivity() {
  console.log(`🔍 Checking activity for IP: ${IP_TO_CHECK}\n`);

  try {
    // Check rate limit counter
    console.log('1. 📊 Checking rate limit counter...');
    const rateLimitResult = await upstashRedisCall('GET', `rate_limit:${IP_TO_CHECK}`);
    console.log(`   Rate limit counter: ${rateLimitResult.result || 'No data'}`);

    // Check IP logs
    console.log('\n2. 📝 Checking IP activity logs...');
    const logsResult = await upstashRedisCall('LRANGE', `ip_logs:${IP_TO_CHECK}`, '0 -1');
    console.log(`   Activity logs: ${logsResult.result ? logsResult.result.length : 0} entries`);
    
    if (logsResult.result && logsResult.result.length > 0) {
      console.log('   Recent activities:');
      logsResult.result.slice(0, 5).forEach((log, index) => {
        try {
          const logData = JSON.parse(log);
          console.log(`   ${index + 1}. ${logData.timestamp} - ${logData.action} - ${logData.status}`);
        } catch (e) {
          console.log(`   ${index + 1}. ${log}`);
        }
      });
    }

    // Check if IP exists in any keys
    console.log('\n3. 🔑 Checking all keys containing this IP...');
    const keysResult = await upstashRedisCall('KEYS', `*${IP_TO_CHECK}*`);
    console.log(`   Keys found: ${keysResult.result ? keysResult.result.length : 0}`);
    
    if (keysResult.result && keysResult.result.length > 0) {
      console.log('   Keys:');
      keysResult.result.forEach(key => {
        console.log(`   - ${key}`);
      });
    }

    // Check daily counter specifically
    console.log('\n4. 📅 Checking daily counter...');
    const dailyResult = await upstashRedisCall('GET', `daily_count:${IP_TO_CHECK}`);
    console.log(`   Daily count: ${dailyResult.result || 'No data'}`);

    // Check if there are any keys with similar IPs
    console.log('\n5. 🌐 Checking for similar IP patterns...');
    const similarKeysResult = await upstashRedisCall('KEYS', 'rate_limit:*');
    console.log(`   All rate limit keys: ${similarKeysResult.result ? similarKeysResult.result.length : 0}`);
    
    if (similarKeysResult.result && similarKeysResult.result.length > 0) {
      console.log('   All IPs with rate limits:');
      similarKeysResult.result.forEach(key => {
        const ip = key.replace('rate_limit:', '');
        console.log(`   - ${ip}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking IP activity:', error.message);
  }
}

checkIPActivity();

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/upstash-rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    let clientIP = forwarded?.split(',')[0] || realIp || 'unknown';

    // For development: allow IP override via query parameter
    const { searchParams } = new URL(request.url);
    const overrideIP = searchParams.get('ip');
    if (overrideIP) {
      clientIP = overrideIP;
    }

    // Debug logging
    console.log('Check-usage API called:');
    console.log('  - X-Forwarded-For:', forwarded);
    console.log('  - X-Real-IP:', realIp);
    console.log('  - Override IP:', overrideIP);
    console.log('  - Final IP:', clientIP);

    // Check current usage without incrementing
    const rateLimitResult = await checkRateLimit(clientIP, false); // false = don't increment

    console.log('  - Usage result:', rateLimitResult);

    return NextResponse.json({
      success: true,
      usage: {
        day: rateLimitResult.totalRequests.day,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      },
      debug: {
        detectedIP: clientIP,
        forwarded: forwarded,
        realIp: realIp,
        overrideIP: overrideIP
      }
    });

  } catch (error) {
    console.error('Error checking usage:', error);
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    );
  }
}

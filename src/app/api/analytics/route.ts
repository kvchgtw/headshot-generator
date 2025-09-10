import { NextRequest, NextResponse } from 'next/server';
import { getAllIPAnalytics, getIPAnalytics, getIPLogs } from '@/lib/upstash-rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const action = searchParams.get('action') || 'analytics';
    
    if (action === 'logs' && ip) {
      // Get logs for specific IP
      const logs = await getIPLogs(ip, 100);
      return NextResponse.json({
        success: true,
        ip,
        logs,
        count: logs.length
      });
    } else if (action === 'analytics' && ip) {
      // Get analytics for specific IP
      const analytics = await getIPAnalytics(ip);
      if (!analytics) {
        return NextResponse.json({
          success: false,
          error: 'No data found for this IP'
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        analytics
      });
    } else {
      // Get all IP analytics
      const allAnalytics = await getAllIPAnalytics();
      return NextResponse.json({
        success: true,
        analytics: allAnalytics,
        count: allAnalytics.length,
        summary: {
          totalIPs: allAnalytics.length,
          totalRequests: allAnalytics.reduce((sum, ip) => sum + ip.totalRequests, 0),
          totalBlocked: allAnalytics.reduce((sum, ip) => sum + ip.blockedRequests, 0),
          topIPs: allAnalytics.slice(0, 10)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching IP analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 });
  }
}

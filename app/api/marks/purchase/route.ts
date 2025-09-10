import { NextRequest, NextResponse } from 'next/server';

// This endpoint is deprecated - marks purchase is handled by /api/purchase-marks instead
export async function POST(req: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint is deprecated. Use /api/purchase-marks instead.',
    redirectTo: '/api/purchase-marks'
  }, { status: 410 });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint is deprecated. Use /api/purchase-marks instead.',
    redirectTo: '/api/purchase-marks'
  }, { status: 410 });
}
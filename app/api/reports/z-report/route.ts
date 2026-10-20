import { NextRequest, NextResponse } from 'next/server';
import { getDailyZReport } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = parseInt(searchParams.get('storeId') || '1');
    const date = searchParams.get('date') || undefined;

    const report = getDailyZReport(storeId, date);
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gün sonu Z raporu hesaplanamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

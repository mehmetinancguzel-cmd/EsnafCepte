import { NextResponse } from 'next/server';
import {
  getActiveAuditSession,
  getAuditSessions,
  startAuditSession,
  pauseAuditSession,
  resumeAuditSession,
  cancelAuditSession,
  completeAuditSession,
} from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId') || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : 1;

    const active = getActiveAuditSession(storeId);
    const history = getAuditSessions(storeId);
    return NextResponse.json({ active, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action; // 'START' | 'PAUSE' | 'RESUME' | 'CANCEL' | 'COMPLETE'
    const storeIdParam = body.store_id || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : 1;

    if (action === 'START') {
      const session = startAuditSession(body.name, storeId);
      return NextResponse.json(session, { status: 201 });
    }

    if (action === 'PAUSE') {
      const session = pauseAuditSession(Number(body.sessionId));
      return NextResponse.json(session);
    }

    if (action === 'RESUME') {
      const session = resumeAuditSession(Number(body.sessionId));
      return NextResponse.json(session);
    }

    if (action === 'CANCEL') {
      const session = cancelAuditSession(Number(body.sessionId));
      return NextResponse.json(session);
    }

    if (action === 'COMPLETE') {
      const session = completeAuditSession(Number(body.sessionId), Boolean(body.applyToStock));
      return NextResponse.json(session);
    }

    return NextResponse.json({ error: 'Geçersiz işlem tipi' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

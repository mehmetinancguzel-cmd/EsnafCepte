import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUserPlan, UserPlan } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

function getAuthenticatedUser(request: NextRequest) {
  const tokenCookie = request.cookies.get('esnafcepte_token')?.value;
  const authHeader = request.headers.get('authorization');
  const token = tokenCookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  return token ? verifySessionToken(token) : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const targetUserId = auth ? auth.userId : requestedUserId ? parseInt(requestedUserId) : 1;

    const result = getUserById(targetUserId);
    if (!result) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      store: result.store,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kullanıcı bilgisi alınamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request);
    const body = await request.json();
    const { userId, plan } = body;

    const targetUserId = auth ? auth.userId : Number(userId);

    if (!targetUserId || !plan) {
      return NextResponse.json({ error: 'userId ve plan zorunludur' }, { status: 400 });
    }

    const validPlans: UserPlan[] = ['TRIAL', 'STARTER', 'GROWTH', 'ENTERPRISE'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Geçersiz plan seçimi' }, { status: 400 });
    }

    const result = updateUserPlan(targetUserId, plan);
    return NextResponse.json({
      success: true,
      message: `Paketiniz ${plan} olarak güncellendi!`,
      user: result.user,
      store: result.store,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Plan güncellenemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

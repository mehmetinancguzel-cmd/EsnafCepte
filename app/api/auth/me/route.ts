import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUserPlan, UserPlan } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '1');

    const result = getUserById(userId);
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
    const body = await request.json();
    const { userId, plan } = body;

    if (!userId || !plan) {
      return NextResponse.json({ error: 'userId ve plan zorunludur' }, { status: 400 });
    }

    const validPlans: UserPlan[] = ['TRIAL', 'STARTER', 'GROWTH', 'ENTERPRISE'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Geçersiz plan seçimi' }, { status: 400 });
    }

    const result = updateUserPlan(Number(userId), plan);
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

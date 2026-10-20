import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir.' },
        { status: 400 }
      );
    }

    const result = authenticateUser(email, password);

    return NextResponse.json({
      success: true,
      message: 'Giriş başarılı!',
      user: result.user,
      store: result.store,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Giriş yapılamadı.';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

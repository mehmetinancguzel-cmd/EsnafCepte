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

    const response = NextResponse.json({
      success: true,
      message: 'Giriş başarılı!',
      user: result.user,
      store: result.store,
      token: result.token,
    });

    response.cookies.set('esnafcepte_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 72 * 3600, // 3 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Giriş yapılamadı.';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

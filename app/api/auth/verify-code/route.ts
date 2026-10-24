import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, setUserEmailVerified, getStores } from '@/lib/db';
import { verifyOtpCode } from '@/lib/otp';
import { generateSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, purpose = 'REGISTER_VERIFICATION' } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'E-posta ve 6 haneli doğrulama kodu zorunludur.' },
        { status: 400 }
      );
    }

    // Verify OTP code
    const result = verifyOtpCode(email, purpose, code);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.message || 'Geçersiz doğrulama kodu.' },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı hesabı bulunamadı.' },
        { status: 404 }
      );
    }

    // Mark email as verified
    setUserEmailVerified(user.id);

    const stores = getStores();
    const store = stores.find(s => s.id === user.store_id) || stores[0];

    const { password_hash, ...safeUser } = user;
    safeUser.email_verified = true;

    // Issue official session token
    const token = generateSessionToken({
      userId: safeUser.id,
      storeId: safeUser.store_id,
      role: 'PATRON',
      email: safeUser.email,
      name: safeUser.name,
    });

    const response = NextResponse.json({
      success: true,
      message: purpose === 'REGISTER_VERIFICATION'
        ? 'E-posta adresiniz başarıyla doğrulandı! 14 günlük denemeniz aktif.'
        : '2 Adımlı güvenlik doğrulaması başarılı! Giriş yapıldı.',
      user: safeUser,
      store,
      token,
    });

    response.cookies.set('esnafcepte_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 72 * 3600,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Doğrulama işlemi başarısız.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

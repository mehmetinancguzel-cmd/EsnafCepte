import { NextRequest, NextResponse } from 'next/server';
import { loadDb, getStores } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { saveOtpCode, sendOtpNotification, maskEmail, maskPhone } from '@/lib/otp';

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

    const db = loadDb();
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı. Lütfen kontrol ediniz.' },
        { status: 401 }
      );
    }

    // 2-Step Security Verification (2FA / OTP Code) - Aktifse 2FA çalışır, değilse Pasif Mod devrededir
    const is2FaEnabled = process.env.ENABLE_2FA === 'true';

    if (is2FaEnabled) {
      const { code } = saveOtpCode(user.email, 'LOGIN_2FA', 'EMAIL', 10);

      await sendOtpNotification({
        channel: 'EMAIL',
        recipient: user.email,
        code,
        purpose: 'LOGIN_2FA',
      });

      return NextResponse.json({
        success: true,
        require2FA: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        maskedPhone: maskPhone(user.phone),
        channel: 'EMAIL',
        message: 'Güvenliğiniz için 6 haneli giriş kodunuz e-posta adresinize (SMS altyapısı hazır) gönderildi.',
      });
    }

    // 2FA Pasif Mod: Doğrudan güvenli oturum aç ve oturum token'ını oluştur
    const stores = getStores();
    const store = stores.find(s => s.id === user.store_id) || stores[0];
    const { password_hash, ...safeUser } = user;

    const { generateSessionToken } = await import('@/lib/auth');
    const token = generateSessionToken({
      userId: safeUser.id,
      storeId: safeUser.store_id,
      role: 'PATRON',
      email: safeUser.email,
      name: safeUser.name,
    });

    const response = NextResponse.json({
      success: true,
      require2FA: false,
      user: safeUser,
      store,
      token,
      message: 'Giriş başarılı!',
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
    const message = err instanceof Error ? err.message : 'Giriş yapılamadı.';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

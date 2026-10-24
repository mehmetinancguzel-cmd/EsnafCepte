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

    // 2-Step Security Verification (2FA / OTP Code)
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Giriş yapılamadı.';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

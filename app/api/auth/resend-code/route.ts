import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { saveOtpCode, sendOtpNotification, OtpChannel } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, purpose = 'REGISTER_VERIFICATION', channel = 'EMAIL' } = body;

    if (!email) {
      return NextResponse.json({ error: 'E-posta adresi zorunludur.' }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    const recipient = channel === 'SMS' ? (user.phone || email) : user.email;
    const { code } = saveOtpCode(user.email, purpose, channel as OtpChannel, 10);

    await sendOtpNotification({
      channel: channel as OtpChannel,
      recipient,
      code,
      purpose,
    });

    return NextResponse.json({
      success: true,
      message: `Yeni doğrulama kodu ${channel === 'SMS' ? 'telefonunuza' : 'e-posta adresinize'} gönderildi.`,
      devCode: code, // Convenient for instant testing
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kod tekrar gönderilemedi.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

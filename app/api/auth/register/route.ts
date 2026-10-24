import { NextRequest, NextResponse } from 'next/server';
import { registerStoreAndUser, StoreSector } from '@/lib/db';
import { saveOtpCode, sendOtpNotification, maskEmail } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, email, phone, password, storeName, sector, address, seedTemplate } = body;

    if (!userName || !email || !password || !storeName || !sector) {
      return NextResponse.json(
        { error: 'Lütfen zorunlu alanları doldurunuz (Yetkili Adı, E-posta, Şifre, İşletme Adı, Sektör)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifreniz en az 6 karakter olmalıdır.' },
        { status: 400 }
      );
    }

    const validSectors: StoreSector[] = ['KIRTASIYE_TUHAFIYE', 'MARKET', 'BUTIK_GIYIM', 'HIRDAVAT', 'DIGER'];
    const chosenSector = validSectors.includes(sector) ? sector : 'DIGER';

    const result = registerStoreAndUser({
      userName,
      email,
      phone: phone || '',
      password,
      storeName,
      sector: chosenSector,
      address: address || '',
      seedTemplate: seedTemplate !== false,
    });

    // Generate 6-Digit Email Verification Code (Expires in 15 mins)
    const { code } = saveOtpCode(result.user.email, 'REGISTER_VERIFICATION', 'EMAIL', 15);

    await sendOtpNotification({
      channel: 'EMAIL',
      recipient: result.user.email,
      code,
      purpose: 'REGISTER_VERIFICATION',
    });

    return NextResponse.json({
      success: true,
      requireVerification: true,
      email: result.user.email,
      maskedEmail: maskEmail(result.user.email),
      message: 'Hesabınız başarıyla oluşturuldu! Lütfen e-postanıza gönderilen 6 haneli doğrulama kodunu giriniz.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

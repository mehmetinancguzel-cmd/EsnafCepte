import crypto from 'crypto';

export type OtpChannel = 'EMAIL' | 'SMS';

export interface OtpRecord {
  code: string;
  expiresAt: number; // timestamp in ms
  channel: OtpChannel;
  recipient: string; // email or phone
  purpose: 'REGISTER_VERIFICATION' | 'LOGIN_2FA' | 'PASSWORD_RESET';
  attempts: number;
}

// In-memory / fast cache for temporary OTP verification codes
const otpStore = new Map<string, OtpRecord>();
// Temporary blocklist for identifiers with too many failed attempts
const lockStore = new Map<string, number>();

/**
 * Generate a cryptographically secure 6-digit numeric OTP code
 */
export function generateNumericOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Store an OTP code for a user identifier (email or phone)
 */
export function saveOtpCode(
  identifier: string,
  purpose: OtpRecord['purpose'],
  channel: OtpChannel = 'EMAIL',
  expiresInMinutes: number = 10
): { code: string; expiresAt: number } {
  const cleanId = identifier.trim().toLowerCase();
  const code = generateNumericOtp();
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  const key = `${cleanId}_${purpose}`;
  otpStore.set(key, {
    code,
    expiresAt,
    channel,
    recipient: cleanId,
    purpose,
    attempts: 0,
  });

  return { code, expiresAt };
}

/**
 * Verify an OTP code with brute-force rate limiting (Max 5 attempts)
 */
export function verifyOtpCode(
  identifier: string,
  purpose: OtpRecord['purpose'],
  enteredCode: string
): { valid: boolean; message?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const lockKey = `${cleanId}_locked`;
  const lockedUntil = lockStore.get(lockKey);

  if (lockedUntil && Date.now() < lockedUntil) {
    const remainingMins = Math.ceil((lockedUntil - Date.now()) / 60000);
    return {
      valid: false,
      message: `Çok fazla hatalı kod denendi. Hesabınız ${remainingMins} dakika süreyle geçici olarak kilitlendi.`,
    };
  }

  const key = `${cleanId}_${purpose}`;
  const record = otpStore.get(key);

  if (!record) {
    return { valid: false, message: 'Doğrulama kodu bulunamadı veya süresi doldu. Lütfen yeni kod isteyiniz.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, message: 'Doğrulama kodunun 10 dakikalık süresi doldu. Lütfen yeni kod talep ediniz.' };
  }

  // Increment attempts
  record.attempts = (record.attempts || 0) + 1;

  if (record.code !== enteredCode.trim()) {
    const remaining = 5 - record.attempts;
    if (remaining <= 0) {
      otpStore.delete(key);
      lockStore.set(lockKey, Date.now() + 15 * 60 * 1000); // 15 min lock
      return {
        valid: false,
        message: '5 kez hatalı kod girildi. Güvenliğiniz için bu işlem 15 dakika süreyle kilitlendi.',
      };
    }
    return {
      valid: false,
      message: `Girdiğiniz 6 haneli kod hatalı. Kalan deneme hakkı: ${remaining}`,
    };
  }

  // Remove upon successful verification (one-time use)
  otpStore.delete(key);
  lockStore.delete(lockKey);
  return { valid: true };
}

/**
 * Dispatch verification code notification (Email / SMS)
 * Structured modularly for plugging in Netgsm, IletiMerkezi, Twilio or SMTP
 */
export async function sendOtpNotification(params: {
  channel: OtpChannel;
  recipient: string;
  code: string;
  purpose: OtpRecord['purpose'];
}): Promise<{ success: boolean; channel: OtpChannel; info: string }> {
  const { channel, recipient, code, purpose } = params;

  if (channel === 'SMS') {
    // SMS Entegratör Köprüsü (İleride Netgsm / İletiMerkezi / Mutlucell API Key buraya bağlanır)
    console.log(`[SMS GATEWAY] Alıcı: ${recipient} -> Mesaj: "EsnafCepte güvenlik doğrulama kodunuz: ${code}. Kimseyle paylaşmayınız."`);
    return {
      success: true,
      channel: 'SMS',
      info: `${recipient} numaralı telefona SMS gönderildi.`,
    };
  }

  // E-Posta Entegratör Köprüsü (SMTP / Resend / AWS SES)
  console.log(`[EMAIL GATEWAY] Alıcı: ${recipient} -> Konu: "EsnafCepte Doğrulama Kodunuz: ${code}"`);
  return {
    success: true,
    channel: 'EMAIL',
    info: `${recipient} adresine doğrulama e-postası gönderildi.`,
  };
}

/**
 * Mask email for privacy display (e.g., ahmet***@gmail.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user}***@${domain}`;
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
}

/**
 * Mask phone number for privacy display (e.g., 0532 *** ** 30)
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 10) return phone;
  return `${clean.slice(0, 4)} *** ** ${clean.slice(-2)}`;
}

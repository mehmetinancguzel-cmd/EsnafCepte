import crypto from 'crypto';

export interface TokenPayload {
  userId: number;
  storeId: number;
  role: 'PATRON' | 'KASIYER';
  email: string;
  name: string;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'inanora_esnafcepte_secure_session_secret_2026';

/**
 * PBKDF2 Password Hashing with Salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against salt:hash format or legacy plain-text (auto-upgradeable)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  // If stored as salt:hash
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === key;
  }
  // Fallback for legacy plain text seeds
  return password === storedHash;
}

/**
 * Lightweight secure HMAC-SHA256 Token generator (zero-dependency JWT alternative)
 */
export function generateSessionToken(payload: Omit<TokenPayload, 'exp'>, expiresInHours: number = 72): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const fullPayload: TokenPayload = { ...payload, exp };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): TokenPayload | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
      
    if (signature !== expectedSig) return null;
    
    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

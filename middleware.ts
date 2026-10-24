import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || '2dsmzVs+JreYr1sZ52tqt/WqZTQdpx7vCvNijiyh6bLZy9M5MFdmBnDT+etnmfq3';

// Public endpoints that do not require authentication
const PUBLIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/brosur',
  '/tanitim',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-code',
  '/api/auth/resend-code',
  '/api/stores/verify-pin',
];

async function verifyHmacSha256(headerAndBody: string, signatureBase64Url: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert base64url to Uint8Array
    const base64 = signatureBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const binary = atob(padded);
    const sigBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      sigBytes[i] = binary.charCodeAt(i);
    }

    const dataBytes = encoder.encode(headerAndBody);
    return await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set default security headers on all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Allow static files, page routes, and public auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.some(path => pathname.startsWith(path)) ||
    pathname === '/'
  ) {
    return response;
  }

  // For API endpoints, verify session token if present
  if (pathname.startsWith('/api/')) {
    const token =
      request.cookies.get('esnafcepte_token')?.value ||
      (request.headers.get('authorization')?.startsWith('Bearer ')
        ? request.headers.get('authorization')!.slice(7)
        : null);

    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const [header, body, signature] = parts;
        const isValid = await verifyHmacSha256(`${header}.${body}`, signature, JWT_SECRET);
        if (isValid) {
          try {
            const base64 = body.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
            const payload = JSON.parse(atob(padded));

            if (payload.exp && payload.exp >= Math.floor(Date.now() / 1000)) {
              // Valid session: forward authenticated identity
              const requestHeaders = new Headers(request.headers);
              requestHeaders.set('x-authenticated-user-id', String(payload.userId));
              requestHeaders.set('x-authenticated-store-id', String(payload.storeId));
              requestHeaders.set('x-authenticated-role', payload.role);

              return NextResponse.next({
                request: {
                  headers: requestHeaders,
                },
                headers: response.headers,
              });
            }
          } catch {
            // malformed payload
          }
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

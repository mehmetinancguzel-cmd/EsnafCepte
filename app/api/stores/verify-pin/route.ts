import { NextRequest, NextResponse } from 'next/server';
import { getStores } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId = 1, pin } = body;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN kodu zorunludur' }, { status: 400 });
    }

    const stores = getStores();
    const store = stores.find(s => s.id === Number(storeId));

    if (!store) {
      return NextResponse.json({ error: 'Mağaza bulunamadı' }, { status: 404 });
    }

    const expectedPin = store.patron_pin || '1234';
    const isValid = pin.trim() === expectedPin;

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: 'Hatalı PIN Kodu! Lütfen tekrar deneyin.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'PIN kodu doğrulandı',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PIN doğrulanamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { updateStoreSettings, getStores } from '@/lib/db';

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('storeId');
  if (!storeId) {
    return NextResponse.json({ error: 'storeId zorunludur' }, { status: 400 });
  }
  const stores = getStores();
  const store = stores.find(s => s.id === Number(storeId));
  if (!store) {
    return NextResponse.json({ error: 'Mağaza bulunamadı' }, { status: 404 });
  }
  return NextResponse.json(store);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, ...settings } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId zorunludur' }, { status: 400 });
    }

    const updatedStore = updateStoreSettings(Number(storeId), settings);
    return NextResponse.json(updatedStore);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ayarlar güncellenemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

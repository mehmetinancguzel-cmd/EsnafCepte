import { NextRequest, NextResponse } from 'next/server';
import { updateStoreSupplierSettings, getStores } from '@/lib/db';

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
  return NextResponse.json({
    storeId: store.id,
    auto_supplier_whatsapp: store.auto_supplier_whatsapp ?? false,
    supplier_name: store.supplier_name ?? '',
    supplier_phone: store.supplier_phone ?? '',
    patron_pin: store.patron_pin || '1234',
    tax_id: store.tax_id || '',
    tax_office: store.tax_office || '',
    scale_prefix: store.scale_prefix || '27',
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      auto_supplier_whatsapp,
      supplier_name,
      supplier_phone,
      patron_pin,
      tax_id,
      tax_office,
      scale_prefix,
    } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId zorunludur' }, { status: 400 });
    }

    const updatedStore = updateStoreSupplierSettings(Number(storeId), {
      auto_supplier_whatsapp,
      supplier_name,
      supplier_phone,
      patron_pin,
      tax_id,
      tax_office,
      scale_prefix,
    });

    return NextResponse.json(updatedStore);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Tedarikçi ayarları güncellenemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

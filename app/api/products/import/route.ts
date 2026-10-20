import { NextResponse } from 'next/server';
import { bulkImportProducts } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const products = body.products;
    const updateExisting = body.updateExisting !== undefined ? Boolean(body.updateExisting) : true;
    const storeIdParam = body.store_id || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : 1;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'İçe aktarılacak geçerli ürün listesi bulunamadı' }, { status: 400 });
    }

    const result = bulkImportProducts(products, storeId, updateExisting);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

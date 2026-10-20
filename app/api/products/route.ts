import { NextResponse } from 'next/server';
import { getProducts, getProductByBarcode, saveProduct } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const storeIdParam = searchParams.get('storeId') || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : undefined;

    if (barcode) {
      const product = getProductByBarcode(barcode, storeId);
      if (!product) {
        return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    let products = getProducts(storeId);

    if (category && category !== 'TÜMÜ') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (q) {
      const lower = q.toLowerCase();
      products = products.filter(
        p =>
          p.name.toLowerCase().includes(lower) ||
          p.barcode.includes(lower) ||
          (p.variant && p.variant.toLowerCase().includes(lower))
      );
    }

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const storeIdParam = request.headers.get('x-store-id');
    if (!body.store_id && storeIdParam) {
      body.store_id = Number(storeIdParam);
    }
    const product = saveProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

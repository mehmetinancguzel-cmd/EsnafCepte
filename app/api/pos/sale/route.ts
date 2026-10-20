import { NextResponse } from 'next/server';
import { createSale, getSales } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Sepette ürün bulunmalıdır' }, { status: 400 });
    }

    const storeIdParam = body.store_id || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : 1;

    const sale = createSale({
      store_id: storeId,
      payment_method: body.payment_method || 'NAKIT',
      discount: Number(body.discount || 0),
      customer_id: body.customer_id ? Number(body.customer_id) : undefined,
      items: body.items,
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId') || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : undefined;
    const sales = getSales(storeId);
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

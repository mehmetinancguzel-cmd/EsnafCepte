import { NextResponse } from 'next/server';
import { getStockMovements, addStockMovement } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId') || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : undefined;
    const movements = getStockMovements(storeId);
    return NextResponse.json(movements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const storeIdParam = body.store_id || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : 1;

    const movement = addStockMovement({
      store_id: storeId,
      product_id: Number(body.product_id),
      type: body.type, // 'GIRIS' | 'CIKIS' | 'IADE'
      quantity: Number(body.quantity),
      note: body.note,
    });
    return NextResponse.json(movement, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

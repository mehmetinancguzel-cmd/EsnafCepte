import { NextResponse } from 'next/server';
import { getCustomers, saveCustomer } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId') || request.headers.get('x-store-id');
    const storeId = storeIdParam ? Number(storeIdParam) : undefined;
    const customers = getCustomers(storeId);
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.phone) {
      return NextResponse.json({ error: 'Müşteri adı ve telefon numarası zorunludur' }, { status: 400 });
    }

    const storeIdParam = body.store_id || request.headers.get('x-store-id');
    body.store_id = storeIdParam ? Number(storeIdParam) : 1;

    const customer = saveCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

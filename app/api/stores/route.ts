import { NextResponse } from 'next/server';
import { getStores, createStore, StoreSector } from '@/lib/db';

export async function GET() {
  try {
    const stores = getStores();
    return NextResponse.json(stores);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.sector) {
      return NextResponse.json({ error: 'Mağaza adı ve sektörü zorunludur' }, { status: 400 });
    }

    const store = createStore({
      name: body.name,
      sector: body.sector as StoreSector,
      phone: body.phone,
      address: body.address,
      seedTemplate: body.seedTemplate !== false, // default true
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

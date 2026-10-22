import { NextRequest, NextResponse } from 'next/server';
import { getSuppliers, addSupplier, deleteSupplier, recordSupplierPayment, getSupplierTransactions } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = parseInt(searchParams.get('storeId') || '1');
    const supplierId = searchParams.get('supplierId') ? parseInt(searchParams.get('supplierId')!) : undefined;
    const history = searchParams.get('history') === 'true';

    if (history) {
      const transactions = getSupplierTransactions(supplierId, storeId);
      return NextResponse.json(transactions);
    }

    const suppliers = getSuppliers(storeId);
    return NextResponse.json(suppliers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Toptancılar listelenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, storeId = 1 } = body;

    if (action === 'PAYMENT') {
      const { supplierId, amount, paymentMethod, note } = body;
      const tx = recordSupplierPayment({
        storeId: Number(storeId),
        supplierId: Number(supplierId),
        amount: Number(amount),
        paymentMethod,
        note,
      });
      return NextResponse.json({ success: true, transaction: tx });
    }

    const { name, company_name, phone, email, address, tax_id, tax_office, initial_balance } = body;
    if (!name || !phone) {
      return NextResponse.json({ error: 'Toptancı adı ve telefon zorunludur' }, { status: 400 });
    }

    const supplier = addSupplier({
      store_id: Number(storeId),
      name,
      company_name,
      phone,
      email,
      address,
      tax_id,
      tax_office,
      initial_balance: Number(initial_balance || 0),
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Toptancı kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    const storeId = parseInt(searchParams.get('storeId') || '1');

    const success = deleteSupplier(id, storeId);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Toptancı silinemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

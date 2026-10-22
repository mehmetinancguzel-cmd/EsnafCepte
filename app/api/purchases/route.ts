import { NextRequest, NextResponse } from 'next/server';
import { getPurchaseInvoices, createPurchaseInvoice } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = parseInt(searchParams.get('storeId') || '1');
    const invoices = getPurchaseInvoices(storeId);
    return NextResponse.json(invoices);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Alış faturaları listelenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId = 1, supplierId, invoiceNo, invoiceDate, dueDate, items, paidAmount, paymentMethod, note } = body;

    if (!supplierId || !invoiceNo || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Toptancı, Fatura No ve en az 1 kalem ürün gereklidir' }, { status: 400 });
    }

    const invoice = createPurchaseInvoice({
      storeId: Number(storeId),
      supplierId: Number(supplierId),
      invoiceNo,
      invoiceDate,
      dueDate,
      items,
      paidAmount: Number(paidAmount || 0),
      paymentMethod,
      note,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Alış faturası kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createRefund } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { store_id, barcode, quantity, refund_amount, payment_method, customer_id, reason } = body;

    if (!barcode) {
      return NextResponse.json({ error: 'Barkod zorunludur' }, { status: 400 });
    }

    if (!quantity || Number(quantity) <= 0) {
      return NextResponse.json({ error: 'Geçerli bir iade adedi giriniz' }, { status: 400 });
    }

    if (refund_amount === undefined || Number(refund_amount) < 0) {
      return NextResponse.json({ error: 'Geçerli bir iade tutarı giriniz' }, { status: 400 });
    }

    const result = createRefund({
      store_id: Number(store_id || 1),
      barcode: String(barcode).trim(),
      quantity: Number(quantity),
      refund_amount: Number(refund_amount),
      payment_method: payment_method || 'NAKIT',
      customer_id: customer_id ? Number(customer_id) : undefined,
      reason: reason || 'Müşteri İadesi',
    });

    return NextResponse.json({
      success: true,
      message: `${result.product.name} için ${result.movement.quantity} ${result.product.unit} iade alındı.`,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'İade işlemi gerçekleştirilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

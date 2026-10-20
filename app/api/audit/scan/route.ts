import { NextResponse } from 'next/server';
import { scanAuditBarcode } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.sessionId || !body.barcode) {
      return NextResponse.json({ error: 'sessionId ve barcode zorunludur' }, { status: 400 });
    }

    const result = scanAuditBarcode({
      sessionId: Number(body.sessionId),
      barcode: body.barcode,
      quantityDelta: body.quantityDelta !== undefined ? Number(body.quantityDelta) : undefined,
      absoluteQuantity: body.absoluteQuantity !== undefined ? Number(body.absoluteQuantity) : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

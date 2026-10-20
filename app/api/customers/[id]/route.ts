import { NextResponse } from 'next/server';
import { getCustomerById, getCustomerTransactions, addCustomerPayment } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = Number(id);
    const customer = getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 });
    }

    const transactions = getCustomerTransactions(customerId);
    return NextResponse.json({ customer, transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = Number(id);
    const body = await request.json();

    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Geçerli bir ödeme tutarı giriniz' }, { status: 400 });
    }

    const tx = addCustomerPayment({
      customer_id: customerId,
      amount: amount,
      note: body.note || 'Tahsilat',
    });

    const updatedCustomer = getCustomerById(customerId);
    return NextResponse.json({ transaction: tx, customer: updatedCustomer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

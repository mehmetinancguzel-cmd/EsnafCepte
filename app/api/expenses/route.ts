import { NextRequest, NextResponse } from 'next/server';
import { addExpense, getExpenses, deleteExpense } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = parseInt(searchParams.get('storeId') || '1');
    const expenses = getExpenses(storeId);
    return NextResponse.json(expenses);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Giderler listelenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, title, category, amount, note } = body;

    if (!storeId || !title || !amount) {
      return NextResponse.json(
        { error: 'Mağaza, masraf başlığı ve tutar zorunludur' },
        { status: 400 }
      );
    }

    const expense = addExpense({
      storeId: Number(storeId),
      title,
      category: category || 'DIGER',
      amount: Number(amount),
      note,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gider kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    const storeId = parseInt(searchParams.get('storeId') || '1');

    const success = deleteExpense(id, storeId);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gider silinemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

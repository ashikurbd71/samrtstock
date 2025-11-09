import { NextResponse } from 'next/server';
import { dbConnect } from '@/app/lib/dbConnect';
import { Product, Transaction } from '@/app/lib/models';

export const runtime = 'nodejs';

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const { product, type, quantity } = body || {};

  if (!product || !type || typeof quantity !== 'number' || quantity <= 0) {
    return NextResponse.json({ error: 'product, type, quantity>0 are required' }, { status: 400 });
  }
  if (!['IN', 'OUT', 'RESTOCK', 'RETURN'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const prod = await Product.findById(product);
  if (!prod) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const tx = await Transaction.create({ product, type, quantity });

  let newStock = prod.totalStock;
  if (type === 'OUT') {
    newStock = Math.max(0, newStock - quantity);
  } else if (type === 'IN' || type === 'RESTOCK') {
    newStock = newStock + quantity;
  } else if (type === 'RETURN') {
    // no change to stock for returns
    newStock = newStock;
  }
  prod.totalStock = newStock;
  await prod.save();

  // Log events: STOCKED for IN/RESTOCK, REFUNDED for RETURN, OUT_OF_STOCK when stock hits 0 after OUT
  try {
    const { Log } = await import('@/app/lib/models');
    if (type === 'IN' || type === 'RESTOCK') {
      await Log.create({ product, event: 'STOCKED' });
    } else if (type === 'RETURN') {
      await Log.create({ product, event: 'REFUNDED' });
    } else if (type === 'OUT' && newStock === 0) {
      await Log.create({ product, event: 'OUT_OF_STOCK' });
    }
  } catch (_e) {
    // silently ignore logging failures to not block transactions
  }

  return NextResponse.json({ transaction: tx, product: prod }, { status: 201 });
}
import { NextResponse } from 'next/server';
import { dbConnect } from '@/app/lib/dbConnect';
import { Product, Transaction } from '@/app/lib/models';

export const runtime = 'nodejs';

function getDayRange(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');

  const { start, end } = getDayRange(dateParam);

  const txs = await Transaction.find({
    createdAt: { $gte: start, $lte: end }
  }).populate('product');

  const products = await Product.find({});
  const productMap = new Map(products.map(p => [String(p._id), p]));

  const aggregate = new Map();
  for (const tx of txs) {
    const pid = String(tx.product._id);
    if (!aggregate.has(pid)) {
      aggregate.set(pid, {
        productId: pid,
        productName: tx.product.name,
        totals: { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0 },
        finalStock: productMap.get(pid)?.totalStock ?? 0,
      });
    }
    const item = aggregate.get(pid);
    item.totals[tx.type] += tx.quantity;
  }

  const report = Array.from(aggregate.values());
  return NextResponse.json({
    date: dateParam || new Date().toISOString().slice(0, 10),
    report,
  });
}
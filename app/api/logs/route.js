import { NextResponse } from 'next/server';
import { dbConnect } from '@/app/lib/dbConnect';
import { Log, Transaction, Product } from '@/app/lib/models';

export const runtime = 'nodejs';

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product');
  const dateParam = searchParams.get('date');
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const newOnlyParam = searchParams.get('newOnly');
  const newOnly = newOnlyParam === '1' || newOnlyParam === 'true';

  const query = {};
  if (productId) {
    query.product = productId;
  }

  // Replace string-based UTC parsing with local date construction
  function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  function getDayRange(dateStr) {
    const base = parseLocalDate(dateStr);
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999);
    return { start, end };
  }
  function parseDateTime(dateStr, timeOrIso) {
    if (!timeOrIso) return null;
    if (timeOrIso.includes('T')) return new Date(timeOrIso); // allow ISO
    // Treat as local HH:mm within provided date
    const [hh, mm] = timeOrIso.split(':').map(Number);
    const base = parseLocalDate(dateStr);
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, 0, 0);
  }

  if (dateParam) {
    const { start, end } = getDayRange(dateParam);
    const fromDt = parseDateTime(dateParam, fromParam);
    const toDt = parseDateTime(dateParam, toParam);
    query.createdAt = {
      ...(fromDt ? { $gte: fromDt } : { $gte: start }),
      ...(toDt ? { $lte: toDt } : { $lte: end }),
    };
  } else if (fromParam || toParam) {
    // Interpret standalone time filters as times on today's local date
    const todayStr = new Date().toISOString().slice(0, 10);
    const { start, end } = getDayRange(todayStr);
    const fromDt = parseDateTime(todayStr, fromParam);
    const toDt = parseDateTime(todayStr, toParam);
    query.createdAt = {
      ...(fromDt ? { $gte: fromDt } : { $gte: start }),
      ...(toDt ? { $lte: toDt } : { $lte: end }),
    };
  }

  const logs = await Log.find(query).populate('product').sort({ createdAt: -1 });

  // Build per-product counts from logs within the current filter
  const productCounts = new Map();
  const productIds = [];
  for (const lg of logs) {
    const pid = lg.product?._id?.toString() || lg.product?.toString();
    if (!pid) continue;
    productCounts.set(pid, (productCounts.get(pid) || 0) + 1);
    if (!productIds.includes(pid)) productIds.push(pid);
  }

  const txQuery = {};
  if (productIds.length) txQuery.product = { $in: productIds };
  if (query.createdAt) txQuery.createdAt = query.createdAt;

  const txs = await Transaction.find(txQuery).select('product type quantity createdAt');
  const txTotalsByProduct = new Map();
  for (const tx of txs) {
    const pid = tx.product?.toString();
    if (!pid) continue;
    const totals = txTotalsByProduct.get(pid) || { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0 };
    totals[tx.type] += tx.quantity;
    txTotalsByProduct.set(pid, totals);
  }

  const eventToTxType = {
    STOCKED: { type: 'IN', label: 'stock in' },
    OUT_OF_STOCK: { type: 'OUT', label: 'stock out' },
    REFUNDED: { type: 'RETURN', label: 'refund' },
  };

  const augmented = logs.map((lg) => {
    const pid = lg.product?._id?.toString() || lg.product?.toString();
    const count = pid ? (productCounts.get(pid) || 0) : 0;
    const mapping = eventToTxType[lg.event] || { type: null, label: '' };
    const totals = pid ? (txTotalsByProduct.get(pid) || { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0 }) : { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0 };
    const stockAmount = mapping.type ? totals[mapping.type] : 0;

    return {
      ...lg.toObject(),
      summary: {
        count,
        stockAmount,
        stockLabel: mapping.label,
      },
    };
  });

  return NextResponse.json(augmented);
}

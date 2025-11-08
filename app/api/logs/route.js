// In module imports (add Transaction, Product)
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

  // Build createdAt range filter: supports date-only and time window within date,
  // or ISO from/to without date.
  function getDayRange(dateStr) {
    const date = new Date(dateStr);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  function parseDateTime(dateStr, timeOrIso) {
    if (!timeOrIso) return null;
    if (timeOrIso.includes('T')) return new Date(timeOrIso);
    // Treat as HH:mm within provided date
    return new Date(`${dateStr}T${timeOrIso}:00`);
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
    const createdAt = {};
    if (fromParam) createdAt.$gte = new Date(fromParam);
    if (toParam) createdAt.$lte = new Date(toParam);
    query.createdAt = createdAt;
  }
  const logs = await Log.find(query).populate('product').sort({ createdAt: -1 });

  // Build per-product counts from logs
  const productCounts = new Map();
  const productIds = [];
  for (const lg of logs) {
    const pid = lg.product?._id?.toString() || lg.product?.toString();
    if (!pid) continue;
    productCounts.set(pid, (productCounts.get(pid) || 0) + 1);
    if (!productIds.includes(pid)) productIds.push(pid);
  }

  // Map log event -> transaction type + label
  const eventToTxType = {
    STOCKED: { type: 'IN', label: 'stock in' },
    OUT_OF_STOCK: { type: 'OUT', label: 'stock out' },
    REFUNDED: { type: 'RETURN', label: 'refund' },
  };

  // Query transactions for the same products in the same time window
  const txQuery = {};
  if (productIds.length) txQuery.product = { $in: productIds };
  if (query.createdAt) txQuery.createdAt = query.createdAt;

  const txs = await Transaction.find(txQuery).select('product type quantity createdAt');

  // Index transactions by product+type and sort by createdAt for nearest matching
  const txByProductType = new Map();
  for (const tx of txs) {
    const pid = tx.product?.toString();
    if (!pid) continue;
    const key = `${pid}:${tx.type}`;
    const arr = txByProductType.get(key) || [];
    arr.push(tx);
    txByProductType.set(key, arr);
  }
  for (const [key, arr] of txByProductType) {
    arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  // Helper: find nearest transaction quantity to a log's timestamp for the mapped type
  function findNearestActionQuantity(pid, type, logDate) {
    if (!pid || !type) return 0;
    const key = `${pid}:${type}`;
    const arr = txByProductType.get(key) || [];
    if (arr.length === 0) return 0;
    const t = new Date(logDate).getTime();
    let bestQty = 0;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (const tx of arr) {
      const diff = Math.abs(new Date(tx.createdAt).getTime() - t);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestQty = tx.quantity || 0;
      }
    }
    return bestQty;
  }

  // Attach per-action quantity and count to each log item
  const augmented = logs.map((lg) => {
    const pid = lg.product?._id?.toString() || lg.product?.toString();
    const count = pid ? (productCounts.get(pid) || 0) : 0;
    const mapping = eventToTxType[lg.event] || { type: null, label: '' };
    const actionAmount = findNearestActionQuantity(pid, mapping.type, lg.createdAt);

    return {
      ...lg.toObject(),
      summary: {
        count,
        stockAmount: actionAmount,       // per-action quantity
        stockLabel: mapping.label,       // e.g., "(stock in)"
      },
    };
  });

  return NextResponse.json(augmented);
}

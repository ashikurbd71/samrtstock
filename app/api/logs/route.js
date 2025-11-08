import { NextResponse } from 'next/server';
import { dbConnect } from '@/app/lib/dbConnect';
import { Log } from '@/app/lib/models';

export const runtime = 'nodejs';

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product');
  const dateParam = searchParams.get('date');
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

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
  return NextResponse.json(logs);
}
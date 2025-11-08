import { dbConnect } from '@/app/lib/dbConnect';
import { Log } from '@/app/lib/models';
import { generateLogsExcel } from '@/app/lib/excelGenerator';

export const runtime = 'nodejs';

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
function getDayRange(dateStr) {
  const base = parseLocalDate(dateStr);
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
  const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999);
  return { start, end, date: base };
}
function parseDateTime(dateStr, timeOrIso) {
  if (!timeOrIso) return null;
  if (timeOrIso.includes('T')) return new Date(timeOrIso);
  const [hh, mm] = timeOrIso.split(':').map(Number);
  const base = parseLocalDate(dateStr);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, 0, 0);
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');
  const productId = searchParams.get('product');
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  let query = {};
  let excelDate = new Date();

  if (productId) query.product = productId;

  if (dateParam) {
    const { start, end, date } = getDayRange(dateParam);
    const fromDt = parseDateTime(dateParam, fromParam);
    const toDt = parseDateTime(dateParam, toParam);
    query.createdAt = {
      ...(fromDt ? { $gte: fromDt } : { $gte: start }),
      ...(toDt ? { $lte: toDt } : { $lte: end }),
    };
    excelDate = date;
  } else if (fromParam || toParam) {
    const createdAt = {};
    if (fromParam) createdAt.$gte = new Date(fromParam);
    if (toParam) createdAt.$lte = new Date(toParam);
    query.createdAt = createdAt;
  }

  const logs = await Log.find(query).populate('product').sort({ createdAt: -1 });
  const { buffer, filename } = await generateLogsExcel(logs, excelDate);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
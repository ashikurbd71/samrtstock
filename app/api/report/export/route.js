import { NextResponse } from 'next/server';
import { dbConnect } from '@/app/lib/dbConnect';
import { Product, Transaction } from '@/app/lib/models';
import { generateDailyReportExcel } from '@/app/lib/excelGenerator';

export const runtime = 'nodejs';

function getDayRange(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end, date };
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');

  const { start, end, date } = getDayRange(dateParam);

  const txs = await Transaction.find({
    createdAt: { $gte: start, $lte: end }
  }).populate('product');

  const products = await Product.find({});

  const { buffer, filename } = await generateDailyReportExcel(date, txs, products);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
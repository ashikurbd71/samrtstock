import { NextResponse } from 'next/server';
import { dbConnect } from '../../lib/dbConnect';
import { Product } from '../../lib/models';

export const runtime = 'nodejs';

export async function GET() {
  await dbConnect();
  const products = await Product.find({}).sort({ createdAt: -1 });
  return NextResponse.json(products);
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const name = (body?.name || '').trim();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const product = await Product.create({ name });
  return NextResponse.json(product, { status: 201 });
}
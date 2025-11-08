import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '../../../lib/dbConnect';
import { Product, Transaction } from '../../../lib/models';

export const runtime = 'nodejs';

export async function PATCH(req, context) {
  await dbConnect();
  const { id } = await context.params;
  const body = await req.json();
  const name = (body?.name || '').trim();

  if (!id) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const product = await Product.findById(id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  product.name = name;
  await product.save();

  return NextResponse.json(product, { status: 200 });
}

export async function DELETE(_req, context) {
  await dbConnect();
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  const product = await Product.findById(id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  await Transaction.deleteMany({ product: id });
  await Product.findByIdAndDelete(id);

  return NextResponse.json({ ok: true }, { status: 200 });
}
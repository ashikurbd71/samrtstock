import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalStock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const transactionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['IN', 'OUT', 'RESTOCK', 'RETURN'], required: true },
  quantity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const logSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  event: { type: String, enum: ['STOCKED', 'OUT_OF_STOCK', 'REFUNDED'], required: true },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete logs 30 days after createdAt
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 30 * 24 * 60 * 60 });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export const Log = mongoose.models.Log || mongoose.model('Log', logSchema);

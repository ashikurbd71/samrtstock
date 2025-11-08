'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';

const TYPES = ['IN', 'OUT', 'RESTOCK', 'RETURN'];

export default function TransactionForm({ onSubmitted }) {
  const { register, handleSubmit, reset } = useForm();
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadProducts() {
    const res = await axios.get('/api/products');
    setProducts(res.data || []);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const onSubmit = async (data) => {
    setMessage('');
    setSubmitting(true);
    try {
      const payload = {
        product: data.product,
        type: data.type,
        quantity: Number(data.quantity),
      };
      await axios.post('/api/transactions', payload);
      setMessage('Transaction recorded successfully.');
      reset({ product: '', type: 'IN', quantity: '' });
      onSubmitted?.();
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Failed to record transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Product</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            {...register('product', { required: true })}
          >
            <option value="">Select product</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Type</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            defaultValue="IN"
            {...register('type', { required: true })}
          >
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-lg px-3 py-2"
            {...register('quantity', { required: true, min: 1 })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        {message && (
          <span className="text-sm">
            {message.includes('success') ? (
              <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
                {message}
              </span>
            ) : (
              <span className="text-red-700 bg-red-50 px-2 py-1 rounded">
                {message}
              </span>
            )}
          </span>
        )}
      </div>
    </form>
  );
}
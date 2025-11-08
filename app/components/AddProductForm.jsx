'use client';

import { useState } from 'react';
import axios from 'axios';

export default function AddProductForm({ onCreated }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    setMessage('');
    if (!name.trim()) {
      setMessage('Product name is required.');
      return;
    }
    setCreating(true);
    try {
      await axios.post('/api/products', { name: name.trim() });
      setName('');
      setMessage('Product created.');
      onCreated?.();
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Failed to create product.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="flex items-center gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New product name"
        className="border rounded-lg px-3 py-2 w-64"
      />

     

      
      <button
        type="submit"
        disabled={creating}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {creating ? 'Adding...' : 'Add Product'}
      </button>
      {message && (
        <span className="text-sm">
          {message.includes('created') ? (
            <span className="text-green-700 bg-green-50 px-2 py-1 rounded">{message}</span>
          ) : (
            <span className="text-red-700 bg-red-50 px-2 py-1 rounded">{message}</span>
          )}
        </span>
      )}
    </form>
  );
}
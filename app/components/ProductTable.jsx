'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AddProductForm from './AddProductForm';

export default function ProductTable() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [rowBusyId, setRowBusyId] = useState(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const startEdit = (p) => {
    setEditingId(p._id);
    setEditedName(p.name || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedName('');
  };

  const saveEdit = async (id) => {
    if (!editedName.trim()) return;
    setRowBusyId(id);
    try {
      await axios.patch(`/api/products/${id}`, { name: editedName.trim() });
      await loadProducts();
      cancelEdit();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to update product.');
    } finally {
      setRowBusyId(null);
    }
  };

  const deleteProduct = async (id, name) => {
    const ok = window.confirm(`Delete product "${name}"? This will remove its transactions also.`);
    if (!ok) return;
    setRowBusyId(id);
    try {
      await axios.delete(`/api/products/${id}`);
      await loadProducts();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to delete product.');
    } finally {
      setRowBusyId(null);
    }
  };

  function sortedFiltered(list) {
    const filtered = list.filter(p =>
      (p.name || '').toLowerCase().includes(query.toLowerCase())
    );
    const sorted = filtered.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === 'name') {
        av = (av || '').toLowerCase();
        bv = (bv || '').toLowerCase();
      }
      if (sortBy === 'createdAt') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }

  const visibleProducts = sortedFiltered(products);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  return (
    <section className="rounded-2xl bg-white shadow-sm border border-gray-200">
      <div className="p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-sm text-gray-600 mt-1">Manage items and stock levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadProducts}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-600">No products found.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer select-none"
                    onClick={() => toggleSort('name')}
                  >
                    Name {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none"
                    onClick={() => toggleSort('totalStock')}
                  >
                    Total Stock {sortBy === 'totalStock' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none"
                    onClick={() => toggleSort('createdAt')}
                  >
                    Created {sortBy === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleProducts.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4">
                      {editingId === p._id ? (
                        <input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="border rounded-md px-2 py-1 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.name}</span>
                          {p.totalStock === 0 ? (
                            <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs">
                              Out of stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
                              In stock
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">{p.totalStock}</td>
                    <td className="py-2.5 px-4">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 px-4">
                      {editingId === p._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(p._id)}
                            disabled={rowBusyId === p._id}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {rowBusyId === p._id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(p._id, p.name)}
                            disabled={rowBusyId === p._id}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            {rowBusyId === p._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Add Product</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <AddProductForm
              onCreated={() => {
                loadProducts();
                setShowModal(false);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
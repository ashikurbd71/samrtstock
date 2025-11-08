'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

export default function StockChart() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const labels = products.map(p => p.name);
  const values = products.map(p => p.totalStock || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Stock',
        data: values,
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: 'rgb(37, 99, 235)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  return (
    <section className="bg-white shadow-sm rounded-xl border border-gray-200">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stock Levels</h2>
          <p className="text-sm text-gray-600 mt-1">
            Current stock per product
          </p>
        </div>
        <button
          onClick={loadProducts}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading chart...</div>
      ) : products.length === 0 ? (
        <div className="p-6 text-sm text-gray-500">No products found.</div>
      ) : (
        <div className="px-6 pb-6 h-72">
          <Bar data={data} options={options} />
        </div>
      )}
    </section>
  );
}
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
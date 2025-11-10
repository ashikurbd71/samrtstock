'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TransactionForm from './TransactionForm';
import { format } from 'date-fns';

export default function LogTable(props) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [showTxModal, setShowTxModal] = useState(false);
  const [newOnly, setNewOnly] = useState(true);

  useEffect(() => {
    reload();
  }, []);

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString();
  }

  async function reload() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (fromTime) params.set('from', fromTime); // HH:mm
      if (toTime) params.set('to', toTime);       // HH:mm
      if (newOnly) params.set('newOnly', '1');
      const res = await fetch(`/api/logs?${params.toString()}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function downloadExcel() {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (fromTime) params.set('from', fromTime);
      if (toTime) params.set('to', toTime);
      const res = await fetch(`/api/logs/export?${params.toString()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nameDate = date || format(new Date(), 'yyyy-MM-dd');
      link.href = url;
      link.download = `logs_${nameDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download Excel file.');
    } finally {
      setDownloading(false);
    }
  }

  function eventChipClasses(evt) {
    switch (evt) {
      case 'STOCKED':
        return 'bg-blue-50 text-blue-700';
      case 'RESTOCK':
        return 'bg-emerald-50 text-emerald-700';
      case 'OUT_OF_STOCK':
      case 'STOCKOUT':
        return 'bg-rose-50 text-rose-700';
      case 'RETURNED':
      case 'RETURN':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  function displayEvent(evt) {
    switch (evt) {
      case 'STOCKED':
        return 'STOCK-IN';
      case 'RESTOCK':
        return 'RESTOCK';
      case 'OUT_OF_STOCK':
      case 'STOCKOUT':
        return 'STOCK-OUT';
      case 'RETURNED':
      case 'RETURN':
        return 'RETURN';
      default:
        return evt;
    }
  }

  const filteredLogs = logs.filter(l =>
    (l.product?.name || '').toLowerCase().includes(productQuery.toLowerCase())
  );

  return (
    <section className="rounded-2xl bg-white shadow-sm border border-gray-200">
      <div className="p-6 flex items-center lg:flex-row flex-col justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Product Activity Logs</h2>
          <p className="text-sm text-gray-600 mt-1">Filter, search and export entries.</p>
        </div>
        <div className="flex lg:flex-row flex-col items-center gap-2">
          <button
            onClick={reload}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Refresh
          </button>
          <Link
           href="/"
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
          >
            Back Dashboard
          </Link>
            <Link
            href="/report"
            className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black text-sm"
          >
            Go WareHouse
          </Link>
          <button
            onClick={downloadExcel}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            aria-label="Download logs as Excel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
              <path d="M5 20h14v-2H5v2zm7-18l-5.5 5.5h3.5V15h4V7.5h3.5L12 2z"/>
            </svg>
            {downloading ? 'Downloading...' : 'Download Excel'}
          </button>
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="time"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To</label>
          <input
            type="time"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Search product..."
            className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="only-new-products"
            type="checkbox"
            checked={newOnly}
            onChange={(e) => setNewOnly(e.target.checked)}
          />
          <label htmlFor="only-new-products" className="text-sm text-gray-700">
            Only newly added products
          </label>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={reload}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              const today = format(new Date(), 'yyyy-MM-dd');
              setDate(today);
              setFromTime('');
              setToTime('');
              setNewOnly(true);
              reload();
            }}
            className="px-3 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-6 pb-6">
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="px-6 pb-6">
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-600">No logs found for current filters.</p>
          </div>
        </div>
      ) : (
        <div className="w-full">
          {/* Mobile-friendly horizontal scroll */}
          <div className="px-6 pb-6 overflow-hidden rounded-xl ring-1 ring-gray-200">
            <div className="max-h-[60vh] overflow-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {/* Example header updated for responsiveness */}
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Product</th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-700">Event</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Date & Time</th>
                    {/* <th className="py-3 px-4">Count</th> */}
                    <th className="py-3 px-4 text-right font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 text-left">{log.product?.name || '—'}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${eventChipClasses(log.event)}`}>
                          {displayEvent(log.event)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-left whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      {/* <td className="py-2.5 px-4">{log.summary?.count ?? '—'}</td> */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {log.summary
                          ? `${log.summary.stockAmount} ${log.summary.stockLabel ? `(${log.summary.stockLabel})` : ''}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  {showTxModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Quick Transaction</h3>
          <button
            onClick={() => setShowTxModal(false)}
            className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <TransactionForm
          onSubmitted={() => {
            reload();
            setShowTxModal(false);
          }}
        />
      </div>
    </div>
  )}
}
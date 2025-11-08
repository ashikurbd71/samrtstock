'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import DownloadButton from './DownloadButton';

function ReportTable(_props, ref) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  async function loadReport(targetDate) {
    setLoading(true);
    try {
      const res = await axios.get(`/api/report?date=${targetDate}`);
      setReport(res.data?.report || []);
    } finally {
      setLoading(false);
    }
  }

  useImperativeHandle(ref, () => ({
    reload: () => loadReport(date),
  }));

  useEffect(() => {
    loadReport(date);
  }, []);

  const totalsAll = report.reduce(
    (acc, r) => {
      acc.IN += r.totals.IN;
      acc.OUT += r.totals.OUT;
      acc.RESTOCK += r.totals.RESTOCK;
      acc.RETURN += r.totals.RETURN;
      acc.FINAL += r.finalStock;
      return acc;
    },
    { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0, FINAL: 0 }
  );

  const visibleReport = report.filter(r =>
    (r.productName || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => loadReport(date)}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
          >
            Apply
          </button>
          <button
            onClick={() => { const d = format(new Date(), 'yyyy-MM-dd'); setDate(d); loadReport(d); }}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product..."
            className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <DownloadButton date={date} />
        </div>
      </div>

      <div className="grid sm:grid-cols-5 gap-3 px-6 pb-6">
        <div className="bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">
          <span className="font-medium">IN</span> <span>{totalsAll.IN}</span>
        </div>
        <div className="bg-rose-50 text-rose-700 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">
          <span className="font-medium">OUT</span> <span>{totalsAll.OUT}</span>
        </div>
        <div className="bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">
          <span className="font-medium">RESTOCK</span> <span>{totalsAll.RESTOCK}</span>
        </div>
        <div className="bg-yellow-50 text-yellow-700 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">
          <span className="font-medium">RETURN</span> <span>{totalsAll.RETURN}</span>
        </div>
        <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2">
          <span className="font-medium">Final</span> <span>{totalsAll.FINAL}</span>
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
      ) : (
        <div className="px-6 pb-6 overflow-hidden rounded-lg border border-gray-200">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">IN</th>
                  <th className="py-3 px-4">OUT</th>
                  <th className="py-3 px-4">RESTOCK</th>
                  <th className="py-3 px-4">RETURN</th>
                  <th className="py-3 px-4">Final Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleReport.map(r => (
                  <tr key={r.productId} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4">
                      <span className="font-medium">{r.productName}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs">
                        {r.totals.IN}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs">
                        {r.totals.OUT}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">
                        {r.totals.RESTOCK}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-xs">
                        {r.totals.RETURN}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{r.finalStock}</td>
                  </tr>
                ))}
                {visibleReport.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-sm text-gray-500">
                      No transactions found for selected date.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium bg-gray-50">
                  <td className="py-2.5 px-4">Totals</td>
                  <td className="py-2.5 px-4">{totalsAll.IN}</td>
                  <td className="py-2.5 px-4">{totalsAll.OUT}</td>
                  <td className="py-2.5 px-4">{totalsAll.RESTOCK}</td>
                  <td className="py-2.5 px-4">{totalsAll.RETURN}</td>
                  <td className="py-2.5 px-4">{totalsAll.FINAL}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default forwardRef(ReportTable);
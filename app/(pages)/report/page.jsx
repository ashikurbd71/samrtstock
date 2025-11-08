'use client';

import { useRef } from 'react';
import Link from 'next/link';
import ReportTable from '@/app/components/ReportTable';
import TransactionForm from '@/app/components/TransactionForm';

export default function ReportPage() {
  const reportRef = useRef(null);

  return (
    <main className="w-full bg-gray-50 min-h-screen px-5 lg:px-8 mx-auto  space-y-6">
      <div className="flex lg:flex-row gap-3 flex-col items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Warehouse Report</h1>
          <p className="text-sm text-gray-600">View daily stock activity and totals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Back Dashboard
          </Link>
          <Link
            href="/logs"
            className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black text-sm"
          >
            Go Logs
          </Link>
        </div>
      </div>

      <section className="rounded-2xl bg-white shadow-sm border border-gray-200">
        <div className="p-6 border-b border-b-gray-200">
          <h2 className="text-lg font-semibold">Quick Transaction</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add IN, OUT, RESTOCK or RETURN entries to update the report.
          </p>
        </div>
        <div className="p-6">
          <TransactionForm onSubmitted={() => reportRef.current?.reload()} />
        </div>
      </section>

      <ReportTable ref={reportRef} />
    </main>
  );
}
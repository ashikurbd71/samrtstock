// Top-level imports in Home()
import Image from "next/image";
import Link from 'next/link';
import AddProductForm from './components/AddProductForm';
import ProductTable from './components/ProductTable';
import StockChart from './components/StockChart';

export default function Home() {
  return (
    <div className="space-y-8 px-5 lg:px-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="px-8 py-10">
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">SmartStock Dashboard</h1>
          <p className="mt-2 text-sm md:text-base text-white/80">
            Manage inventory, track trends, and export daily reports.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur hover:bg-white/20 text-sm"
              href="/report"
            >
              View Report
            </Link>
            <Link
              className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur hover:bg-white/20 text-sm"
              href="/logs"
            >
              Stock Logs
            </Link>
           
          </div>
        </div>
      </section>

      {/* Chart + Quick Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Live Stock Trend</h2>
          </div>
          <StockChart />
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium">Quick Actions</h2>
          <p className="mt-2 text-sm text-gray-600">Fast shortcuts for daily work</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/report"
              className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black text-sm"
            >
            Go WareHouse
            </Link>
            <Link
              href="/logs"
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
            >
              View Stock Logs
            </Link>
          </div>

       
        </div>
      </section>

      {/* Product Inventory */}
      <section className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Product Inventory</h2>
        </div>
        <ProductTable />
      </section>
    </div>
  );
}

import LogTable from '@/app/components/LogTable';

export const runtime = 'nodejs';

export default function LogsPage() {
  return (
    <main className="max-w-7xl mx-auto space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white p-6">
        <h1 className="text-2xl font-semibold">Stock Logs</h1>
        <p className="text-sm mt-1 opacity-90">Explore and export inventory events.</p>
      </section>
      <LogTable />
    </main>
  );
}
'use client';

import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 text-sm">← Back</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
            <p className="text-sm text-gray-500">Assets, liabilities and equity snapshot</p>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-xl font-bold text-green-600 mt-1">Ready</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-7xl mb-6">📄</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Balance Sheet</h2>
          <p className="text-gray-500 mb-2 max-w-lg mx-auto">Assets, liabilities and equity snapshot</p>
          <p className="text-sm text-gray-400 mb-8">
            The database and backend API for this module are fully configured and ready.
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              ✅ Database Ready
            </div>
            <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              🔧 UI Coming Soon
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

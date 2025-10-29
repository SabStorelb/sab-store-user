import Link from 'next/link';

export default function OrdersList() {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500">قائمة الطلبات</p>
        </div>
      </header>

      <section>
        <div className="bg-white rounded shadow p-4">No orders yet.</div>
      </section>
    </div>
  );
}

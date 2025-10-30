import Link from 'next/link';

export default function AdminOffers() {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offers</h1>
          <p className="text-sm text-gray-500">العروض والخصومات الحالية</p>
        </div>
        <button onClick={() => window.history.back()} className="text-purple-600 hover:underline">⬅ العودة</button>
      </header>

      <nav className="mb-6 space-x-3">
        <Link href="/admin/products" className="px-3 py-1 bg-gray-100 rounded">Products</Link>
        <Link href="/admin/brands" className="px-3 py-1 bg-gray-100 rounded">Brands</Link>
        <Link href="/admin/categories" className="px-3 py-1 bg-gray-100 rounded">Categories</Link>
        <Link href="/admin/orders" className="px-3 py-1 bg-gray-100 rounded">Orders</Link>
      </nav>

      <div className="mb-4">
        <Link href="/admin/offers/new" className="bg-purple-600 text-white px-4 py-2 rounded">Add Offer</Link>
      </div>

      <section className="bg-white rounded shadow p-4">
        <p className="text-gray-600">لا توجد عروض الآن.</p>
      </section>
    </div>
  );
}

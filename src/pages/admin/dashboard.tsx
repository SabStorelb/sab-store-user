import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-sm text-gray-500">لوحة الإدارة — إحصائيات سريعة</p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/products" className="px-3 py-1 bg-gray-100 rounded">Products</Link>
        <Link href="/admin/brands" className="px-3 py-1 bg-gray-100 rounded">Brands</Link>
        <Link href="/admin/categories" className="px-3 py-1 bg-gray-100 rounded">Categories</Link>
        <Link href="/admin/orders" className="px-3 py-1 bg-gray-100 rounded">Orders</Link>
        <Link href="/admin/customers" className="px-3 py-1 bg-gray-100 rounded">Customers</Link>
        <Link href="/admin/offers" className="px-3 py-1 bg-gray-100 rounded">Offers</Link>
        <Link href="/admin/banners" className="px-3 py-1 bg-gray-100 rounded">Banners</Link>
      </nav>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">{/* Orders card */}
          <h3 className="text-lg font-medium">Orders</h3>
          <div className="mt-4 text-2xl">0</div>
        </div>
        <div className="p-4 bg-white rounded shadow">{/* Revenue card */}
          <h3 className="text-lg font-medium">Revenue</h3>
          <div className="mt-4 text-2xl">$0.00</div>
        </div>
        <div className="p-4 bg-white rounded shadow">{/* Customers card */}
          <h3 className="text-lg font-medium">Customers</h3>
          <div className="mt-4 text-2xl">0</div>
        </div>
      </section>
    </div>
  );
}

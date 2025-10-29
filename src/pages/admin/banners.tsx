import Link from 'next/link';

export default function AdminBanners() {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Banners</h1>
        <p className="text-sm text-gray-500">إدارة البنارات والشرائح الترويجية</p>
      </header>

      <nav className="mb-6 space-x-3">
        <Link href="/admin/products" className="px-3 py-1 bg-gray-100 rounded">Products</Link>
        <Link href="/admin/brands" className="px-3 py-1 bg-gray-100 rounded">Brands</Link>
        <Link href="/admin/categories" className="px-3 py-1 bg-gray-100 rounded">Categories</Link>
        <Link href="/admin/orders" className="px-3 py-1 bg-gray-100 rounded">Orders</Link>
      </nav>

      <div className="mb-4">
        <Link href="/admin/banners/new" className="bg-purple-600 text-white px-4 py-2 rounded">Add Banner</Link>
      </div>

      <section className="bg-white rounded shadow p-4">
        <p className="text-gray-600">لا توجد بنارات حتى الآن.</p>
      </section>
    </div>
  );
}

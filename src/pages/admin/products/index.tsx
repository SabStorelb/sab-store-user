import Link from 'next/link';

export default function ProductsList() {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">قائمة المنتجات</p>
        </div>
        <div>
          <Link href="/admin/products/new"><a className="bg-purple-600 text-white px-4 py-2 rounded">Add Product</a></Link>
        </div>
      </header>

      <section>
        <div className="bg-white rounded shadow p-4">No products yet.</div>
      </section>
    </div>
  );
}

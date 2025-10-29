import { useState } from 'react';
import Link from 'next/link';

export default function NewProduct() {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Add Product</h1>
          <p className="text-sm text-gray-500">املأ الحقول كما في النموذج</p>
        </div>
        <div>
          <Link href="/admin/products" className="px-3 py-1 bg-gray-100 rounded">Back</Link>
        </div>
      </header>

      <form className="bg-white p-4 rounded shadow max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm mb-1">Name (EN)</div>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full border rounded px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Name (AR)</div>
            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="w-full border rounded px-3 py-2" />
          </label>
        </div>

        <div className="mt-4">
          <button type="button" className="bg-purple-600 text-white px-4 py-2 rounded">Save (placeholder)</button>
        </div>
      </form>
    </div>
  );
}

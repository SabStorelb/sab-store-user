import { useRouter } from 'next/router';

export default function OrderDetails() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Order {id}</h1>
      <div className="bg-white rounded shadow p-4">Order details placeholder</div>
    </div>
  );
}

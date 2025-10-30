export default function StatCardSkeleton() {
  return (
    <div className="rounded-lg shadow-md p-4 flex flex-col justify-between min-h-[140px] bg-gray-200 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-16 bg-gray-300 rounded"></div>
        <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-4 w-24 bg-gray-300 rounded"></div>
        <div className="h-3 w-20 bg-gray-300 rounded"></div>
        <div className="h-2 w-14 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

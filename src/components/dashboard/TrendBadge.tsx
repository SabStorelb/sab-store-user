interface TrendBadgeProps {
  value: number;
  period?: string;
}

export default function TrendBadge({ value, period = 'من الأسبوع الماضي' }: TrendBadgeProps) {
  // إذا كانت النسبة 0، نستخدم اللون الرمادي
  if (value === 0) {
    return (
      <div className="inline-flex items-center gap-1 bg-gray-400 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
        <span>لا تغيير</span>
        <span className="text-[9px] opacity-80">{period}</span>
      </div>
    );
  }

  const isPositive = value > 0;
  const arrow = isPositive ? '↑' : '↓';
  const colorClass = isPositive ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`inline-flex items-center gap-1 ${colorClass} text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm`}>
      <span>{arrow}</span>
      <span>{Math.abs(value)}%</span>
      <span className="text-[9px] opacity-80">{period}</span>
    </div>
  );
}

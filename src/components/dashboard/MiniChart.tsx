interface MiniChartProps {
  data: number[];
  color?: string;
}

export default function MiniChart({ data, color = '#10b981' }: MiniChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-8 w-full">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={index}
            className="flex-1 rounded-t transition-all"
            style={{
              height: `${Math.max(height, 5)}%`,
              backgroundColor: color,
              opacity: 0.7 + (index / data.length) * 0.3
            }}
          />
        );
      })}
    </div>
  );
}

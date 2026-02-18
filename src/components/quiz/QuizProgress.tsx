interface QuizProgressProps {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">
          Q {current} / {total}
        </span>
        <span className="text-muted-foreground text-sm">{percentage}%</span>
      </div>
      <div className="bg-secondary h-3 w-full overflow-hidden rounded-full">
        <div
          className="bg-gradient-progress h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

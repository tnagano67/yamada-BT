import type { GradeDistributionItem } from "@/lib/teacher/class-detail-service";

interface GradeDistributionProps {
  data: GradeDistributionItem[];
  label: string;
}

export function GradeDistribution({ data, label }: GradeDistributionProps) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {label}のグレードデータがありません
      </p>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}グレード分布</p>
      <div className="space-y-1">
        {data.map((item) => (
          <div key={item.gradeId} className="flex items-center gap-2 text-sm">
            <span className="w-8 text-right font-mono">{item.gradeId}</span>
            <div className="flex-1">
              <div
                className="bg-primary h-5 rounded-sm"
                style={{
                  width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
                  minWidth: item.count > 0 ? "4px" : "0",
                }}
              />
            </div>
            <span className="text-muted-foreground w-6 text-right">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

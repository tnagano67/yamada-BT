import { Badge } from "@/components/ui/badge";
import type { RecentPromotionData } from "@/lib/teacher/dashboard-service";

interface RecentPromotionsProps {
  promotions: RecentPromotionData[];
}

export function RecentPromotions({ promotions }: RecentPromotionsProps) {
  if (promotions.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">
        最近の昇格はありません
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {promotions.map((p, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md border px-4 py-2"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium">{p.studentName}</span>
            <span className="text-muted-foreground text-sm">{p.classInfo}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {p.subject === "english" ? "英語" : "日本語"} {p.gradeId}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {new Date(p.promotedAt).toLocaleDateString("ja-JP", { timeZone: "UTC" })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

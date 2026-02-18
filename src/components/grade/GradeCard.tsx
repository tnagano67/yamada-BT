import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GradeProgressData } from "@/lib/grade/types";
import { getNextGradeId } from "@/lib/grade/promotion";

const GRADE_TYPE_LABELS: Record<string, string> = {
  new_words: "新出",
  review: "復習",
  complete: "完全制覇",
};

function ProgressDots({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-3 w-3 rounded-full ${
            i < current
              ? "bg-primary"
              : "bg-muted"
          }`}
        />
      ))}
      <span className="text-muted-foreground ml-1 text-sm">
        ({current}/{total})
      </span>
    </div>
  );
}

interface GradeCardProps {
  data: GradeProgressData;
  startQuickAction: () => Promise<void>;
}

export function GradeCard({ data, startQuickAction }: GradeCardProps) {
  const nextGradeId = data.isMaxGrade
    ? null
    : getNextGradeId(data.currentGradeId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>現在のグレード</CardTitle>
          <Badge variant="secondary">
            {GRADE_TYPE_LABELS[data.gradeType] ?? data.gradeType}
          </Badge>
        </div>
        <CardDescription>
          {data.subject === "english" ? "英語" : "日本語"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold">{data.currentGradeId}</p>

        {data.isMaxGrade ? (
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            最高グレード到達
          </p>
        ) : (
          <>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">昇格進捗</p>
              <ProgressDots
                current={data.consecutivePasses}
                total={data.requiredPasses}
              />
            </div>
            {nextGradeId ? (
              <p className="text-muted-foreground text-xs">
                次のグレード: {nextGradeId}
              </p>
            ) : null}
          </>
        )}

        <form action={startQuickAction}>
          <button
            type="submit"
            className="text-primary text-sm underline underline-offset-4 hover:no-underline"
          >
            クイックテストを受ける
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CONSECUTIVE_PASSES_REQUIRED } from "@/lib/grade/constants";

interface GradeData {
  currentGradeId: string;
  consecutivePasses: number;
}

interface StudentGradeSummaryProps {
  englishGrade: GradeData | null;
  japaneseGrade: GradeData | null;
  streak: {
    currentStreak: number;
    maxStreak: number;
    flameLevel: number;
  } | null;
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            i < current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
      <span className="text-muted-foreground ml-1 text-xs">
        ({current}/{total})
      </span>
    </div>
  );
}

export function StudentGradeSummary({
  englishGrade,
  japaneseGrade,
  streak,
}: StudentGradeSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">英語グレード</CardTitle>
          <CardDescription>昇格進捗</CardDescription>
        </CardHeader>
        <CardContent>
          {englishGrade ? (
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                {englishGrade.currentGradeId}
              </p>
              <ProgressDots
                current={englishGrade.consecutivePasses}
                total={CONSECUTIVE_PASSES_REQUIRED}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">未設定</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">日本語グレード</CardTitle>
          <CardDescription>昇格進捗</CardDescription>
        </CardHeader>
        <CardContent>
          {japaneseGrade ? (
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                {japaneseGrade.currentGradeId}
              </p>
              <ProgressDots
                current={japaneseGrade.consecutivePasses}
                total={CONSECUTIVE_PASSES_REQUIRED}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">未設定</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">ストリーク</CardTitle>
          <CardDescription>連続学習記録</CardDescription>
        </CardHeader>
        <CardContent>
          {streak ? (
            <div className="space-y-1">
              <p className="text-2xl font-bold">{streak.currentStreak}日</p>
              <p className="text-muted-foreground text-xs">
                最高記録: {streak.maxStreak}日
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">記録なし</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

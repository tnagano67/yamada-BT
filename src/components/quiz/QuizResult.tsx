import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizResultProps {
  score: number;
  totalQuestions: number;
  scorePercentage: number;
  isPassed: boolean;
  gradeId: string;
}

export function QuizResult({
  score,
  totalQuestions,
  scorePercentage,
  isPassed,
  gradeId,
}: QuizResultProps) {
  return (
    <Card className={isPassed
      ? "border-teal-200 bg-gradient-to-b from-teal-50 to-emerald-50 dark:border-teal-800 dark:from-teal-950/20 dark:to-emerald-950/20"
      : "border-orange-200 bg-gradient-to-b from-orange-50 to-amber-50 dark:border-orange-800 dark:from-orange-950/20 dark:to-amber-950/20"
    }>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          {isPassed ? (
            <CheckCircle2 className="h-12 w-12 text-teal-600" />
          ) : (
            <XCircle className="h-12 w-12 text-orange-500" />
          )}
        </div>
        <CardTitle className="text-2xl">テスト結果</CardTitle>
        <Badge
          className={isPassed
            ? "mx-auto mt-2 bg-teal-100 px-4 py-1 text-base text-teal-700 hover:bg-teal-100"
            : "mx-auto mt-2 bg-orange-100 px-4 py-1 text-base text-orange-700 hover:bg-orange-100"
          }
        >
          {isPassed ? "合格" : "不合格"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="mb-4 text-6xl font-bold tabular-nums text-teal-600">
            {scorePercentage}
            <span className="text-2xl">%</span>
          </div>
          <p className="text-muted-foreground">
            {totalQuestions}問中{score}問正解 ・ グレード {gradeId}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

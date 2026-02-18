import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">テスト結果</CardTitle>
        <Badge variant={isPassed ? "default" : "destructive"} className="mx-auto mt-2 text-base px-4 py-1">
          {isPassed ? "合格" : "不合格"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="mb-4 text-6xl font-bold tabular-nums">
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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResultAnswer {
  word: string;
  meaning: string;
  correctOption: string;
  selectedOption: string | null;
  isCorrect: boolean;
}

interface QuizResultDetailProps {
  answers: ResultAnswer[];
}

export function QuizResultDetail({ answers }: QuizResultDetailProps) {
  const wrongAnswers = answers.filter((a) => !a.isCorrect);

  if (wrongAnswers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-lg font-medium text-teal-600">全問正解です！</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          間違えた問題（{wrongAnswers.length}問）
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {wrongAnswers.map((answer, index) => (
            <div key={index} className="py-3">
              <div className="mb-1 font-medium">{answer.word}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">正解: </span>
                  <span className="text-teal-600 dark:text-teal-400">
                    {answer.correctOption}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">あなたの回答: </span>
                  <span
                    className={cn(
                      answer.selectedOption
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground italic",
                    )}
                  >
                    {answer.selectedOption ?? "未回答"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

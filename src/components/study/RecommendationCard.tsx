import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { Recommendation } from "@/lib/quiz/recommendation";

interface RecommendationCardProps {
  recommendation: Recommendation;
  startAction: (mode: string) => Promise<void>;
}

export function RecommendationCard({
  recommendation,
  startAction,
}: RecommendationCardProps) {
  return (
    <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 dark:border-teal-800 dark:from-teal-950/30 dark:to-emerald-950/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <CardTitle className="text-base text-teal-700 dark:text-teal-300">おすすめ</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-1 text-lg font-bold">{recommendation.title}</p>
        <p className="text-muted-foreground mb-3 text-sm">
          {recommendation.description}
        </p>
        <form
          action={async () => {
            "use server";
            await startAction(recommendation.suggestedMode);
          }}
        >
          <Button type="submit" size="sm" className="bg-gradient-primary text-white hover:opacity-90">
            {recommendation.suggestedMode === "promotion"
              ? "昇格チャレンジを開始"
              : "クイック練習を開始"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

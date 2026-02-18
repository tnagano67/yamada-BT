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
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary h-5 w-5" />
          <CardTitle className="text-base">おすすめ</CardTitle>
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
          <Button type="submit" size="sm">
            {recommendation.suggestedMode === "promotion"
              ? "昇格チャレンジを開始"
              : "クイック練習を開始"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

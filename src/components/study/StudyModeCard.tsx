import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Trophy, Brain } from "lucide-react";

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
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            i < current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

interface QuickPracticeCardProps {
  gradeId: string;
  startAction: () => Promise<void>;
}

export function QuickPracticeCard({
  gradeId,
  startAction,
}: QuickPracticeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-base">クイック練習</CardTitle>
        </div>
        <CardDescription>現在のグレードで10問練習</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm">
          グレード: <span className="font-bold">{gradeId}</span>
        </p>
        <form action={startAction}>
          <Button type="submit" variant="outline" className="w-full">
            練習を開始
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface PromotionChallengeCardProps {
  consecutivePasses: number;
  requiredPasses: number;
  attemptsRemaining: number;
  isMaxGrade: boolean;
  startAction: () => Promise<void>;
}

export function PromotionChallengeCard({
  consecutivePasses,
  requiredPasses,
  attemptsRemaining,
  isMaxGrade,
  startAction,
}: PromotionChallengeCardProps) {
  const isDisabled = attemptsRemaining <= 0 || isMaxGrade;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-base">昇格チャレンジ</CardTitle>
        </div>
        <CardDescription>合格して次のグレードへ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs">連続合格</p>
          <ProgressDots current={consecutivePasses} total={requiredPasses} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={attemptsRemaining > 0 ? "secondary" : "destructive"}>
            残り{attemptsRemaining}回
          </Badge>
          {isMaxGrade ? (
            <Badge variant="outline">最高グレード到達</Badge>
          ) : null}
        </div>
        <form action={startAction}>
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={isDisabled}
          >
            {isMaxGrade
              ? "最高グレード到達済み"
              : attemptsRemaining <= 0
                ? "本日の上限に達しました"
                : "チャレンジを開始"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function WeaknessPracticeCard() {
  return (
    <Card className="opacity-60">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-base">苦手克服</CardTitle>
        </div>
        <CardDescription>間違えた単語を集中復習</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="outline">Sprint 7で実装予定</Badge>
      </CardContent>
    </Card>
  );
}

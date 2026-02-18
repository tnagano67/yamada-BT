import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FlameIcon } from "./FlameIcon";
import type { StreakDisplayData } from "@/lib/streak/streak-service";

interface StreakDisplayProps {
  data: StreakDisplayData;
}

export function StreakDisplay({ data }: StreakDisplayProps) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlameIcon flameLevel={data.flameLevel} />
          ストリーク
        </CardTitle>
        <CardDescription>連続学習記録</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-4xl font-bold text-orange-500">
            {data.currentStreak}
            <span className="text-muted-foreground ml-1 text-base font-normal">
              日連続
            </span>
          </p>
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>最高記録: {data.maxStreak}日</span>
            <span className="flex items-center gap-1">
              {"❄️".repeat(data.freezeRemaining)}
              {data.freezeRemaining > 0 ? (
                <span className="ml-1">x{data.freezeRemaining}</span>
              ) : (
                <span className="text-muted-foreground">フリーズなし</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

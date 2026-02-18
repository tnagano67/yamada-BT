import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { removeSuspensionAction } from "@/app/(teacher)/teacher/schedule/actions";

interface Suspension {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
}

interface SuspensionListProps {
  suspensions: Suspension[];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SuspensionList({ suspensions }: SuspensionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">休止期間</CardTitle>
      </CardHeader>
      <CardContent>
        {suspensions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            休止期間は設定されていません
          </p>
        ) : (
          <div className="space-y-2">
            {suspensions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(s.startDate)} 〜 {formatDate(s.endDate)}
                  </p>
                  {s.reason ? (
                    <p className="text-muted-foreground text-xs">{s.reason}</p>
                  ) : null}
                </div>
                <form action={removeSuspensionAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    削除
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ActiveTestBannerProps {
  deliveryId: string;
  subject: string;
  deadlineTime: Date;
  alreadyTaken: boolean;
  startAction: (formData: FormData) => Promise<void>;
}

export function ActiveTestBanner({
  deliveryId,
  subject,
  deadlineTime,
  alreadyTaken,
  startAction,
}: ActiveTestBannerProps) {
  const subjectLabel = subject === "english" ? "英語" : "日本語";
  const deadline = deadlineTime.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (alreadyTaken) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">
              {subjectLabel}朝テスト - 受験済み
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="font-medium">
            {subjectLabel}朝テスト配信中
          </p>
          <p className="text-muted-foreground text-sm">
            締切: {deadline}
          </p>
        </div>
        <form action={startAction}>
          <input type="hidden" name="deliveryId" value={deliveryId} />
          <Button type="submit" size="sm">
            テスト開始
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

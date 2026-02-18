import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

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
      <Card className="border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium text-teal-700 dark:text-teal-300">
              {subjectLabel}朝テスト - 受験済み
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-gentle-pulse border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 dark:border-orange-800 dark:from-orange-950/30 dark:to-amber-950/30">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <div>
            <p className="font-medium text-orange-700 dark:text-orange-300">
              {subjectLabel}朝テスト配信中
            </p>
            <p className="text-sm text-orange-600/70 dark:text-orange-400/70">
              締切: {deadline}
            </p>
          </div>
        </div>
        <form action={startAction}>
          <input type="hidden" name="deliveryId" value={deliveryId} />
          <Button type="submit" size="sm" className="bg-gradient-accent text-white hover:opacity-90">
            テスト開始
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

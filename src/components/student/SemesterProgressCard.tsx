import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SemesterProgressCardProps {
  subject: string;
  currentGradeId: string;
  targetGradeId: string;
  progressPercent: number;
}

export function SemesterProgressCard({
  subject,
  currentGradeId,
  targetGradeId,
  progressPercent,
}: SemesterProgressCardProps) {
  const subjectLabel = subject === "english" ? "英語" : "日本語";
  const clampedPercent = Math.min(100, Math.max(0, progressPercent));

  return (
    <Card>
      <CardHeader>
        <CardTitle>学期目標</CardTitle>
        <CardDescription>
          {subjectLabel}: {currentGradeId} → {targetGradeId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{currentGradeId}</span>
            <span>{targetGradeId}</span>
          </div>
          <div className="bg-muted h-3 rounded-full">
            <div
              className="bg-gradient-progress h-3 rounded-full transition-all"
              style={{ width: `${clampedPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground text-center text-sm">
            {clampedPercent}% 達成
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

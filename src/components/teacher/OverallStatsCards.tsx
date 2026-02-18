import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OverallStatsCardsProps {
  attendanceRate: number;
  averageScore: number | null;
}

export function OverallStatsCards({
  attendanceRate,
  averageScore,
}: OverallStatsCardsProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">受験率</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{attendanceRate}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">平均正答率</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {averageScore !== null ? `${averageScore}%` : "—"}
          </p>
        </CardContent>
      </Card>
    </>
  );
}

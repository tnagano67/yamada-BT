import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Target } from "lucide-react";

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
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            <CardTitle className="text-sm font-medium">受験率</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-teal-600">{attendanceRate}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-600" />
            <CardTitle className="text-sm font-medium">平均正答率</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-teal-600">
            {averageScore !== null ? `${averageScore}%` : "—"}
          </p>
        </CardContent>
      </Card>
    </>
  );
}

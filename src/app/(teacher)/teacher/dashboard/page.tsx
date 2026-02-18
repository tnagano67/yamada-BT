import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TeacherDashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">教員ダッシュボード</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>本日のテスト結果</CardTitle>
            <CardDescription>クラス別受験状況</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">テスト結果表示は今後実装予定です</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>アラート</CardTitle>
            <CardDescription>要対応の生徒</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">アラート機能は今後実装予定です</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>クラス進捗</CardTitle>
            <CardDescription>グレード分布</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">進捗表示は今後実装予定です</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

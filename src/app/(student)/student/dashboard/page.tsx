import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StudentDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>今日のテスト</CardTitle>
            <CardDescription>朝テストの状況</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">テスト機能は今後実装予定です</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>現在のグレード</CardTitle>
            <CardDescription>英語・日本語</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">グレード表示は今後実装予定です</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ストリーク</CardTitle>
            <CardDescription>連続学習記録</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">ストリーク表示は今後実装予定です</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

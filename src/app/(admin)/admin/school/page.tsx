import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminSchoolPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">学校管理</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>ユーザー管理</CardTitle>
            <CardDescription>生徒・教員のアカウント管理</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">ユーザー管理は今後実装予定です</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>クラス管理</CardTitle>
            <CardDescription>クラス編成・担任設定</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">クラス管理は今後実装予定です</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>学校カレンダー</CardTitle>
            <CardDescription>休日・試験期間の設定</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">カレンダー管理は今後実装予定です</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

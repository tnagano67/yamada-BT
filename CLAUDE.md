# グレードアップ学習システム (yamada-BT)

高校全校（生徒1,000名、教員60名）向けの英単語・日本語の朝テスト学習システム。

## 技術スタック

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **UI**: Tailwind CSS v4 + shadcn/ui (New York style)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js v5 (Google OAuth, Prisma Adapter)
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint 9 (Flat Config)

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動 (Turbopack)
npm run build        # プロダクションビルド
npm run test         # テスト実行
npm run test:watch   # テスト監視モード
npx eslint .         # ESLint実行
npx prisma generate  # Prismaクライアント生成
npx prisma db push   # スキーマをDBに反映
npx prisma migrate dev # マイグレーション作成・実行
npx prisma db seed   # シードデータ投入
npx prisma studio    # Prisma Studio起動
```

## プロジェクト構成

```
src/
├── app/
│   ├── (auth)/login/       # ログイン
│   ├── (student)/student/  # 生徒用ページ
│   ├── (teacher)/teacher/  # 教員用ページ
│   ├── (admin)/admin/      # 管理者用ページ
│   └── api/auth/           # Auth.js APIルート
├── components/
│   ├── layout/             # レイアウトコンポーネント
│   └── ui/                 # shadcn/ui コンポーネント
├── lib/
│   ├── auth/               # 認証・認可
│   ├── db/                 # Prismaクライアント
│   └── utils.ts            # ユーティリティ
├── generated/prisma/       # Prisma生成コード (gitignore)
└── proxy.ts                # Next.js Proxy (認証ガード)
prisma/
├── schema.prisma           # DBスキーマ
├── seed.ts                 # シードエントリポイント
└── seed/                   # シードデータ
```

## ロール

- `student` - 生徒
- `teacher` - 教員
- `subject_lead` - 教科主任
- `admin` - 管理者

## コーディング規約

- パスalias `@/` → `src/`
- Server Components をデフォルトで使用し、必要な場合のみ `"use client"`
- Prisma クライアントは `@/lib/db/prisma` からインポート
- 認証情報は `@/lib/auth/auth` の `auth()` で取得

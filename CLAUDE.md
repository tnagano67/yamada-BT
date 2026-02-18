# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

高校全校（生徒1,000名、教員60名）向けの英単語・日本語の朝テスト学習システム。
生徒はグレード制（英語E1〜E48、日本語J1〜J20）で4択クイズを受験し、3回連続合格で次のグレードに昇格する。

## 技術スタック

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **UI**: Tailwind CSS v4 + shadcn/ui (New York style)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js v5 (Google OAuth + 開発用Credentials)
- **Testing**: Vitest + Testing Library (jsdom)
- **Linting**: ESLint 9 (Flat Config)

## 開発コマンド

```bash
npm run dev              # 開発サーバー起動 (Turbopack)
npm run build            # プロダクションビルド
npm run test             # テスト実行 (vitest run)
npm run test:watch       # テスト監視モード
npx vitest run src/lib/quiz/scorer.test.ts  # 単一テストファイル実行
npx eslint .             # ESLint実行
npx prisma generate      # Prismaクライアント生成
npx prisma db push       # スキーマをDBに反映（開発用、マイグレーション履歴なし）
npx prisma db seed       # シードデータ投入
```

**注意**: `prisma db push` 後は dev server の再起動が必要（グローバルキャッシュされた PrismaClient に新モデルが反映されないため）

## アーキテクチャ

### ルーティングと認可

- `src/proxy.ts` がNext.js 16のProxy機能で認証ガードを担当（従来のmiddleware.tsの代替）
- ロール階層: `student(0) < teacher(1) < subject_lead(2) < admin(3)`
- URLプレフィックスベースの認可: `/admin/*` → admin以上、`/teacher/*` → teacher以上、`/student/*` → student以上
- **Server Actionsでも必ず`auth()`で認証チェックを行うこと**（proxyだけに依存しない）

### 認証

- `src/lib/auth/auth.ts` — NextAuth設定。JWTストラテジー使用。セッションに`user.role`を含む
- `src/lib/auth/auth.config.ts` — プロバイダー設定。本番はGoogle OAuth、開発環境はCredentials（dev-login）も利用可能
- `ALLOWED_DOMAIN`環境変数でメールドメイン制限

### ドメインロジック（lib層）

ビジネスロジックはlib層の純粋関数とサービスに分離されている：

- **`src/lib/quiz/`** — クイズ生成・採点・おすすめ
  - `generator.ts`: グレードの単語プールから4択問題を自動生成（新出語はFisher-Yatesシャッフル、復習は層化サンプリング、quickモード時は誤答30%優先出題）
  - `scorer.ts`: 回答リストから採点（80%以上で合格）
  - `recommendation.ts`: 学習おすすめ判定（純粋関数。昇格間近→誤答復習→今日未学習の優先順）
  - `constants.ts`: 問題数10問、合格ライン80%、4択、誤答優先割合30%
- **`src/lib/grade/`** — グレード昇格
  - `promotion.ts`: グレードID解析（E5→english#5）、昇格計算（純粋関数）
  - `grade-service.ts`: DB操作を含む昇格処理（`$transaction`でアトミック実行）、昇格チャレンジ残り回数（1日3回制限、日付変更で遅延リセット）
  - `constants.ts`: 連続3回合格で昇格、英語48段階、日本語20段階、1日3回制限
- **`src/lib/schedule/`** — 配信スケジュール管理
  - `schedule-service.ts`: 曜日パターンCRUD、休止期間管理、月間カレンダーデータ取得
  - `delivery-generator.ts`: 配信の自動生成・アクティブ化・クローズ（Cron Jobから呼び出し）
- **`src/lib/auth/roles.ts`** — ロール判定ヘルパー、デフォルトリダイレクトパス

### クイズモードと昇格ルール

4つのモードがあり、昇格に反映されるのは一部のみ：

| モード | 用途 | 昇格反映 |
|--------|------|----------|
| `morning_test` | 朝テスト（配信ベース） | する |
| `promotion` | 昇格チャレンジ（1日3回制限） | する |
| `quick` | クイック練習（誤答優先出題） | しない |
| `weakness` | 苦手克服（Sprint 7で実装予定） | しない |

### Server Actions

`src/app/(student)/student/quiz/actions.ts` に集約。クイズの開始→回答→完了の3ステップフロー：
1. `startQuiz()` — 問題生成＋QuizAttempt作成→クイズページへリダイレクト。promotionモード時は残り回数チェック
2. `submitAnswer()` — 1問ずつ回答を送信、即時正誤フィードバック返却
3. `completeQuiz()` — 採点→スコア保存→昇格処理（morning_test/promotionのみ）→結果ページへリダイレクト

### 自動配信（Cron Jobs）

`vercel.json` で3つのCronを定義。各エンドポイントは `CRON_SECRET` のBearerトークンで認証：
- `/api/cron/generate-deliveries` — 22:00 JST: 翌日分のQuizDeliveryを生成
- `/api/cron/activate-delivery` — 8:15 JST: scheduled→active
- `/api/cron/close-delivery` — 8:30 JST: active→closed

### レイアウト構成

Route Groups `(auth)`, `(student)`, `(teacher)`, `(admin)` でロール別レイアウトを分離。各グループのlayout.tsxで`auth()`によるセッション確認を実行。

## コーディング規約

- パスエイリアス `@/` → `src/`
- Server Componentsをデフォルトで使用し、必要な場合のみ `"use client"`
- Prismaクライアントは `@/lib/db/prisma` からインポート
- Prisma生成コードは `@/generated/prisma/client` からインポート（`@/generated/prisma`ではない）
- 認証情報は `@/lib/auth/auth` の `auth()` で取得
- `next.config.ts` で `turbopack.root` を設定済み（親ディレクトリのlockfile問題の回避策）
- DB操作を伴うグレード・昇格処理は `prisma.$transaction` でアトミックに実行する
- 独立した非同期処理は `Promise.all()` で並列フェッチする

## ロール

- `student` — 生徒
- `teacher` — 教員
- `subject_lead` — 教科主任（配信スケジュール管理権限）
- `admin` — 管理者

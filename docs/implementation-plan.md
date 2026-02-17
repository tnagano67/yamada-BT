# グレードアップ学習システム - 実装計画書

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| システム名 | グレードアップ学習システム |
| 対象 | 高校全校（生徒約1,000名、教員約60名） |
| 教科 | 英単語（1,900語・48グレード）、日本語（800語・20グレード） |
| 問題形式 | 4択（単語帳データから自動生成） |
| 端末 | 学校PC（メイン）+ スマホ対応（PWA） |
| 認証 | Google学校アカウント |

---

## 2. 技術スタック

### フロントエンド

| 技術 | 選定理由 |
|------|----------|
| **Next.js 16 (App Router)** | SSR/SSG対応、PWA化容易、API Routes統合 |
| **TypeScript** | 型安全性、大規模開発の品質維持 |
| **Tailwind CSS** | 高速なUI開発、レスポンシブ対応 |
| **shadcn/ui** | 高品質UIコンポーネント、カスタマイズ性 |
| **Recharts** | グラフ・チャート表示（成績推移、グレード分布等） |
| **next-pwa (Serwist)** | PWA対応（Service Worker、オフラインキャッシュ） |
| **Framer Motion** | 昇格演出・バッジ獲得アニメーション |

### バックエンド

| 技術 | 選定理由 |
|------|----------|
| **Next.js API Routes / Server Actions** | フロントと統合、デプロイ簡素化 |
| **Prisma** | 型安全なORM、マイグレーション管理 |
| **PostgreSQL** | 堅牢なRDB、JSONB対応、全文検索 |
| **Supabase** | PostgreSQLホスティング、Realtime、Row Level Security |
| **NextAuth.js (Auth.js v5)** | Google OAuth認証、セッション管理 |
| **node-cron / pg_cron** | 日次バッチ処理（ストリーク判定、バッジ判定等） |

### インフラ・運用

| 技術 | 選定理由 |
|------|----------|
| **Vercel** | Next.jsのホスティング、Edge Functions |
| **Supabase (PostgreSQL)** | DB / Auth / Realtime / Storage |
| **Upstash (Redis)** | セッションキャッシュ、レート制限 |
| **GitHub Actions** | CI/CD パイプライン |
| **Sentry** | エラー監視 |

---

## 3. システムアーキテクチャ

```
┌──────────────────────────────────────────────────────────────────┐
│                        クライアント                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  学校PC (Chrome) │  │  スマホ (PWA)    │  │ 教員PC (Chrome)│  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
└───────────┼─────────────────────┼──────────────────┼────────────┘
            │                     │                  │
            ▼                     ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Vercel (Next.js)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  SSR Pages   │  │ API Routes   │  │  Server Actions        │ │
│  │  (生徒画面)   │  │  (REST API)  │  │  (データ操作)          │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  Middleware   │  │  Edge Funcs  │                              │
│  │  (認証・ロール)│  │  (通知配信)  │                              │
│  └──────────────┘  └──────────────┘                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Supabase                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  PostgreSQL   │  │  Auth        │  │  Realtime              │ │
│  │  (メインDB)   │  │  (Google)    │  │  (テスト配信通知)      │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  Storage      │  │  Edge Funcs  │                              │
│  │  (CSV/PDF)    │  │  (バッチ処理) │                              │
│  └──────────────┘  └──────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. データベース設計（主要テーブル）

### 4.1 ユーザー・認証系

```
users
  id: UUID (PK)
  email: VARCHAR (UNIQUE)        -- Google学校アカウント
  name: VARCHAR
  name_kana: VARCHAR
  role: ENUM(student, teacher, subject_lead, admin)
  is_active: BOOLEAN
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

classes
  id: UUID (PK)
  academic_year: INT
  grade_year: INT                -- 学年 (1, 2, 3)
  class_name: VARCHAR            -- 組 (A, B, C...)
  homeroom_teacher_id: UUID (FK → users)

class_students
  class_id: UUID (FK)
  student_id: UUID (FK)
  student_number: INT            -- 出席番号
  status: ENUM(active, transferred, suspended, graduated)

teacher_class_assignments
  teacher_id: UUID (FK)
  class_id: UUID (FK)
  role: ENUM(homeroom, subject_teacher)
  subject: ENUM(english, japanese)?
```

### 4.2 単語帳・グレード系

```
grades
  id: VARCHAR (PK)               -- E1, E2, ..., E48, J1, ..., J20
  subject: ENUM(english, japanese)
  grade_number: INT
  word_start: INT                -- 開始番号
  word_end: INT                  -- 終了番号
  grade_type: ENUM(new, review, complete)
  review_range_start: INT?       -- 復習グレード: 累計範囲開始
  review_range_end: INT?         -- 復習グレード: 累計範囲終了
  block_number: INT              -- ブロック番号

words
  id: UUID (PK)
  word_number: INT               -- 通し番号
  subject: ENUM(english, japanese)
  word: VARCHAR                  -- 単語
  meaning: VARCHAR               -- 意味
  part_of_speech: VARCHAR        -- 品詞
  grade_id: VARCHAR (FK → grades)
  category_tags: TEXT[]          -- 意味カテゴリタグ
  similar_words: UUID[]          -- 形態類似単語のID

student_grades
  id: UUID (PK)
  student_id: UUID (FK)
  subject: ENUM(english, japanese)
  current_grade_id: VARCHAR (FK → grades)
  promoted_at: TIMESTAMP?        -- 最終昇格日時
  updated_at: TIMESTAMP
```

### 4.3 テスト・回答系

```
quiz_schedules
  id: UUID (PK)
  academic_year: INT
  semester: INT
  day_of_week: INT               -- 0-6 (月-日)
  subject: ENUM(english, japanese)
  delivery_time: TIME
  deadline_minutes: INT

quiz_deliveries
  id: UUID (PK)
  date: DATE
  subject: ENUM(english, japanese)
  delivery_time: TIMESTAMP
  deadline_time: TIMESTAMP
  status: ENUM(scheduled, active, closed, cancelled)

quiz_attempts
  id: UUID (PK)
  delivery_id: UUID (FK)
  student_id: UUID (FK)
  grade_id: VARCHAR (FK)         -- 受験時のグレード
  mode: ENUM(morning_test, quick, weakness, promotion)
  started_at: TIMESTAMP
  submitted_at: TIMESTAMP?
  score: INT
  score_percentage: DECIMAL
  is_passed: BOOLEAN
  is_suspended: BOOLEAN
  session_state: JSONB?

quiz_answers
  id: UUID (PK)
  attempt_id: UUID (FK)
  word_id: UUID (FK)
  question_direction: ENUM(en_to_ja, ja_to_en, meaning_to_word)
  correct_option: VARCHAR
  selected_option: VARCHAR
  all_options: TEXT[]
  is_correct: BOOLEAN
  hint_used: BOOLEAN
  time_spent_ms: INT
  answered_at: TIMESTAMP
```

### 4.4 昇格・ストリーク・バッジ系

```
promotion_progress
  id: UUID (PK)
  student_id: UUID (FK)
  subject: ENUM(english, japanese)
  target_grade_id: VARCHAR (FK)
  consecutive_passes: INT        -- 連続合格回数 (0-3)
  last_pass_at: TIMESTAMP?
  attempts_today: INT
  updated_at: TIMESTAMP

student_streaks
  id: UUID (PK)
  student_id: UUID (FK)
  current_streak: INT
  max_streak: INT
  freeze_remaining: INT
  revival_remaining: INT
  last_activity_date: DATE
  streak_start_date: DATE?
  flame_level: INT               -- 0-5
  vacation_frozen_streak: INT?
  updated_at: TIMESTAMP

streak_daily_logs
  id: UUID (PK)
  student_id: UUID (FK)
  date: DATE
  status: ENUM(attended, freeze_used, excused, missed, vacation, skipped)
  streak_count_after: INT

review_items
  id: UUID (PK)
  student_id: UUID (FK)
  word_id: UUID (FK)
  subject: ENUM(english, japanese)
  grade_id: VARCHAR (FK)
  leitner_level: INT             -- 0-5
  next_review_date: DATE
  total_attempts: INT
  correct_count: INT
  wrong_count: INT
  last_wrong_answer: VARCHAR?
  graduated_at: TIMESTAMP?
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

badge_master
  id: UUID (PK)
  name: VARCHAR
  description: VARCHAR
  category: ENUM(continuity, achievement, growth)
  icon_key: VARCHAR
  difficulty: INT
  condition_type: VARCHAR
  condition_value: INT
  condition_detail: JSONB?
  phase: INT
  reveal_condition: VARCHAR?
  sort_order: INT

student_badges
  id: UUID (PK)
  student_id: UUID (FK)
  badge_id: UUID (FK)
  earned_at: TIMESTAMP
  is_notified: BOOLEAN

student_badge_reveals
  student_id: UUID (FK)
  badge_id: UUID (FK)
  revealed_at: TIMESTAMP
```

### 4.5 管理・通知系

```
school_calendar
  id: UUID (PK)
  date: DATE
  day_type: ENUM(school_day, weekend, holiday, vacation, exam_period, special)
  has_morning_test: BOOLEAN
  streak_required: BOOLEAN
  note: VARCHAR?

semesters
  id: UUID (PK)
  academic_year: INT
  term: INT
  start_date: DATE
  end_date: DATE

semester_goals
  id: UUID (PK)
  student_id: UUID (FK)
  semester_id: UUID (FK)
  subject: ENUM(english, japanese)
  target_grade_id: VARCHAR (FK)
  status: ENUM(in_progress, achieved, not_achieved)

notifications
  id: UUID (PK)
  user_id: UUID (FK)
  type: VARCHAR
  title: VARCHAR
  body: TEXT
  is_read: BOOLEAN
  is_push_sent: BOOLEAN
  created_at: TIMESTAMP

notification_settings
  user_id: UUID (FK, PK)
  push_test_delivery: BOOLEAN
  push_test_reminder: BOOLEAN
  push_streak_warning: BOOLEAN
  email_daily_summary: BOOLEAN
  email_weekly_report: BOOLEAN

teacher_alerts
  id: UUID (PK)
  teacher_id: UUID (FK)
  student_id: UUID (FK)
  alert_type: VARCHAR
  severity: ENUM(high, medium, low)
  message: TEXT
  is_acknowledged: BOOLEAN
  created_at: TIMESTAMP

teacher_notes
  id: UUID (PK)
  teacher_id: UUID (FK)
  student_id: UUID (FK)
  content: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
```

---

## 5. 実装フェーズ

全体を **4フェーズ・16スプリント**（1スプリント = 2週間）で計画する。

### フェーズ概要

| フェーズ | 期間 | 内容 | 優先度 |
|---------|------|------|--------|
| Phase 1: MVP | Sprint 1-6 (12週) | コア機能（朝テスト・グレード・基本UI） | P0 |
| Phase 2: 学習強化 | Sprint 7-10 (8週) | 自学自習拡張・バッジ・通知 | P1 |
| Phase 3: 運用品質 | Sprint 11-13 (6週) | 演出・分析・オフライン | P2 |
| Phase 4: 拡張 | Sprint 14-16 (6週) | レポート・将来拡張 | P3 |

---

## 6. Phase 1: MVP（Sprint 1-6）

**目標:** 朝テストを全校で運用開始できる最小限のシステムを構築する。

### Sprint 1: プロジェクト基盤・認証・DB（2週間）

**目標:** 開発環境・認証・基本データモデルの構築

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 1.1 | プロジェクト初期化 | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui セットアップ | 4h |
| 1.2 | Prisma + DB設計 | スキーマ定義、マイグレーション、Supabase接続 | 8h |
| 1.3 | Google OAuth認証 | NextAuth.js v5 + Google Provider + 学校ドメイン制限 | 8h |
| 1.4 | ロールベース認可 | Middleware でロール判定、ルートガード実装 | 6h |
| 1.5 | 共通レイアウト | 生徒用/教員用レイアウト、ナビゲーション、レスポンシブ対応 | 8h |
| 1.6 | 単語帳マスタデータ投入 | 英単語1,900語 + 日本語800語のseed作成、グレードマスタ | 6h |
| 1.7 | CI/CD パイプライン | GitHub Actions（lint, test, build, deploy） | 4h |

**成果物:**
- ログイン可能なアプリケーション
- ロール別アクセス制御
- マスタデータ投入済みDB

---

### Sprint 2: 4択問題自動生成・朝テストコア（2週間）

**目標:** 4択問題の自動生成エンジンと朝テスト受験機能の実装

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 2.1 | 4択問題生成エンジン | グレード範囲からの10問選出、誤答選択肢ランダム生成、シャッフル | 12h |
| 2.2 | 問題表示UI | 4択問題画面、選択肢タップ、正誤即時表示（0.5秒） | 8h |
| 2.3 | テスト受験フロー | カウントダウン → 10問解答 → 結果画面 | 10h |
| 2.4 | 結果画面（生徒） | スコア表示、正答率、間違えた問題一覧、正解表示 | 6h |
| 2.5 | 自動採点ロジック | 回答保存、正誤判定、スコア算出 | 4h |
| 2.6 | 朝テスト配信API | quiz_deliveries生成、ステータス管理（scheduled→active→closed） | 8h |
| 2.7 | テスト一覧・受験導線 | 配信中テストバナー、ワンタップ開始 | 4h |

**成果物:**
- 4択10問の自動生成・受験・自動採点が動作
- 朝テスト配信の基本フロー

---

### Sprint 3: グレード制度・昇格ロジック（2週間）

**目標:** グレード昇格の仕組みと生徒のグレード管理

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 3.1 | 生徒グレード管理 | student_grades CRUD、初期グレード設定（E1/J1） | 6h |
| 3.2 | 昇格判定ロジック | 3回連続80%以上で昇格、統合カウント方式実装 | 10h |
| 3.3 | 昇格カウント管理 | promotion_progress テーブル操作、合格/不合格時のカウント更新 | 6h |
| 3.4 | 朝テストとグレード連動 | 朝テスト提出時に昇格カウント更新、昇格実行 | 6h |
| 3.5 | グレード進捗表示 | グレードカード、進捗バー、次グレードまでの状況 | 6h |
| 3.6 | 復習グレード対応 | 累計範囲からの均等出題、復習グレード（E5,E10等）判定 | 8h |
| 3.7 | 昇格通知 | 昇格成功時の結果画面表示、簡易演出 | 4h |

**成果物:**
- グレード昇格が正しく動作
- 朝テスト → 昇格の一連フロー完成

---

### Sprint 4: 自学自習モード（基本）・配信スケジュール（2週間）

**目標:** クイック練習・昇格チャレンジ + 教員向け配信スケジュール管理

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 4.1 | クイック練習モード | 現在グレード範囲から10問、過去の誤答30%優先出題 | 8h |
| 4.2 | 昇格チャレンジモード | 昇格判定テスト、1日3回制限、統合カウント反映 | 8h |
| 4.3 | 自学自習メニュー画面 | モード選択UI、レコメンドカード | 6h |
| 4.4 | 配信スケジュール管理画面 | 曜日パターン設定、休止期間登録（教科主任向け） | 10h |
| 4.5 | 自動配信バッチ | 前日夜の問題生成、当日8:15自動配信、8:30自動締切 | 8h |
| 4.6 | 配信カレンダー表示 | 月間カレンダーで配信予定・実績を可視化 | 6h |

**成果物:**
- 生徒が自分のペースで練習・昇格チャレンジ可能
- 教科主任が配信スケジュールを一括設定可能

---

### Sprint 5: ストリーク基本・学校カレンダー・クラス管理（2週間）

**目標:** ストリーク機能、学校カレンダー、クラス・生徒管理

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 5.1 | ストリークカウントロジック | 授業日に朝テスト受験でカウント、土日祝自動スキップ | 8h |
| 5.2 | フリーズ制度 | 学期3回、自動適用、公欠対応 | 6h |
| 5.3 | ストリーク表示 | 炎アイコン（5段階）、連続日数、フリーズ残数 | 6h |
| 5.4 | 学校カレンダー管理画面 | 日種別設定、CSVインポート、学期区分設定 | 10h |
| 5.5 | クラス・生徒管理画面 | クラス一覧、生徒CSV一括登録、転入/転出/異動対応 | 10h |
| 5.6 | 教員アカウント管理画面 | 教員登録、ロール付与、担当クラス設定 | 6h |
| 5.7 | ストリーク日次バッチ | 毎日22:00にストリーク判定実行 | 4h |

**成果物:**
- ストリーク機能が動作
- 管理者が学校運営データを管理可能

---

### Sprint 6: 教員ダッシュボード（基本）・生徒ホーム画面（2週間）

**目標:** MVP完成。教員が朝テスト結果を確認でき、生徒がホーム画面で学習状況を把握できる

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 6.1 | 生徒ホーム画面 | 朝テストバナー、ストリーク、グレード進捗、レスポンシブ | 10h |
| 6.2 | 教員ダッシュボード（トップ） | 今日のサマリー、受験率、平均正答率 | 8h |
| 6.3 | クラス詳細画面 | 概要タブ、生徒一覧タブ、テスト結果タブ | 10h |
| 6.4 | 要注意アラート | 6条件×3段階、自動生成、確認済みフラグ | 8h |
| 6.5 | 個別生徒詳細画面（基本） | グレード、テスト成績一覧、ストリーク状況 | 6h |
| 6.6 | 権限チェック統合テスト | ロール別アクセス制御のE2Eテスト | 4h |
| 6.7 | MVP全体結合テスト | 朝テスト配信→受験→採点→昇格→ダッシュボード反映 | 6h |

**成果物:**
- **MVP完成** - 朝テストの全校運用が開始可能
- 生徒ホーム画面 + 教員ダッシュボード

---

## 7. Phase 2: 学習強化（Sprint 7-10）

**目標:** 学習効果を高める機能群を追加。

### Sprint 7: 苦手克服モード・Leitnerシステム（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 7.1 | 苦手リスト管理 | review_items CRUD、不正解時の自動追加 | 8h |
| 7.2 | 修正Leitnerシステム | Lv0-5の復習間隔管理、正解/不正解時のレベル遷移 | 8h |
| 7.3 | 苦手克服モード | 苦手リストから定着度低い順に10問出題 | 6h |
| 7.4 | 苦手リスト画面 | 単語一覧、定着度バー、フィルター、「克服した単語」タブ | 8h |
| 7.5 | セッション中の再出題 | 間違えた問題を10問後に追加出題 | 4h |
| 7.6 | 「今日のおすすめ学習」ロジック | 優先度判定（昇格間近→苦手復習→クイック練習） | 6h |

---

### Sprint 8: バッジシステム（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 8.1 | バッジマスタデータ投入 | 初期10個のバッジ定義（3カテゴリ） | 4h |
| 8.2 | バッジ判定エンジン | リアルタイム判定（テスト提出時）+ 日次バッチ判定 | 12h |
| 8.3 | バッジ獲得通知 | アプリ内トースト通知、一言コメント | 4h |
| 8.4 | バッジコレクション画面 | カテゴリ別表示、取得済み/未取得/???状態 | 8h |
| 8.5 | バッジ段階的開示ロジック | 条件判明タイミングの管理 | 6h |
| 8.6 | プロフィール画面 | グレード、ストリーク、バッジ、学習記録、公開設定 | 8h |

---

### Sprint 9: 通知システム・学期目標（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 9.1 | 通知基盤 | notifications テーブル、通知センター（ベルアイコン） | 8h |
| 9.2 | プッシュ通知 | Web Push API、Service Worker登録、配信ロジック | 10h |
| 9.3 | 通知設定画面 | 生徒/教員向け、通知種別ごとのON/OFF | 4h |
| 9.4 | 教員メール通知 | 日次サマリー、週次レポート、テスト結果速報 | 8h |
| 9.5 | 学期目標設定 | 学年目標 → 個人推奨目標自動算出 → 生徒確認・調整 | 8h |
| 9.6 | 学期目標進捗表示 | ホーム画面に進捗バー、中間チェック通知 | 4h |

---

### Sprint 10: 教員ダッシュボード（詳細）・CSVエクスポート（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 10.1 | 個別生徒画面（詳細） | 成績推移グラフ、苦手分野表示、教員メモ | 10h |
| 10.2 | CSVエクスポート | テスト結果/問題別正答率/生徒別サマリー/学期末レポート | 10h |
| 10.3 | 教員メモ機能 | 自由記述、保存、年度引き継ぎ対応 | 4h |
| 10.4 | 教員向けレコメンド | 「復習テストを配信しましょう」等の提案 | 6h |
| 10.5 | 生徒の昇格条件個別調整 | 教員が特定生徒の昇格条件を変更可能 | 6h |

---

## 8. Phase 3: 運用品質（Sprint 11-13）

**目標:** UXの向上と運用安定化。

### Sprint 11: 演出・復活チャレンジ（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 11.1 | 通常昇格演出 | カード出現 + 紙吹雪（Framer Motion、約5秒） | 8h |
| 11.2 | 復習グレードクリア演出 | ゴールドオーバーレイ +「ブロッククリア!」（約8秒） | 6h |
| 11.3 | 完全制覇演出 | 虹色オーバーレイ + 一文字表示 + 特別称号（約15秒） | 8h |
| 11.4 | 称号システム | 称号マスタ、獲得ロジック、プロフィール表示 | 6h |
| 11.5 | 復活チャレンジ | 学期2回、80%合格でストリーク復活 | 8h |
| 11.6 | 演出サウンド | ファンファーレ音源、サウンド設定ON/OFF | 4h |

---

### Sprint 12: 4択品質向上・セッション管理（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 12.1 | 意味近接ディストラクター | カテゴリタグ活用、同品詞・同カテゴリからの選出 | 10h |
| 12.2 | 形態類似ディストラクター | レーベンシュタイン距離ベースの類似語選出 | 8h |
| 12.3 | 消去法対策 | 品詞統一、文字数均一化、正解位置均等配分 | 6h |
| 12.4 | セッション中断・再開 | 進捗保存、24時間以内の再開対応 | 8h |
| 12.5 | 混同パターン学習 | 回答履歴から「AをBと答えた」パターンを蓄積 | 6h |
| 12.6 | ヒント機能 | 30秒経過で表示、正解の最初の1文字/品詞 | 4h |

---

### Sprint 13: データ分析・オフライン対応（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 13.1 | グレード分布表示 | 学年/クラス別の棒グラフ、統計サマリー | 6h |
| 13.2 | クラス間比較 | クラス別平均グレード、正答率推移 | 6h |
| 13.3 | 苦手分析ヒートマップ | グレード範囲別正答率、間違いやすい問題TOP5 | 8h |
| 13.4 | 成長推移グラフ | 時系列でのクラス平均グレード推移、目標ライン | 6h |
| 13.5 | PWAオフライン対応 | Service Worker、問題データキャッシュ、オンライン復帰時同期 | 10h |
| 13.6 | パフォーマンス最適化 | 朝8:00-8:15の同時アクセス対策、キャッシュ戦略 | 6h |

---

## 9. Phase 4: 拡張（Sprint 14-16）

**目標:** 運用安定後の発展的機能追加。

### Sprint 14: 年度更新・学期末レポート（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 14.1 | 年度更新機能 | 3フェーズ（準備→切替→事後）、CSVインポート | 12h |
| 14.2 | データ引き継ぎ | グレード・バッジ永続、ストリーク・フリーズリセット | 6h |
| 14.3 | 卒業生処理 | アーカイブ移動、データ保持ポリシー、自動削除 | 6h |
| 14.4 | 学期末レポート自動生成 | 個人レポート + クラス全体レポート（PDF/CSV） | 12h |
| 14.5 | 自動コメント生成 | 4軸（グレード上昇、正答率、受験率、ストリーク）から定型文組立 | 6h |

---

### Sprint 15: 出題バリエーション・追加バッジ（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 15.1 | 出題方向バリエーション | 英→和(60%)、和→英(30%)、意味→単語(10%) | 8h |
| 15.2 | 金曜週まとめテスト | 月〜木の誤答を優先的に出題する復習テスト | 6h |
| 15.3 | 追加バッジ（フェーズ2） | 鉄の意志、不屈のランナー、パーフェクトウィーク等 | 8h |
| 15.4 | 長期休暇中の自習ボーナス | 休暇中5日以上学習でフリーズ+1 | 4h |
| 15.5 | 定着完了後の忘却防止 | 30日経過後の再出題、低確率（10%）での通常出題 | 6h |

---

### Sprint 16: アクセシビリティ・最終調整（2週間）

| # | タスク | 詳細 | 見積 |
|---|--------|------|------|
| 16.1 | アクセシビリティ対応 | ARIA属性、キーボード操作、スクリーンリーダー | 8h |
| 16.2 | 低スペックPC対応 | 演出の簡易版自動切替、最小フォントサイズ保証 | 4h |
| 16.3 | セキュリティ監査 | OWASP Top 10チェック、認証・認可テスト | 8h |
| 16.4 | 負荷テスト | 1,000同時接続シミュレーション、ボトルネック改善 | 8h |
| 16.5 | ドキュメント整備 | 管理者マニュアル、教員操作ガイド、FAQ | 8h |
| 16.6 | 導入研修準備 | 教科主任30分/HR担任30分/全体会15分の研修資料 | 6h |

---

## 10. ディレクトリ構成

```
yamada-BT/
├── docs/                           # 設計ドキュメント
│   ├── design/                     # 設計書群
│   └── implementation-plan.md      # 本ファイル
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # 認証関連ページ
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (student)/              # 生徒向けページ
│   │   │   ├── dashboard/          # ホーム画面
│   │   │   ├── quiz/               # テスト受験
│   │   │   ├── study/              # 自学自習
│   │   │   │   ├── quick/          # クイック練習
│   │   │   │   ├── weakness/       # 苦手克服
│   │   │   │   └── promotion/      # 昇格チャレンジ
│   │   │   ├── profile/            # プロフィール
│   │   │   ├── badges/             # バッジコレクション
│   │   │   └── review-list/        # 苦手リスト
│   │   ├── (teacher)/              # 教員向けページ
│   │   │   ├── dashboard/          # 教員ダッシュボード
│   │   │   ├── classes/            # クラス管理
│   │   │   │   └── [classId]/      # クラス詳細
│   │   │   │       └── students/
│   │   │   │           └── [studentId]/ # 個別生徒詳細
│   │   │   ├── schedule/           # 配信スケジュール
│   │   │   ├── analysis/           # データ分析
│   │   │   └── export/             # CSVエクスポート
│   │   ├── (admin)/                # 管理者向けページ
│   │   │   ├── school/             # 学校管理
│   │   │   ├── calendar/           # カレンダー管理
│   │   │   ├── teachers/           # 教員管理
│   │   │   ├── students/           # 生徒管理
│   │   │   └── annual-update/      # 年度更新
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/
│   │   │   ├── quiz/
│   │   │   ├── grade/
│   │   │   ├── streak/
│   │   │   ├── badge/
│   │   │   ├── notification/
│   │   │   └── admin/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                 # 共有コンポーネント
│   │   ├── ui/                     # shadcn/ui コンポーネント
│   │   ├── quiz/                   # テスト関連
│   │   │   ├── QuizQuestion.tsx    # 4択問題表示
│   │   │   ├── QuizResult.tsx      # 結果画面
│   │   │   └── QuizTimer.tsx       # タイマー
│   │   ├── grade/                  # グレード関連
│   │   │   ├── GradeCard.tsx       # グレードカード
│   │   │   ├── GradeProgress.tsx   # 進捗バー
│   │   │   └── PromotionEffect.tsx # 昇格演出
│   │   ├── streak/                 # ストリーク関連
│   │   │   ├── FlameIcon.tsx       # 炎アイコン
│   │   │   └── StreakDisplay.tsx   # ストリーク表示
│   │   ├── badge/                  # バッジ関連
│   │   │   ├── BadgeCard.tsx       # バッジカード
│   │   │   └── BadgeCollection.tsx # コレクション
│   │   ├── dashboard/              # ダッシュボード
│   │   │   ├── StudentHome.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   └── AlertCard.tsx
│   │   └── layout/                 # レイアウト
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── TabBar.tsx
│   ├── lib/                        # ユーティリティ・ロジック
│   │   ├── db/                     # データベース
│   │   │   └── prisma.ts
│   │   ├── auth/                   # 認証
│   │   │   ├── auth.ts
│   │   │   └── roles.ts
│   │   ├── quiz/                   # テスト生成ロジック
│   │   │   ├── generator.ts        # 問題自動生成
│   │   │   ├── distractor.ts       # 誤答選択肢生成
│   │   │   └── scorer.ts           # 採点ロジック
│   │   ├── grade/                  # グレード管理
│   │   │   ├── promotion.ts        # 昇格判定
│   │   │   └── grade-map.ts        # グレード構成マップ
│   │   ├── streak/                 # ストリーク
│   │   │   ├── calculator.ts       # ストリーク計算
│   │   │   └── freeze.ts           # フリーズ管理
│   │   ├── badge/                  # バッジ
│   │   │   └── evaluator.ts        # バッジ判定
│   │   ├── leitner/                # Leitnerシステム
│   │   │   └── scheduler.ts        # 復習スケジューリング
│   │   └── notification/           # 通知
│   │       ├── push.ts
│   │       └── email.ts
│   ├── hooks/                      # カスタムフック
│   │   ├── useQuiz.ts
│   │   ├── useGrade.ts
│   │   └── useStreak.ts
│   └── types/                      # 型定義
│       ├── quiz.ts
│       ├── grade.ts
│       ├── user.ts
│       └── streak.ts
├── prisma/
│   ├── schema.prisma               # DBスキーマ
│   ├── migrations/                  # マイグレーション
│   └── seed/                        # シードデータ
│       ├── words-english.ts         # 英単語1,900語
│       ├── words-japanese.ts        # 日本語800語
│       ├── grades.ts                # グレードマスタ
│       └── badges.ts                # バッジマスタ
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service Worker
│   └── sounds/                      # 演出サウンド
├── tests/
│   ├── unit/                        # ユニットテスト
│   │   ├── quiz-generator.test.ts
│   │   ├── promotion.test.ts
│   │   └── streak.test.ts
│   ├── integration/                 # 統合テスト
│   └── e2e/                         # E2Eテスト
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── CLAUDE.md
```

---

## 11. テスト戦略

| レイヤー | ツール | 対象 | カバレッジ目標 |
|---------|--------|------|---------------|
| ユニットテスト | Vitest | ビジネスロジック（問題生成、昇格判定、ストリーク計算、バッジ判定） | 90%以上 |
| 統合テスト | Vitest + Prisma | API Routes、DB操作、認証フロー | 80%以上 |
| E2Eテスト | Playwright | 主要ユーザーフロー（朝テスト受験、昇格、ダッシュボード） | 主要フロー100% |
| ビジュアルテスト | Storybook + Chromatic | UIコンポーネント | 主要コンポーネント |

### 特に重要なテストケース

1. **昇格判定**: 3回連続合格で昇格、不合格でリセット、統合カウント
2. **問題生成**: グレード範囲内からの出題、復習グレードの均等出題、選択肢シャッフル
3. **ストリーク**: 土日スキップ、フリーズ適用、公欠対応、長期休暇凍結
4. **バッジ判定**: 10種類すべての条件判定、段階的開示
5. **権限制御**: 4ロール × 全画面のアクセス制御
6. **同時アクセス**: 1,000名同時テスト受験のシナリオ

---

## 12. 非機能要件

| 項目 | 目標 |
|------|------|
| レスポンス時間 | ページ読み込み 2秒以内（LCP） |
| 同時接続 | 1,000名同時テスト受験に耐える |
| 可用性 | 99.9%（朝テスト配信時間帯は特に重要） |
| セキュリティ | Google OAuth、RBAC、CSRF対策、入力バリデーション |
| データ保持 | 在校生: 無期限、卒業生: 成績3年/個人情報1年 |
| バックアップ | 日次自動バックアップ、年度更新前の手動バックアップ |
| アクセシビリティ | WCAG 2.1 AA準拠 |

---

## 13. リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 朝テスト配信時の同時アクセス負荷 | 高 | テストデータ事前キャッシュ、CDN活用、DB接続プーリング |
| 単語帳マスタデータの品質 | 高 | 投入前にダブルチェック、教科主任レビュー |
| Google認証の障害 | 中 | セッションキャッシュ延長、障害時の手動延長対応 |
| 教員のITリテラシーばらつき | 中 | 段階的研修、操作ガイド、最小限操作の設計 |
| オフライン時のデータ同期衝突 | 低 | サーバー側を正として同期、競合時の自動マージ |

---

## 14. 導入スケジュール（例）

```
2026年3月   Phase 1 開発開始
2026年5月   MVP完成 → 教員トライアル開始
2026年6月   1-2クラスで生徒トライアル
2026年7月   Phase 2 開発 + トライアルフィードバック反映
2026年9月   全校運用開始（2学期〜）
2026年10月  Phase 3 開発開始
2026年12月  Phase 3 完了
2027年1月   Phase 4 開発開始（年度更新に向けて）
2027年3月   Phase 4 完了、年度更新テスト
2027年4月   新年度運用開始（全機能利用可能）
```

---

## 15. 関連設計書

| ドキュメント | 内容 |
|------------|------|
| [docs/design/integrated-feature-spec-v2.md](design/integrated-feature-spec-v2.md) | 機能仕様統合レポート |
| [docs/design/quiz-management.md](design/quiz-management.md) | 小テスト・問題管理 |
| [docs/design/grade-structure.md](design/grade-structure.md) | グレード構成 |
| [docs/grade-system-design.md](grade-system-design.md) | グレード制度・ゲーミフィケーション |
| [docs/design/morning-test-operation-flow.md](design/morning-test-operation-flow.md) | 朝テスト運用フロー |
| [docs/design/self-study-mode.md](design/self-study-mode.md) | 自学自習モード |
| [docs/design/badge-streak-design.md](design/badge-streak-design.md) | バッジ・ストリーク |
| [docs/design/dashboard-and-admin.md](design/dashboard-and-admin.md) | ダッシュボード・管理機能 |

# サークル交流アプリ

留学生と在校生の交流を促進するマッチングアプリです。言語スキル、スケジュール、性別比を考慮したスマートマッチングで、理想的な国際交流グループを作成します。

## 機能

- **認証システム**: Supabase を使用したセキュアなユーザー認証
- **プロフィール管理**: 言語スキル、空き時間、学生区分の設定
- **イベント管理**: 交流イベントの作成・参加・管理
- **スマートマッチング**: 多様な条件を考慮した最適なグループ生成
- **レスポンシブデザイン**: モバイルからデスクトップまで対応

## 技術スタック

- **フロントエンド**: Next.js 15, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Auth, RLS)
- **デプロイ**: Vercel
- **UI**: Lucide React Icons

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd circle-matching-app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下の情報を取得:
   - Project URL
   - API Keys (anon/public key)
   - Service Role Key

### 4. データベースの設定

1. Supabase のダッシュボードで「SQL Editor」を開く
2. `supabase-schema.sql`ファイルの内容をコピー&ペーストして実行

### 5. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## Vercel デプロイ

### 1. Vercel アカウントの作成

[Vercel](https://vercel.com)でアカウントを作成

### 2. プロジェクトのデプロイ

```bash
npm install -g vercel
vercel
```

または、GitHub リポジトリを Vercel に接続してデプロイ

### 3. 環境変数の設定

Vercel ダッシュボードで以下の環境変数を設定:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 使用方法

### 1. アカウント作成

- ホームページから「アカウント作成」をクリック
- 必要情報を入力（名前、メールアドレス、パスワード、学生区分）
- 確認メールから認証を完了

### 2. プロフィール設定

- ダッシュボードから「プロフィール設定」をクリック
- 基本情報、言語スキル、空き時間を設定

### 3. イベント参加

- 「イベントを見る」から開催予定のイベントを確認
- 興味のあるイベントに参加申し込み

### 4. イベント作成

- 「イベント作成」から新しい交流イベントを企画
- 日時、場所、参加者数などを設定

### 5. グループマッチング

- イベント詳細ページで「グループを生成」をクリック
- AI が最適なグループ組み合わせを提案
- 気に入った組み合わせを保存

## データベーススキーマ

### 主要テーブル

- `profiles`: ユーザープロフィール情報
- `languages`: 対応言語マスター
- `user_languages`: ユーザーの言語スキル
- `availability`: ユーザーの空き時間
- `events`: 交流イベント
- `groups`: マッチングされたグループ
- `group_members`: グループメンバー
- `event_participants`: イベント参加者

## マッチングアルゴリズム

アプリケーションは以下の要素を考慮してグループを生成します:

1. **留学生・在校生比率**: 目標比率に近いグループを優先
2. **性別バランス**: 多様性を確保したグループ構成
3. **言語互換性**: 共通言語や学習言語のマッチング
4. **スケジュール互換性**: 参加者の空き時間の重複度

## ライセンス

MIT License

## サポート

問題や質問がある場合は、GitHub の Issues ページでお知らせください。

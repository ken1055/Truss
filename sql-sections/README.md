# Truss SQLセクション別実行ガイド

エラーが発生する場合は、以下の順序でセクション別に実行してください。

## 実行順序

### 1. 基本テーブル拡張（必須）
```sql
-- ファイル: 01-extend-tables.sql
-- profiles と events テーブルに新しいカラムを追加
```

### 2. 年度管理システム（必須）
```sql
-- ファイル: 02-fiscal-years.sql
-- fiscal_years テーブル作成と2024年度データ挿入
```

### 3. 会費マスタ管理（必須）
```sql
-- ファイル: 03-fee-master.sql
-- fee_master テーブル作成とデフォルト会費設定
```

### 4. その他のテーブル（必須）
```sql
-- ファイル: 04-other-tables.sql
-- event_participants, payment_history, user_roles, no_show_history テーブル作成
```

### 5. RLSポリシー（推奨）
```sql
-- ファイル: 05-rls-policies.sql
-- Row Level Security ポリシーの設定
```

## トラブルシューティング

### ストレージエラーが発生する場合
- Supabase Dashboard > Storage > Settings でストレージを有効化
- または手動でバケット作成：
  - `student-documents` (public: true)
  - `profile-images` (public: true)

### 権限エラーが発生する場合
- Supabase Dashboard > Authentication > Users で管理者ユーザーを確認
- profiles テーブルの bio カラムに `[ADMIN]` を追加

### テーブル作成エラーが発生する場合
- 既存のテーブル構造を確認
- 必要に応じて `DROP TABLE` してから再作成

## 確認方法

実行後、以下で正常性を確認：

```sql
-- テーブル作成確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('fiscal_years', 'fee_master', 'user_roles');

-- 初期データ確認
SELECT * FROM fiscal_years;
SELECT * FROM fee_master;
```

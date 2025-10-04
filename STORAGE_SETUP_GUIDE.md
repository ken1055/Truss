# Supabaseストレージバケット作成ガイド

## 方法1: Supabaseダッシュボード（推奨）

1. **Supabaseダッシュボード**にアクセス
2. 左サイドバーの **Storage** をクリック
3. **Create bucket** ボタンをクリック

### student-documents バケット
- **Name**: `student-documents`
- **Public bucket**: ✅ チェック
- **File size limit**: `50 MB`
- **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp, application/pdf`

### profile-images バケット  
- **Name**: `profile-images`
- **Public bucket**: ✅ チェック
- **File size limit**: `10 MB`
- **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

## 方法2: SQL Editor（修正版）

以下のSQLをSupabase SQL Editorで実行：

```sql
-- ストレージバケットの作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('student-documents', 'student-documents', TRUE, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
  ('profile-images', 'profile-images', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

## 方法3: Supabase CLI（上級者向け）

```bash
# student-documents バケット
supabase storage-create student-documents --public

# profile-images バケット  
supabase storage-create profile-images --public
```

## 確認方法

バケット作成後、以下のSQLで確認：

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets 
WHERE id IN ('student-documents', 'profile-images');
```

## 注意事項

- **方法1（ダッシュボード）**が最も確実で推奨
- バケット作成後はRLSポリシーが自動で設定される場合があります
- エラーが発生する場合は、プロジェクトの権限設定を確認してください

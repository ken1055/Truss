-- ===============================================
-- ストレージバケット作成スクリプト（修正版）
-- ===============================================
-- このスクリプトはSupabase SQL Editorで実行してください

-- ストレージバケットの作成（拡張機能の作成は不要）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('student-documents', 'student-documents', TRUE, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
  ('profile-images', 'profile-images', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ストレージバケットのポリシー設定
-- student-documents バケット用のポリシー
DROP POLICY IF EXISTS "Allow authenticated users to upload student documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload student documents"
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Allow users to view their own student documents" ON storage.objects;
CREATE POLICY "Allow users to view their own student documents"
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Allow admins to view all student documents" ON storage.objects;
CREATE POLICY "Allow admins to view all student documents"
ON storage.objects FOR SELECT TO authenticated 
USING (
  bucket_id = 'student-documents' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

-- profile-images バケット用のポリシー
DROP POLICY IF EXISTS "Allow authenticated users to upload profile images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Allow users to view their own profile images" ON storage.objects;
CREATE POLICY "Allow users to view their own profile images"
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Allow public access to profile images" ON storage.objects;
CREATE POLICY "Allow public access to profile images"
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'profile-images');

-- バケット作成の確認
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id IN ('student-documents', 'profile-images');

-- ===============================================
-- 緊急RLS無効化スクリプト
-- ===============================================
-- user_rolesの無限再帰を解消するため一時的にRLSを無効化

-- user_rolesテーブルのRLSを無効化
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 確認: RLSステータス
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_roles';

-- 現在のuser_rolesポリシーを確認
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles';


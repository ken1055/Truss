-- ===============================================
-- プロフィール取得問題のデバッグ用SQL
-- ===============================================

-- 1. profilesテーブルの存在確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) as profiles_table_exists;

-- 2. profilesテーブルのデータ確認
SELECT COUNT(*) as total_profiles FROM profiles;

-- 3. 現在のRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. RLSが有効かどうか確認
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 5. 全てのプロフィールを表示（管理者として）
SELECT 
  id,
  email,
  name,
  created_at,
  bio
FROM profiles
LIMIT 10;

-- 6. RLSを一時的に無効化してテスト（問題解決後に再度有効化してください）
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 7. 全てのRLSポリシーを削除（クリーンアップ）
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles')
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
  END LOOP;
END $$;

-- 8. 最もシンプルなRLSポリシーを設定（全ユーザーが自分のプロフィールにアクセス可能）
CREATE POLICY "Allow users full access to own profile"
ON profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 9. RLSを有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 10. ポリシーの確認
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';


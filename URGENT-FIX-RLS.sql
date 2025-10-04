-- ===============================================
-- 緊急修正：プロフィール取得のRLS問題を解決
-- ===============================================
-- このSQLを今すぐSupabase SQL Editorで実行してください！

-- ステップ1: 全てのRLSポリシーを削除
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles')
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- ステップ2: 一時的にRLSを無効化（デバッグ用）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ステップ3: データが存在するか確認
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN id = 'ae5d4c0d-68e5-4efe-8ca8-dcb216b92fe2' THEN 1 END) as your_profile_exists
FROM profiles;

-- ステップ4: あなたのプロフィールを確認
SELECT * FROM profiles WHERE id = 'ae5d4c0d-68e5-4efe-8ca8-dcb216b92fe2';

-- ステップ5: シンプルなRLSポリシーを再設定
CREATE POLICY "allow_all_authenticated"
ON profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ステップ6: RLSを再度有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 確認
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';


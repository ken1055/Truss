-- ===============================================
-- profilesテーブルのRLSポリシー修正
-- ===============================================
-- このスクリプトはSupabase SQL Editorで実行してください

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON profiles;

-- シンプルで効率的なRLSポリシーを作成
-- 1. 自分のプロフィールを読み取り
CREATE POLICY "Enable read access for own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. 自分のプロフィールを更新
CREATE POLICY "Enable update for own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. 自分のプロフィールを作成
CREATE POLICY "Enable insert for own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. 管理者は全てのプロフィールを閲覧可能
CREATE POLICY "Enable read access for admins"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

-- RLSが有効であることを確認
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 現在のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- インデックスを確認（パフォーマンス改善）
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_bio ON profiles(bio) WHERE bio LIKE '%[ADMIN]%';

-- 実行結果の確認
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN bio LIKE '%[ADMIN]%' THEN 1 END) as admin_profiles
FROM profiles;


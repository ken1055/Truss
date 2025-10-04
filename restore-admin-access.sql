-- ===============================================
-- 管理者権限復旧スクリプト
-- ===============================================
-- このスクリプトで管理者が全てのprofilesを閲覧できるようにします

-- profilesテーブルに管理者用の読取ポリシーを追加
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
CREATE POLICY "profiles_admin_read_all"
ON profiles FOR SELECT
TO authenticated
USING (
  -- 自分のprofileは常に見れる
  auth.uid() = id 
  OR 
  -- または、bioフィールドに[ADMIN]が含まれていれば全て見れる
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- 管理者が全てのprofilesを更新できるポリシー（承認ステータス変更など）
DROP POLICY IF EXISTS "profiles_admin_update_all" ON profiles;
CREATE POLICY "profiles_admin_update_all"
ON profiles FOR UPDATE
TO authenticated
USING (
  -- 自分のprofileは更新できる
  auth.uid() = id 
  OR 
  -- または管理者なら全て更新できる
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
)
WITH CHECK (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- 既存のシンプルなポリシーを削除（上記の包括的なポリシーに置き換え）
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- INSERTポリシーはそのまま（自分のprofileのみ作成可能）
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 確認: 現在のprofilesテーブルのRLSポリシーを表示
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;


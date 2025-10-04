-- ===============================================
-- RLS無限再帰完全修正スクリプト（最終版）
-- ===============================================
-- このスクリプトを実行してuser_rolesの無限再帰を解決します

-- ステップ1: user_rolesテーブルのRLSを無効化
-- 理由: user_rolesは他のテーブルの管理者判定に使われるため、
-- RLSをかけると自己参照による無限再帰が発生する
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- ステップ2: profilesテーブルのポリシーを修正
-- user_roles参照のみで管理者判定
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;

CREATE POLICY "profiles_read_policy"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
)
WITH CHECK (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ステップ3: RLS有効化確認
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ステップ4: 確認クエリ
-- user_rolesのRLSステータス（falseであるべき）
SELECT 
  'user_roles' as table_name,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_roles';

-- profilesのRLSステータス（trueであるべき）
SELECT 
  'profiles' as table_name,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- profilesの現在のポリシー
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%user_roles%' THEN '✓ user_roles参照'
    WHEN qual LIKE '%profiles%' THEN '⚠️ profiles参照（再帰の可能性）'
    ELSE 'その他'
  END as reference_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;


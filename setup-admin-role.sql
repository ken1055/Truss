-- ===============================================
-- 管理者ロールの設定
-- ===============================================
-- bioフィールドに[ADMIN]を持つユーザーにadminロールを付与

-- 注意: このスクリプトを実行する前に、user_rolesテーブルのRLSを一時的に無効化
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 1. 既存の管理者（bioに[ADMIN]がある）にuser_rolesでadminロールを付与
INSERT INTO user_roles (user_id, role_name, is_active)
SELECT 
  id as user_id,
  'admin' as role_name,
  true as is_active
FROM profiles
WHERE bio LIKE '%[ADMIN]%'
ON CONFLICT (user_id, role_name) 
DO UPDATE SET is_active = true;

-- RLSを再度有効化
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 2. 確認：現在の管理者ロール一覧
SELECT 
  ur.id,
  ur.user_id,
  p.name,
  p.email,
  ur.role_name,
  ur.is_active,
  ur.created_at
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.role_name = 'admin'
ORDER BY ur.created_at DESC;

-- 3. user_rolesテーブルにRLSが無効になっている場合は有効化
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 4. 確認：RLSステータス
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_roles', 'events', 'fiscal_years', 'fee_master')
ORDER BY tablename;


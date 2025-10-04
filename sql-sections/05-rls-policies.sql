-- ===============================================
-- セクション8: ストレージとRLS設定（オプション）
-- ===============================================

-- ストレージバケット作成（Supabaseでストレージが有効な場合のみ）
-- エラーが発生する場合はスキップしてください

-- 手動でSupabase Dashboardから作成することも可能：
-- 1. Storage > Buckets > Create bucket
-- 2. Name: student-documents, Public: true
-- 3. Name: profile-images, Public: true

-- fiscal_years テーブルのRLS
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read fiscal years" ON fiscal_years;
CREATE POLICY "Allow authenticated users to read fiscal years"
ON fiscal_years FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admins to manage fiscal years" ON fiscal_years;
CREATE POLICY "Allow admins to manage fiscal years"
ON fiscal_years FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

-- fee_master テーブルのRLS
ALTER TABLE fee_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read fee master" ON fee_master;
CREATE POLICY "Allow authenticated users to read fee master"
ON fee_master FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admins to manage fee master" ON fee_master;
CREATE POLICY "Allow admins to manage fee master"
ON fee_master FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

-- user_roles テーブルのRLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own roles" ON user_roles;
CREATE POLICY "Allow users to read their own roles"
ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow admins to read all roles" ON user_roles;
CREATE POLICY "Allow admins to read all roles"
ON user_roles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

DROP POLICY IF EXISTS "Allow admins to manage roles" ON user_roles;
CREATE POLICY "Allow admins to manage roles"
ON user_roles FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

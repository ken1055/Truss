-- ===============================================
-- 管理者権限復旧（無限再帰回避版）
-- ===============================================
-- user_rolesテーブルを使って管理者判定を行います
-- profilesテーブルの参照を完全に排除します

-- ========================================
-- 1. profilesテーブル（再帰なし）
-- ========================================
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- 読取：自分のprofile OR user_rolesでadmin判定
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

-- 更新：自分のprofile OR user_rolesでadmin判定
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

-- 挿入：自分のprofileのみ
CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. eventsテーブル
-- ========================================
DROP POLICY IF EXISTS "events_read_all" ON events;
DROP POLICY IF EXISTS "events_read" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;

CREATE POLICY "events_read_all_policy"
ON events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "events_insert_policy"
ON events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "events_update_policy"
ON events FOR UPDATE
TO authenticated
USING (
  auth.uid() = organizer_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "events_delete_policy"
ON events FOR DELETE
TO authenticated
USING (
  auth.uid() = organizer_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

-- ========================================
-- 3. anonymous_suggestionsテーブル
-- ========================================
DROP POLICY IF EXISTS "suggestions_insert" ON anonymous_suggestions;
DROP POLICY IF EXISTS "suggestions_read" ON anonymous_suggestions;
DROP POLICY IF EXISTS "suggestions_update" ON anonymous_suggestions;

CREATE POLICY "suggestions_insert_policy"
ON anonymous_suggestions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "suggestions_read_policy"
ON anonymous_suggestions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "suggestions_update_policy"
ON anonymous_suggestions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

-- ========================================
-- 4. fiscal_yearsテーブル
-- ========================================
DROP POLICY IF EXISTS "fiscal_years_read" ON fiscal_years;
DROP POLICY IF EXISTS "fiscal_years_manage" ON fiscal_years;
DROP POLICY IF EXISTS "fiscal_years_read_all" ON fiscal_years;

CREATE POLICY "fiscal_years_read_policy"
ON fiscal_years FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "fiscal_years_manage_policy"
ON fiscal_years FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

-- ========================================
-- 5. fee_masterテーブル
-- ========================================
DROP POLICY IF EXISTS "fee_master_read" ON fee_master;
DROP POLICY IF EXISTS "fee_master_manage" ON fee_master;
DROP POLICY IF EXISTS "fee_master_read_all" ON fee_master;

CREATE POLICY "fee_master_read_policy"
ON fee_master FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "fee_master_manage_policy"
ON fee_master FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

-- ========================================
-- 6. user_rolesテーブル
-- ========================================
DROP POLICY IF EXISTS "user_roles_read_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_read_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_manage_admin" ON user_roles;

CREATE POLICY "user_roles_read_own_policy"
ON user_roles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "user_roles_manage_policy"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

-- ========================================
-- 7. event_participantsテーブル
-- ========================================
DROP POLICY IF EXISTS "event_participants_read_own" ON event_participants;
DROP POLICY IF EXISTS "event_participants_read_admin" ON event_participants;
DROP POLICY IF EXISTS "event_participants_insert" ON event_participants;
DROP POLICY IF EXISTS "event_participants_update_own" ON event_participants;
DROP POLICY IF EXISTS "event_participants_update_admin" ON event_participants;

CREATE POLICY "event_participants_read_policy"
ON event_participants FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "event_participants_insert_policy"
ON event_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_participants_update_policy"
ON event_participants FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

-- ========================================
-- 8. payment_historyテーブル
-- ========================================
DROP POLICY IF EXISTS "payment_history_read_own" ON payment_history;
DROP POLICY IF EXISTS "payment_history_read_admin" ON payment_history;
DROP POLICY IF EXISTS "payment_history_manage_admin" ON payment_history;

CREATE POLICY "payment_history_read_policy"
ON payment_history FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "payment_history_manage_policy"
ON payment_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

-- ========================================
-- 9. no_show_historyテーブル
-- ========================================
DROP POLICY IF EXISTS "no_show_history_read_own" ON no_show_history;
DROP POLICY IF EXISTS "no_show_history_read_admin" ON no_show_history;
DROP POLICY IF EXISTS "no_show_history_manage_admin" ON no_show_history;

CREATE POLICY "no_show_history_read_policy"
ON no_show_history FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "no_show_history_manage_policy"
ON no_show_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
    AND ur.is_active = true
  )
);

-- ========================================
-- 確認クエリ
-- ========================================
-- profilesテーブルを参照しているポリシーがないことを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%profiles%' OR with_check LIKE '%profiles%' THEN '⚠️ profiles参照あり - 再帰の可能性'
    WHEN qual LIKE '%user_roles%' OR with_check LIKE '%user_roles%' THEN '✓ user_roles使用 - OK'
    ELSE '✓ 参照なし'
  END as recursion_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


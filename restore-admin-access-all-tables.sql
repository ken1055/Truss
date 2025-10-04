-- ===============================================
-- 全テーブルに管理者権限を復旧
-- ===============================================
-- 管理者が全データを閲覧・管理できるようにします

-- ========================================
-- 1. profilesテーブル
-- ========================================
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- 読取ポリシー（自分 or 管理者）
CREATE POLICY "profiles_read"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- 更新ポリシー（自分 or 管理者）
CREATE POLICY "profiles_update"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR 
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

-- 挿入ポリシー（自分のみ）
CREATE POLICY "profiles_insert"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. eventsテーブル
-- ========================================
DROP POLICY IF EXISTS "events_read_all" ON events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON events;
DROP POLICY IF EXISTS "events_update_owner_or_admin" ON events;
DROP POLICY IF EXISTS "events_delete_owner_or_admin" ON events;

-- 全員読取可能
CREATE POLICY "events_read_all"
ON events FOR SELECT
TO authenticated
USING (true);

-- 認証済みユーザーは作成可能
CREATE POLICY "events_insert"
ON events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = organizer_id);

-- 作成者または管理者は更新可能
CREATE POLICY "events_update"
ON events FOR UPDATE
TO authenticated
USING (
  auth.uid() = organizer_id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- 作成者または管理者は削除可能
CREATE POLICY "events_delete"
ON events FOR DELETE
TO authenticated
USING (
  auth.uid() = organizer_id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- ========================================
-- 3. anonymous_suggestionsテーブル
-- ========================================
DROP POLICY IF EXISTS "suggestions_insert_authenticated" ON anonymous_suggestions;
DROP POLICY IF EXISTS "suggestions_read_admin" ON anonymous_suggestions;
DROP POLICY IF EXISTS "suggestions_update_admin" ON anonymous_suggestions;

-- 認証済みユーザーは提案を投稿可能
CREATE POLICY "suggestions_insert"
ON anonymous_suggestions FOR INSERT
TO authenticated
WITH CHECK (true);

-- 管理者のみ閲覧可能
CREATE POLICY "suggestions_read"
ON anonymous_suggestions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- 管理者のみ更新可能（ステータス変更）
CREATE POLICY "suggestions_update"
ON anonymous_suggestions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- ========================================
-- 4. fiscal_yearsテーブル
-- ========================================
DROP POLICY IF EXISTS "fiscal_years_read_all" ON fiscal_years;
DROP POLICY IF EXISTS "fiscal_years_manage_admin" ON fiscal_years;

-- 全員読取可能
CREATE POLICY "fiscal_years_read"
ON fiscal_years FOR SELECT
TO authenticated
USING (true);

-- 管理者のみ管理可能
CREATE POLICY "fiscal_years_manage"
ON fiscal_years FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- ========================================
-- 5. fee_masterテーブル
-- ========================================
DROP POLICY IF EXISTS "fee_master_read_all" ON fee_master;
DROP POLICY IF EXISTS "fee_master_manage_admin" ON fee_master;

-- 全員読取可能
CREATE POLICY "fee_master_read"
ON fee_master FOR SELECT
TO authenticated
USING (true);

-- 管理者のみ管理可能
CREATE POLICY "fee_master_manage"
ON fee_master FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- ========================================
-- 6. user_rolesテーブル
-- ========================================
DROP POLICY IF EXISTS "user_roles_read_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_manage_admin" ON user_roles;

-- 自分の役割は閲覧可能
CREATE POLICY "user_roles_read_own"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 管理者は全員の役割を閲覧・管理可能
CREATE POLICY "user_roles_read_admin"
ON user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

CREATE POLICY "user_roles_manage_admin"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- ========================================
-- 7. event_participantsテーブル
-- ========================================
DROP POLICY IF EXISTS "event_participants_read_own" ON event_participants;
DROP POLICY IF EXISTS "event_participants_insert_own" ON event_participants;
DROP POLICY IF EXISTS "event_participants_update_own" ON event_participants;

-- 自分の参加記録は閲覧可能
CREATE POLICY "event_participants_read_own"
ON event_participants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 管理者は全員の参加記録を閲覧可能
CREATE POLICY "event_participants_read_admin"
ON event_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- 自分の参加記録を作成・更新可能
CREATE POLICY "event_participants_insert"
ON event_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_participants_update_own"
ON event_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 管理者は全員の参加記録を更新可能
CREATE POLICY "event_participants_update_admin"
ON event_participants FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- ========================================
-- 8. payment_historyテーブル
-- ========================================
DROP POLICY IF EXISTS "payment_history_read_own" ON payment_history;
DROP POLICY IF EXISTS "payment_history_insert_own" ON payment_history;

-- 自分の支払い履歴は閲覧可能
CREATE POLICY "payment_history_read_own"
ON payment_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 管理者は全員の支払い履歴を閲覧可能
CREATE POLICY "payment_history_read_admin"
ON payment_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- 管理者のみ支払い履歴を作成・更新可能
CREATE POLICY "payment_history_manage_admin"
ON payment_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- ========================================
-- 9. no_show_historyテーブル
-- ========================================
DROP POLICY IF EXISTS "no_show_history_read_own" ON no_show_history;

-- 自分の不参加履歴は閲覧可能
CREATE POLICY "no_show_history_read_own"
ON no_show_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 管理者は全員の不参加履歴を閲覧・管理可能
CREATE POLICY "no_show_history_read_admin"
ON no_show_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

CREATE POLICY "no_show_history_manage_admin"
ON no_show_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.bio LIKE '%[ADMIN]%'
  )
);

-- ========================================
-- 確認クエリ
-- ========================================
-- RLS再帰チェック（profilesを参照しているポリシーを確認）
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%profiles%' THEN '⚠️ profiles参照あり'
    ELSE '✓ OK'
  END as recursion_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


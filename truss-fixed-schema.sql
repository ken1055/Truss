-- ===============================================
-- Truss会員・イベント管理システム 統合SQLスクリプト（修正版）
-- ===============================================
-- 
-- このスクリプトは以下の機能を実装します：
-- 1. 基本的な会員管理機能
-- 2. 年度管理システム（4/1〜翌年3/31）
-- 3. 会費マスタ管理
-- 4. イベント管理機能強化
-- 5. 役割・権限管理システム
-- 6. 統計・分析機能
-- 7. 支払い履歴管理
-- 8. 無断欠席履歴管理
--
-- 実行方法：
-- 1. Supabase Dashboard > SQL Editor でこのスクリプトを実行
-- 2. エラーが発生した場合は、セクションごとに分けて実行してください
--
-- ===============================================

-- ===============================================
-- セクション1: 既存テーブルの拡張
-- ===============================================

-- profilesテーブルに新しいカラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS student_card_url TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'regular_student' CHECK (member_type IN ('japanese_student', 'international_student', 'exchange_student', 'regular_student')),
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'resubmit')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending_cash', 'paid_stripe', 'paid_cash', 'refunded'));

-- eventsテーブルに新しいカラムを追加
ALTER TABLE events
ADD COLUMN IF NOT EXISTS participation_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS application_deadline DATE,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'social' CHECK (category IN ('social', 'academic', 'cultural', 'sports', 'other')),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;

-- ===============================================
-- セクション2: 年度管理システム
-- ===============================================

-- 年度管理テーブル
CREATE TABLE IF NOT EXISTS fiscal_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 現在の年度を初期データとして挿入
INSERT INTO fiscal_years (year, start_date, end_date, is_active)
VALUES (2024, '2024-04-01', '2025-03-31', TRUE)
ON CONFLICT (year) DO NOTHING;

-- ===============================================
-- セクション3: 会費マスタ管理
-- ===============================================

-- 会費マスタテーブル
CREATE TABLE IF NOT EXISTS fee_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL CHECK (member_type IN ('japanese_student', 'international_student', 'exchange_student', 'regular_student')),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('admission', 'annual')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(fiscal_year_id, member_type, fee_type)
);

-- ===============================================
-- セクション4: イベント参加者管理
-- ===============================================

-- イベント参加者テーブル
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'approved', 'rejected', 'attended', 'no_show', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- ===============================================
-- セクション5: 支払い履歴管理
-- ===============================================

-- 支払い履歴テーブル
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fiscal_year_id UUID REFERENCES fiscal_years(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('membership_fee', 'event_fee')),
  fee_type TEXT CHECK (fee_type IN ('admission', 'annual', 'participation')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('cash', 'stripe', 'bank_transfer')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===============================================
-- セクション6: 役割・権限管理システム
-- ===============================================

-- ユーザー役割・権限テーブル
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL CHECK (role_name IN ('admin', 'treasurer', 'event_manager', 'moderator', 'member')),
  permissions TEXT[] DEFAULT '{}',
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, role_name)
);

-- ===============================================
-- セクション7: 無断欠席履歴管理
-- ===============================================

-- 無断欠席履歴テーブル
CREATE TABLE IF NOT EXISTS no_show_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now') NOT NULL
);

-- ===============================================
-- セクション8: ストレージバケット設定
-- ===============================================

-- 学生証・プロフィール画像用のストレージバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- セクション9: 初期データの挿入（テーブル作成後）
-- ===============================================

-- デフォルトの会費設定を挿入（テーブル作成後に実行）
DO $$
DECLARE
  current_fiscal_year_id UUID;
BEGIN
  -- 現在のアクティブな年度のIDを取得
  SELECT id INTO current_fiscal_year_id FROM fiscal_years WHERE is_active = TRUE LIMIT 1;
  
  IF current_fiscal_year_id IS NOT NULL THEN
    -- 各会員区分の入会費・年会費を設定
    INSERT INTO fee_master (fiscal_year_id, member_type, fee_type, amount) VALUES
    (current_fiscal_year_id, 'japanese_student', 'admission', 1000),
    (current_fiscal_year_id, 'japanese_student', 'annual', 3000),
    (current_fiscal_year_id, 'international_student', 'admission', 500),
    (current_fiscal_year_id, 'international_student', 'annual', 2000),
    (current_fiscal_year_id, 'exchange_student', 'admission', 0),
    (current_fiscal_year_id, 'exchange_student', 'annual', 1000),
    (current_fiscal_year_id, 'regular_student', 'admission', 1500),
    (current_fiscal_year_id, 'regular_student', 'annual', 4000)
    ON CONFLICT (fiscal_year_id, member_type, fee_type) DO NOTHING;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting fee data: %', SQLERRM;
END $$;

-- ===============================================
-- セクション10: Row Level Security (RLS) ポリシー
-- ===============================================

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

-- event_participants テーブルのRLS
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own event participations" ON event_participants;
CREATE POLICY "Allow users to read their own event participations"
ON event_participants FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow users to manage their own event participations" ON event_participants;
CREATE POLICY "Allow users to manage their own event participations"
ON event_participants FOR ALL TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow event creators to manage participants" ON event_participants;
CREATE POLICY "Allow event creators to manage participants"
ON event_participants FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_participants.event_id 
    AND events.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Allow admins to manage all event participants" ON event_participants;
CREATE POLICY "Allow admins to manage all event participants"
ON event_participants FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

-- payment_history テーブルのRLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own payment history" ON payment_history;
CREATE POLICY "Allow users to read their own payment history"
ON payment_history FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow admins and treasurers to read all payment history" ON payment_history;
CREATE POLICY "Allow admins and treasurers to read all payment history"
ON payment_history FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.bio LIKE '%[ADMIN]%' OR 
         EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_name = 'treasurer' AND user_roles.is_active = true))
  )
);

DROP POLICY IF EXISTS "Allow admins and treasurers to manage payment history" ON payment_history;
CREATE POLICY "Allow admins and treasurers to manage payment history"
ON payment_history FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.bio LIKE '%[ADMIN]%' OR 
         EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_name = 'treasurer' AND user_roles.is_active = true))
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

-- no_show_history テーブルのRLS
ALTER TABLE no_show_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own no-show history" ON no_show_history;
CREATE POLICY "Allow users to read their own no-show history"
ON no_show_history FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow admins and event managers to read all no-show history" ON no_show_history;
CREATE POLICY "Allow admins and event managers to read all no-show history"
ON no_show_history FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.bio LIKE '%[ADMIN]%' OR 
         EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_name IN ('event_manager', 'moderator') AND user_roles.is_active = true))
  )
);

DROP POLICY IF EXISTS "Allow admins and event managers to manage no-show history" ON no_show_history;
CREATE POLICY "Allow admins and event managers to manage no-show history"
ON no_show_history FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.bio LIKE '%[ADMIN]%' OR 
         EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_name IN ('event_manager', 'moderator') AND user_roles.is_active = true))
  )
);

-- ===============================================
-- セクション11: ストレージポリシー
-- ===============================================

-- 学生証ドキュメント用のポリシー
DROP POLICY IF EXISTS "Allow authenticated users to upload student documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload student documents"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'student-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Allow authenticated users to view their own student documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to view their own student documents"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'student-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- プロフィール画像用のポリシー
DROP POLICY IF EXISTS "Allow authenticated users to upload profile images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Allow public access to profile images" ON storage.objects;
CREATE POLICY "Allow public access to profile images"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-images');

-- ===============================================
-- セクション12: パフォーマンス最適化用インデックス
-- ===============================================

-- profilesテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_member_type ON profiles(member_type);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status);

-- fiscal_yearsテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_fiscal_years_year ON fiscal_years(year);
CREATE INDEX IF NOT EXISTS idx_fiscal_years_is_active ON fiscal_years(is_active);

-- fee_masterテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_fee_master_fiscal_year_id ON fee_master(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_master_member_type ON fee_master(member_type);
CREATE INDEX IF NOT EXISTS idx_fee_master_fee_type ON fee_master(fee_type);

-- eventsテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_application_deadline ON events(application_deadline);

-- event_participantsテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);

-- payment_historyテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_fiscal_year_id ON payment_history(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_type ON payment_history(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_processed_at ON payment_history(processed_at);

-- user_rolesテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);

-- no_show_historyテーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_no_show_history_user_id ON no_show_history(user_id);
CREATE INDEX IF NOT EXISTS idx_no_show_history_event_id ON no_show_history(event_id);
CREATE INDEX IF NOT EXISTS idx_no_show_history_fiscal_year_id ON no_show_history(fiscal_year_id);

-- ===============================================
-- セクション13: 更新トリガー関数
-- ===============================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにupdated_atトリガーを追加
DROP TRIGGER IF EXISTS update_fiscal_years_updated_at ON fiscal_years;
CREATE TRIGGER update_fiscal_years_updated_at 
    BEFORE UPDATE ON fiscal_years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fee_master_updated_at ON fee_master;
CREATE TRIGGER update_fee_master_updated_at 
    BEFORE UPDATE ON fee_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_participants_updated_at ON event_participants;
CREATE TRIGGER update_event_participants_updated_at 
    BEFORE UPDATE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- セクション14: 統計・分析用ビュー（オプション）
-- ===============================================

-- 会員統計ビュー
CREATE OR REPLACE VIEW member_statistics AS
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_members,
    COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_members,
    COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_members,
    COUNT(CASE WHEN member_type = 'japanese_student' THEN 1 END) as japanese_students,
    COUNT(CASE WHEN member_type = 'international_student' THEN 1 END) as international_students,
    COUNT(CASE WHEN member_type = 'exchange_student' THEN 1 END) as exchange_students,
    COUNT(CASE WHEN member_type = 'regular_student' THEN 1 END) as regular_students,
    COUNT(CASE WHEN payment_status = 'paid_stripe' OR payment_status = 'paid_cash' THEN 1 END) as paid_members,
    COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_members
FROM profiles;

-- イベント統計ビュー
CREATE OR REPLACE VIEW event_statistics AS
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN category = 'social' THEN 1 END) as social_events,
    COUNT(CASE WHEN category = 'academic' THEN 1 END) as academic_events,
    COUNT(CASE WHEN category = 'cultural' THEN 1 END) as cultural_events,
    COUNT(CASE WHEN category = 'sports' THEN 1 END) as sports_events,
    COUNT(CASE WHEN category = 'other' THEN 1 END) as other_events,
    AVG(participation_fee) as avg_participation_fee,
    SUM(participation_fee) as total_participation_fees
FROM events;

-- 支払い統計ビュー
CREATE OR REPLACE VIEW payment_statistics AS
SELECT 
    COUNT(*) as total_payments,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_payment_amount,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    COUNT(CASE WHEN method = 'cash' THEN 1 END) as cash_payments,
    COUNT(CASE WHEN method = 'stripe' THEN 1 END) as stripe_payments
FROM payment_history;

-- ===============================================
-- 完了メッセージ
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Truss会員・イベント管理システムのセットアップが完了しました！';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '実装された機能:';
    RAISE NOTICE '✓ 会員管理（承認・支払い状況）';
    RAISE NOTICE '✓ 年度管理システム（4/1〜翌年3/31）';
    RAISE NOTICE '✓ 会費マスタ管理';
    RAISE NOTICE '✓ イベント管理機能強化';
    RAISE NOTICE '✓ 役割・権限管理システム';
    RAISE NOTICE '✓ 支払い履歴管理';
    RAISE NOTICE '✓ 無断欠席履歴管理';
    RAISE NOTICE '✓ ストレージ設定（学生証・プロフィール画像）';
    RAISE NOTICE '✓ Row Level Security (RLS) ポリシー';
    RAISE NOTICE '✓ パフォーマンス最適化インデックス';
    RAISE NOTICE '✓ 統計・分析用ビュー';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. 管理者権限の設定: /admin/promote で truss_admin_2024 を入力';
    RAISE NOTICE '2. 年度・会費設定の確認: /admin/fiscal-years, /admin/fees';
    RAISE NOTICE '3. 会員承認: /admin/members';
    RAISE NOTICE '4. 統計確認: /admin/analytics';
    RAISE NOTICE '===============================================';
END $$;

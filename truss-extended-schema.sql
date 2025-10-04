-- Truss会員管理システム用のデータベーススキーマ拡張

-- 1. profilesテーブルに新しいカラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS student_id TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'resubmit')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending_cash', 'paid_stripe', 'paid_cash', 'refunded')),
ADD COLUMN IF NOT EXISTS student_card_url TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS fiscal_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
ADD COLUMN IF NOT EXISTS member_type TEXT CHECK (member_type IN ('regular_student', 'exchange_student', 'japanese_student')),
ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. 年度管理テーブル
CREATE TABLE IF NOT EXISTS fiscal_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 現在の年度を挿入
INSERT INTO fiscal_years (year, start_date, end_date, is_active) 
VALUES (
  2024, 
  '2024-04-01', 
  '2025-03-31', 
  true
) ON CONFLICT (year) DO NOTHING;

-- 3. 会費マスタテーブル
CREATE TABLE IF NOT EXISTS fee_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_year INTEGER NOT NULL,
  membership_fee INTEGER NOT NULL DEFAULT 2000,
  entrance_fee INTEGER NOT NULL DEFAULT 500,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fiscal_year)
);

-- デフォルトの会費設定
INSERT INTO fee_master (fiscal_year, membership_fee, entrance_fee) 
VALUES (2024, 2000, 500) ON CONFLICT (fiscal_year) DO NOTHING;

-- 4. イベントテーブルの拡張
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS capacity INTEGER,
ADD COLUMN IF NOT EXISTS participation_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'cash', 'both')),
ADD COLUMN IF NOT EXISTS custom_questions JSONB,
ADD COLUMN IF NOT EXISTS event_status TEXT DEFAULT 'draft' CHECK (event_status IN ('draft', 'published', 'cancelled', 'completed'));

-- 5. イベント参加テーブル
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'interested', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending_cash', 'paid_stripe', 'paid_cash', 'refunded')),
  payment_amount INTEGER DEFAULT 0,
  custom_answers JSONB,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  no_show BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 6. 支払い履歴テーブル
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('membership_fee', 'entrance_fee', 'event_fee')),
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  fiscal_year INTEGER,
  processed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 役割・権限テーブル
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'accountant', 'event_organizer', 'member')),
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);

-- 8. 無断欠席履歴テーブル
CREATE TABLE IF NOT EXISTS no_show_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- 9. RLSポリシーの設定

-- event_participantsテーブルのRLS
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own event participations" ON event_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event participations" ON event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event participations" ON event_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all event participations" ON event_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.bio LIKE '%[ADMIN]%'
    )
  );

-- payment_historyテーブルのRLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment history" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and accountants can manage payment history" ON payment_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.bio LIKE '%[ADMIN]%' OR profiles.bio LIKE '%[ACCOUNTANT]%')
    )
  );

-- user_rolesテーブルのRLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.bio LIKE '%[ADMIN]%'
    )
  );

-- 10. 更新トリガーの追加
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにupdated_atトリガーを追加
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fiscal_years_updated_at') THEN
        CREATE TRIGGER update_fiscal_years_updated_at 
        BEFORE UPDATE ON fiscal_years
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fee_master_updated_at') THEN
        CREATE TRIGGER update_fee_master_updated_at 
        BEFORE UPDATE ON fee_master
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_event_participants_updated_at') THEN
        CREATE TRIGGER update_event_participants_updated_at 
        BEFORE UPDATE ON event_participants
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_history_updated_at') THEN
        CREATE TRIGGER update_payment_history_updated_at 
        BEFORE UPDATE ON payment_history
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 11. インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_fiscal_year ON profiles(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_fiscal_year ON payment_history(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

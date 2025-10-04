-- Truss Extended Database Schema
-- 既存のSupabaseスキーマに追加する拡張テーブル

-- Add new columns to the profiles table
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

-- Add new columns to the events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS participation_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS application_deadline DATE,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'social' CHECK (category IN ('social', 'academic', 'cultural', 'sports', 'other')),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;

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

-- 無断欠席履歴テーブル
CREATE TABLE IF NOT EXISTS no_show_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create storage buckets for student documents and profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create policies for student-documents bucket
CREATE POLICY "Allow authenticated users to upload student documents"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to view their own student documents"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for profile-images bucket
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public access to profile images"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-images');

-- RLS Policies

-- fiscal_years policies
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read fiscal years"
ON fiscal_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage fiscal years"
ON fiscal_years FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

-- fee_master policies
ALTER TABLE fee_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read fee master"
ON fee_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage fee master"
ON fee_master FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

-- event_participants policies
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own event participations"
ON event_participants FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow users to manage their own event participations"
ON event_participants FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow event creators to manage participants"
ON event_participants FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_participants.event_id 
    AND events.created_by = auth.uid()
  )
);

-- payment_history policies
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own payment history"
ON payment_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow admins and treasurers to read all payment history"
ON payment_history FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.bio LIKE '%[ADMIN]%' OR 
         EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_name = 'treasurer' AND user_roles.is_active = true))
  )
);
CREATE POLICY "Allow admins and treasurers to manage payment history"
ON payment_history FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.bio LIKE '%[ADMIN]%' OR 
         EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_name = 'treasurer' AND user_roles.is_active = true))
  )
);

-- user_roles policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own roles"
ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow admins to read all roles"
ON user_roles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);
CREATE POLICY "Allow admins to manage roles"
ON user_roles FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.bio LIKE '%[ADMIN]%'
  )
);

-- no_show_history policies
ALTER TABLE no_show_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own no-show history"
ON no_show_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow admins and event managers to read all no-show history"
ON no_show_history FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.bio LIKE '%[ADMIN]%' OR 
         EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_name IN ('event_manager', 'moderator') AND user_roles.is_active = true))
  )
);
CREATE POLICY "Allow admins and event managers to manage no-show history"
ON no_show_history FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.bio LIKE '%[ADMIN]%' OR 
         EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_name IN ('event_manager', 'moderator') AND user_roles.is_active = true))
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_member_type ON profiles(member_type);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_fiscal_years_year ON fiscal_years(year);
CREATE INDEX IF NOT EXISTS idx_fiscal_years_is_active ON fiscal_years(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_master_fiscal_year_id ON fee_master(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_master_member_type ON fee_master(member_type);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_fiscal_year_id ON payment_history(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_no_show_history_user_id ON no_show_history(user_id);
CREATE INDEX IF NOT EXISTS idx_no_show_history_fiscal_year_id ON no_show_history(fiscal_year_id);

-- Circle Matching App - プロフィールテーブル作成スクリプト

-- 1. プロフィールテーブルを作成
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  student_type TEXT NOT NULL CHECK (student_type IN ('international', 'domestic')),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS（Row Level Security）を有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLSポリシーを作成
-- 全ユーザーがプロフィールを閲覧可能（マッチング機能のため）
CREATE POLICY "Users can view all profiles" ON profiles 
  FOR SELECT USING (true);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ作成可能
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. プロフィール更新時のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. プロフィール更新トリガー
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 言語テーブル（基本的な言語データ）
CREATE TABLE IF NOT EXISTS languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL
);

-- 7. 基本的な言語データを挿入
INSERT INTO languages (name, code) VALUES 
  ('日本語', 'ja'),
  ('English', 'en'),
  ('한국어', 'ko'),
  ('中文', 'zh'),
  ('Español', 'es'),
  ('Français', 'fr')
ON CONFLICT (code) DO NOTHING;

-- 8. イベントテーブル
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  max_participants INTEGER DEFAULT 20,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. イベントのRLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. 匿名提案・フィードバックテーブル
CREATE TABLE IF NOT EXISTS anonymous_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('event_proposal', 'feedback')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 匿名提案のRLS
ALTER TABLE anonymous_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert suggestions" ON anonymous_suggestions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view suggestions" ON anonymous_suggestions
  FOR SELECT USING (true);

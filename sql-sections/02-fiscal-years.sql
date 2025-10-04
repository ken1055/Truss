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

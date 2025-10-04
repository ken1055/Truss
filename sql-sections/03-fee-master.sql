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

-- デフォルトの会費設定を挿入
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

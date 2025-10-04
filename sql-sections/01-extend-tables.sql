-- ===============================================
-- Truss会員・イベント管理システム - セクション別実行用
-- ===============================================
-- 
-- エラーが発生する場合は、以下のセクションを順番に実行してください
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

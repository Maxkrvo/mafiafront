-- Migration Script: Basic Level Ranks to Enhanced Level Ranks System
-- This script safely migrates from the simple level_ranks table to the enhanced version
-- Run this AFTER deploying the enhanced_level_ranks_table.sql

-- Step 1: Create backup of existing level_ranks data (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'level_ranks') THEN
        CREATE TABLE IF NOT EXISTS level_ranks_backup AS
        SELECT * FROM public.level_ranks;

        RAISE NOTICE 'Created backup table: level_ranks_backup';
    END IF;
END $$;

-- Step 2: Drop old table and constraints if they exist
DROP TABLE IF EXISTS public.level_ranks CASCADE;

-- Step 3: Create the enhanced table structure
-- (This is a subset of the full enhanced_level_ranks_table.sql for migration)
CREATE TABLE public.level_ranks (
  id SERIAL PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE CHECK (level > 0),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  xp_required INTEGER NOT NULL CHECK (xp_required >= 0),
  money_reward INTEGER NOT NULL DEFAULT 0 CHECK (money_reward >= 0),

  -- Enhanced metadata
  category VARCHAR(20) NOT NULL DEFAULT 'street' CHECK (category IN ('street', 'family', 'elite', 'legendary')),
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 10),
  icon_name VARCHAR(50),
  color_hex VARCHAR(7) CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),

  -- Requirements beyond just level
  min_reputation INTEGER DEFAULT 0,
  required_stat_points INTEGER DEFAULT 0,

  -- Display and sorting
  display_order INTEGER GENERATED ALWAYS AS (level) STORED,
  is_milestone BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create performance indexes
CREATE INDEX idx_level_ranks_level ON public.level_ranks(level);
CREATE INDEX idx_level_ranks_category ON public.level_ranks(category);
CREATE INDEX idx_level_ranks_tier ON public.level_ranks(tier);
CREATE INDEX idx_level_ranks_xp_required ON public.level_ranks(xp_required);
CREATE INDEX idx_level_ranks_display_order ON public.level_ranks(display_order);

-- Step 5: Insert enhanced data with accurate XP values calculated from levels.ts
-- Using a function to ensure XP calculations match the frontend exactly
CREATE OR REPLACE FUNCTION calculate_xp_for_level(target_level INTEGER) RETURNS INTEGER AS $$
BEGIN
  -- Match the hybrid scaling from levels.ts
  IF target_level <= 1 THEN
    RETURN 0;
  ELSIF target_level <= 20 THEN
    -- Early levels: 100 XP per level
    RETURN (target_level - 1) * 100;
  ELSE
    -- Later levels: Base 2000 XP + exponential scaling
    RETURN 2000 + POWER(target_level - 20, 2) * 200;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Insert all level ranks with calculated XP values
INSERT INTO public.level_ranks (level, title, xp_required, money_reward, category, tier, is_milestone, min_reputation, icon_name, color_hex) VALUES
  -- Street Tier (1-10) - Tutorial/Early Game
  (1, 'Street Thug', calculate_xp_for_level(1), 0, 'street', 1, true, 0, '👊', '#8B4513'),
  (2, 'Petty Criminal', calculate_xp_for_level(2), 1000, 'street', 1, true, 0, '🔫', '#A0522D'),
  (4, 'Corner Hustler', calculate_xp_for_level(4), 2000, 'street', 2, false, 50, '💊', '#CD853F'),
  (6, 'Small Time Crook', calculate_xp_for_level(6), 3000, 'street', 2, false, 100, '🎲', '#D2B48C'),
  (8, 'Seasoned Criminal', calculate_xp_for_level(8), 4000, 'street', 3, false, 200, '🗡️', '#DEB887'),
  (10, 'Gang Associate', calculate_xp_for_level(10), 5000, 'street', 3, true, 500, '🏴', '#F4A460'),

  -- Family Tier (11-50) - Core Game Progression
  (12, 'Crew Runner', calculate_xp_for_level(12), 6000, 'family', 1, false, 750, '🏃', '#8B0000'),
  (14, 'Numbers Runner', calculate_xp_for_level(14), 7000, 'family', 1, false, 1000, '📊', '#A52A2A'),
  (16, 'Muscle for Hire', calculate_xp_for_level(16), 8000, 'family', 2, false, 1250, '💪', '#B22222'),
  (18, 'Made Member', calculate_xp_for_level(18), 9000, 'family', 2, true, 1500, '🤝', '#DC143C'),
  (20, 'Family Soldier', calculate_xp_for_level(20), 10000, 'family', 3, true, 2000, '⚔️', '#FF0000'),
  (22, 'Bookmaker', calculate_xp_for_level(22), 12000, 'family', 3, false, 2500, '📚', '#FF1493'),
  (24, 'Loan Shark', calculate_xp_for_level(24), 14000, 'family', 4, false, 3000, '🦈', '#FF69B4'),
  (25, 'Protection Racketeer', calculate_xp_for_level(25), 15000, 'family', 4, true, 3500, '🛡️', '#FF6347'),
  (28, 'Respected Soldier', calculate_xp_for_level(28), 17500, 'family', 5, false, 4000, '🎖️', '#CD5C5C'),
  (30, 'Territory Controller', calculate_xp_for_level(30), 20000, 'family', 5, true, 5000, '🗺️', '#F08080'),
  (32, 'Crew Leader', calculate_xp_for_level(32), 22500, 'family', 6, false, 6000, '👥', '#FA8072'),
  (35, 'Operations Manager', calculate_xp_for_level(35), 26250, 'family', 6, true, 7500, '📋', '#E9967A'),
  (38, 'Street Captain', calculate_xp_for_level(38), 30000, 'family', 7, false, 9000, '🧑‍✈️', '#FFA07A'),
  (40, 'Lieutenant Material', calculate_xp_for_level(40), 35000, 'family', 7, true, 10000, '🎯', '#FFB347'),
  (42, 'Business Partner', calculate_xp_for_level(42), 40000, 'family', 8, false, 12000, '🤵', '#FFD700'),
  (45, 'Vice Coordinator', calculate_xp_for_level(45), 47500, 'family', 8, true, 15000, '🎩', '#FFA500'),
  (48, 'Regional Enforcer', calculate_xp_for_level(48), 55000, 'family', 9, false, 18000, '👮', '#FF8C00'),
  (50, 'Family Advisor', calculate_xp_for_level(50), 62500, 'family', 9, true, 20000, '🏛️', '#FF7F50'),

  -- Elite Tier (51-100) - Advanced Progression
  (55, 'Capo Candidate', calculate_xp_for_level(55), 75000, 'elite', 1, true, 25000, '👑', '#4B0082'),
  (60, 'Junior Capo', calculate_xp_for_level(60), 87500, 'elite', 2, true, 30000, '💎', '#6A0DAD'),
  (65, 'District Manager', calculate_xp_for_level(65), 100000, 'elite', 3, false, 35000, '🏢', '#7B68EE'),
  (70, 'Family Enforcer', calculate_xp_for_level(70), 125000, 'elite', 4, true, 40000, '⚡', '#9370DB'),
  (75, 'Operations Chief', calculate_xp_for_level(75), 150000, 'elite', 5, true, 50000, '🎖️', '#BA55D3'),
  (80, 'Senior Capo', calculate_xp_for_level(80), 175000, 'elite', 6, true, 60000, '👨‍💼', '#DA70D6'),
  (85, 'Regional Boss', calculate_xp_for_level(85), 200000, 'elite', 7, false, 70000, '🏰', '#EE82EE'),
  (90, 'Underboss Material', calculate_xp_for_level(90), 237500, 'elite', 8, true, 85000, '🦅', '#DDA0DD'),
  (95, 'Family Consigliere', calculate_xp_for_level(95), 275000, 'elite', 9, false, 100000, '🧠', '#D8BFD8'),
  (100, 'Territory Don', calculate_xp_for_level(100), 312500, 'elite', 10, true, 120000, '👨‍⚖️', '#E6E6FA'),

  -- Legendary Tier (100+) - Endgame Content
  (110, 'Vice Lieutenant', calculate_xp_for_level(110), 375000, 'legendary', 1, false, 150000, '🌟', '#FFD700'),
  (125, 'Don Candidate', calculate_xp_for_level(125), 462500, 'legendary', 2, true, 200000, '👑', '#FFA500'),
  (150, 'Family Don', calculate_xp_for_level(150), 625000, 'legendary', 3, true, 300000, '💫', '#FF8C00'),
  (175, 'Commission Member', calculate_xp_for_level(175), 787500, 'legendary', 4, true, 400000, '⚡', '#FF7F50'),
  (200, 'Regional Kingpin', calculate_xp_for_level(200), 950000, 'legendary', 5, true, 500000, '🔥', '#FF6347'),
  (225, 'Criminal Empire', calculate_xp_for_level(225), 1125000, 'legendary', 6, true, 650000, '🏛️', '#FF4500'),
  (250, 'Crime Lord', calculate_xp_for_level(250), 1300000, 'legendary', 7, true, 800000, '😈', '#FF0000'),
  (275, 'Shadow Government', calculate_xp_for_level(275), 1487500, 'legendary', 8, true, 1000000, '👤', '#DC143C'),
  (300, 'Global Syndicate', calculate_xp_for_level(300), 1675000, 'legendary', 9, true, 1250000, '🌍', '#B22222'),
  (350, 'Underworld Emperor', calculate_xp_for_level(350), 1975000, 'legendary', 10, true, 1500000, '👑', '#8B0000'),
  (400, 'Criminal Legend', calculate_xp_for_level(400), 2275000, 'legendary', 10, true, 2000000, '⭐', '#800000'),
  (450, 'Criminal Mastermind', calculate_xp_for_level(450), 2587500, 'legendary', 10, true, 2500000, '🧠', '#660000'),
  (500, 'Mythical Boss', calculate_xp_for_level(500), 2900000, 'legendary', 10, true, 3000000, '🐉', '#4B0000'),
  (600, 'Crime Deity', calculate_xp_for_level(600), 3525000, 'legendary', 10, true, 4000000, '🔱', '#2F0000'),
  (750, 'Underworld God', calculate_xp_for_level(750), 4650000, 'legendary', 10, true, 5000000, '☠️', '#1A0000');

-- Step 7: Create all the enhanced functions and triggers
-- XP progression validation
CREATE OR REPLACE FUNCTION check_xp_progression() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.level_ranks
    WHERE level < NEW.level AND xp_required >= NEW.xp_required
    OR level > NEW.level AND xp_required <= NEW.xp_required
  ) THEN
    RAISE EXCEPTION 'XP requirements must increase monotonically with level';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_xp_progression
  BEFORE INSERT OR UPDATE ON public.level_ranks
  FOR EACH ROW EXECUTE FUNCTION check_xp_progression();

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_level_ranks_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_ranks_updated_at
  BEFORE UPDATE ON public.level_ranks
  FOR EACH ROW EXECUTE FUNCTION update_level_ranks_timestamp();

-- Enhanced RPC functions
CREATE OR REPLACE FUNCTION public.get_level_rank_enhanced(player_level INTEGER, player_reputation INTEGER DEFAULT 0)
RETURNS TABLE (
  level INTEGER,
  title VARCHAR(100),
  xp_required INTEGER,
  money_reward INTEGER,
  category VARCHAR(20),
  tier INTEGER,
  icon_name VARCHAR(50),
  color_hex VARCHAR(7),
  is_milestone BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT lr.level, lr.title, lr.xp_required, lr.money_reward, lr.category,
         lr.tier, lr.icon_name, lr.color_hex, lr.is_milestone
  FROM public.level_ranks lr
  WHERE lr.level <= player_level
    AND (lr.min_reputation IS NULL OR lr.min_reputation <= player_reputation)
  ORDER BY lr.level DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_next_level_rank_enhanced(player_level INTEGER, player_reputation INTEGER DEFAULT 0)
RETURNS TABLE (
  level INTEGER,
  title VARCHAR(100),
  xp_required INTEGER,
  money_reward INTEGER,
  category VARCHAR(20),
  tier INTEGER,
  icon_name VARCHAR(50),
  color_hex VARCHAR(7),
  is_milestone BOOLEAN,
  reputation_gap INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT lr.level, lr.title, lr.xp_required, lr.money_reward, lr.category,
         lr.tier, lr.icon_name, lr.color_hex, lr.is_milestone,
         GREATEST(0, COALESCE(lr.min_reputation, 0) - player_reputation) as reputation_gap
  FROM public.level_ranks lr
  WHERE lr.level > player_level
  ORDER BY lr.level ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_level_ranks_by_category(rank_category VARCHAR(20) DEFAULT NULL)
RETURNS TABLE (
  level INTEGER,
  title VARCHAR(100),
  xp_required INTEGER,
  money_reward INTEGER,
  category VARCHAR(20),
  tier INTEGER,
  icon_name VARCHAR(50),
  color_hex VARCHAR(7),
  is_milestone BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT lr.level, lr.title, lr.xp_required, lr.money_reward, lr.category,
         lr.tier, lr.icon_name, lr.color_hex, lr.is_milestone
  FROM public.level_ranks lr
  WHERE rank_category IS NULL OR lr.category = rank_category
  ORDER BY lr.level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_milestone_ranks()
RETURNS TABLE (
  level INTEGER,
  title VARCHAR(100),
  xp_required INTEGER,
  money_reward INTEGER,
  category VARCHAR(20),
  tier INTEGER,
  icon_name VARCHAR(50),
  color_hex VARCHAR(7)
) AS $$
BEGIN
  RETURN QUERY
  SELECT lr.level, lr.title, lr.xp_required, lr.money_reward, lr.category,
         lr.tier, lr.icon_name, lr.color_hex
  FROM public.level_ranks lr
  WHERE lr.is_milestone = true
  ORDER BY lr.level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Enable RLS and create policies
ALTER TABLE public.level_ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view level ranks" ON public.level_ranks
  FOR SELECT USING (true);

-- Step 9: Create materialized view for statistics
CREATE MATERIALIZED VIEW public.rank_statistics AS
SELECT
  category,
  COUNT(*) as total_ranks,
  MIN(level) as min_level,
  MAX(level) as max_level,
  AVG(money_reward)::INTEGER as avg_reward,
  COUNT(CASE WHEN is_milestone THEN 1 END) as milestone_count
FROM public.level_ranks
GROUP BY category
ORDER BY
  CASE category
    WHEN 'street' THEN 1
    WHEN 'family' THEN 2
    WHEN 'elite' THEN 3
    WHEN 'legendary' THEN 4
  END;

CREATE OR REPLACE FUNCTION refresh_rank_statistics() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.rank_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT SELECT ON public.rank_statistics TO authenticated;
GRANT SELECT ON public.level_ranks TO authenticated;

-- Step 10: Clean up temporary function
DROP FUNCTION calculate_xp_for_level(INTEGER);

-- Step 11: Verification queries
DO $$
DECLARE
    total_ranks INTEGER;
    milestone_count INTEGER;
    max_level INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(CASE WHEN is_milestone THEN 1 END), MAX(level)
    INTO total_ranks, milestone_count, max_level
    FROM public.level_ranks;

    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '  Total ranks: %', total_ranks;
    RAISE NOTICE '  Milestone ranks: %', milestone_count;
    RAISE NOTICE '  Max level: %', max_level;
    RAISE NOTICE '  Categories: street, family, elite, legendary';

    -- Verify XP progression is correct
    IF EXISTS (
        SELECT 1 FROM public.level_ranks lr1, public.level_ranks lr2
        WHERE lr1.level < lr2.level AND lr1.xp_required >= lr2.xp_required
    ) THEN
        RAISE EXCEPTION 'ERROR: XP progression validation failed!';
    ELSE
        RAISE NOTICE '  XP progression: ✓ Valid';
    END IF;
END $$;

-- Step 12: Post-migration notes
COMMENT ON TABLE public.level_ranks IS 'Enhanced level progression system migrated from basic ranks - includes categories, tiers, reputation requirements, and visual metadata';

-- Refresh the statistics view
SELECT refresh_rank_statistics();

RAISE NOTICE 'Enhanced Level Ranks migration completed successfully!';
RAISE NOTICE 'Backup of old data available in: level_ranks_backup';
RAISE NOTICE 'New features: categories, tiers, reputation requirements, visual styling, performance optimizations';
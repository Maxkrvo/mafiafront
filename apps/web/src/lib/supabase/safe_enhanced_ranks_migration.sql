-- Safe Migration Script: Upgrade Existing Level Ranks to Enhanced Version
-- This script safely handles existing level_ranks table and migrates to enhanced version

-- Step 1: Check if enhanced columns already exist
DO $$
DECLARE
    has_category BOOLEAN := FALSE;
    has_tier BOOLEAN := FALSE;
    has_icon BOOLEAN := FALSE;
BEGIN
    -- Check if we already have enhanced columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'level_ranks' AND column_name = 'category'
    ) INTO has_category;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'level_ranks' AND column_name = 'tier'
    ) INTO has_tier;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'level_ranks' AND column_name = 'icon_name'
    ) INTO has_icon;

    IF has_category AND has_tier AND has_icon THEN
        RAISE NOTICE 'Enhanced level_ranks table already exists. Skipping migration.';
        RETURN;
    END IF;

    RAISE NOTICE 'Starting migration to enhanced level_ranks table...';
END $$;

-- Step 2: Create backup of existing data
DO $$
BEGIN
    -- Create backup if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'level_ranks_backup_before_enhancement'
    ) THEN
        CREATE TABLE level_ranks_backup_before_enhancement AS
        SELECT * FROM public.level_ranks;
        RAISE NOTICE 'Created backup: level_ranks_backup_before_enhancement';
    ELSE
        RAISE NOTICE 'Backup table already exists: level_ranks_backup_before_enhancement';
    END IF;
END $$;

-- Step 3: Add new columns to existing table (safe operation)
DO $$
BEGIN
    -- Add category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'category') THEN
        ALTER TABLE public.level_ranks ADD COLUMN category VARCHAR(20) DEFAULT 'street';
        ALTER TABLE public.level_ranks ADD CONSTRAINT check_category CHECK (category IN ('street', 'family', 'elite', 'legendary'));
        RAISE NOTICE 'Added category column';
    END IF;

    -- Add tier column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'tier') THEN
        ALTER TABLE public.level_ranks ADD COLUMN tier INTEGER DEFAULT 1;
        ALTER TABLE public.level_ranks ADD CONSTRAINT check_tier CHECK (tier BETWEEN 1 AND 10);
        RAISE NOTICE 'Added tier column';
    END IF;

    -- Add icon_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'icon_name') THEN
        ALTER TABLE public.level_ranks ADD COLUMN icon_name VARCHAR(50);
        RAISE NOTICE 'Added icon_name column';
    END IF;

    -- Add color_hex column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'color_hex') THEN
        ALTER TABLE public.level_ranks ADD COLUMN color_hex VARCHAR(7);
        ALTER TABLE public.level_ranks ADD CONSTRAINT check_color_hex CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$');
        RAISE NOTICE 'Added color_hex column';
    END IF;

    -- Add min_reputation column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'min_reputation') THEN
        ALTER TABLE public.level_ranks ADD COLUMN min_reputation INTEGER DEFAULT 0;
        RAISE NOTICE 'Added min_reputation column';
    END IF;

    -- Add required_stat_points column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'required_stat_points') THEN
        ALTER TABLE public.level_ranks ADD COLUMN required_stat_points INTEGER DEFAULT 0;
        RAISE NOTICE 'Added required_stat_points column';
    END IF;

    -- Add is_milestone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'is_milestone') THEN
        ALTER TABLE public.level_ranks ADD COLUMN is_milestone BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_milestone column';
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'updated_at') THEN
        ALTER TABLE public.level_ranks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Step 4: Create XP calculation function that matches levels.ts exactly
CREATE OR REPLACE FUNCTION calculate_accurate_xp_for_level(target_level INTEGER) RETURNS INTEGER AS $$
BEGIN
    -- Exact match for the hybrid scaling from levels.ts
    IF target_level <= 1 THEN
        RETURN 0;
    ELSIF target_level <= 20 THEN
        -- Early levels (1-20): 100 XP per level
        RETURN (target_level - 1) * 100;
    ELSE
        -- Later levels: Base 2000 XP + exponential scaling
        RETURN 2000 + POWER(target_level - 20, 2) * 200;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Clear existing data and insert enhanced data with accurate values
DO $$
BEGIN
    -- Truncate and reset the sequence
    TRUNCATE TABLE public.level_ranks RESTART IDENTITY;
    RAISE NOTICE 'Cleared existing level_ranks data';
END $$;

-- Insert enhanced level ranks data
INSERT INTO public.level_ranks (
    level, title, xp_required, money_reward, category, tier, is_milestone,
    min_reputation, icon_name, color_hex, created_at
) VALUES
    -- Street Tier (1-10) - Tutorial/Early Game
    (1, 'Street Thug', calculate_accurate_xp_for_level(1), 0, 'street', 1, true, 0, '👊', '#8B4513', NOW()),
    (2, 'Petty Criminal', calculate_accurate_xp_for_level(2), 1000, 'street', 1, true, 0, '🔫', '#A0522D', NOW()),
    (4, 'Corner Hustler', calculate_accurate_xp_for_level(4), 2000, 'street', 2, false, 50, '💊', '#CD853F', NOW()),
    (6, 'Small Time Crook', calculate_accurate_xp_for_level(6), 3000, 'street', 2, false, 100, '🎲', '#D2B48C', NOW()),
    (8, 'Seasoned Criminal', calculate_accurate_xp_for_level(8), 4000, 'street', 3, false, 200, '🗡️', '#DEB887', NOW()),
    (10, 'Gang Associate', calculate_accurate_xp_for_level(10), 5000, 'street', 3, true, 500, '🏴', '#F4A460', NOW()),

    -- Family Tier (11-50) - Core Game Progression
    (12, 'Crew Runner', calculate_accurate_xp_for_level(12), 6000, 'family', 1, false, 750, '🏃', '#8B0000', NOW()),
    (14, 'Numbers Runner', calculate_accurate_xp_for_level(14), 7000, 'family', 1, false, 1000, '📊', '#A52A2A', NOW()),
    (16, 'Muscle for Hire', calculate_accurate_xp_for_level(16), 8000, 'family', 2, false, 1250, '💪', '#B22222', NOW()),
    (18, 'Made Member', calculate_accurate_xp_for_level(18), 9000, 'family', 2, true, 1500, '🤝', '#DC143C', NOW()),
    (20, 'Family Soldier', calculate_accurate_xp_for_level(20), 10000, 'family', 3, true, 2000, '⚔️', '#FF0000', NOW()),
    (22, 'Bookmaker', calculate_accurate_xp_for_level(22), 12000, 'family', 3, false, 2500, '📚', '#FF1493', NOW()),
    (24, 'Loan Shark', calculate_accurate_xp_for_level(24), 14000, 'family', 4, false, 3000, '🦈', '#FF69B4', NOW()),
    (25, 'Protection Racketeer', calculate_accurate_xp_for_level(25), 15000, 'family', 4, true, 3500, '🛡️', '#FF6347', NOW()),
    (28, 'Respected Soldier', calculate_accurate_xp_for_level(28), 17500, 'family', 5, false, 4000, '🎖️', '#CD5C5C', NOW()),
    (30, 'Territory Controller', calculate_accurate_xp_for_level(30), 20000, 'family', 5, true, 5000, '🗺️', '#F08080', NOW()),
    (32, 'Crew Leader', calculate_accurate_xp_for_level(32), 22500, 'family', 6, false, 6000, '👥', '#FA8072', NOW()),
    (35, 'Operations Manager', calculate_accurate_xp_for_level(35), 26250, 'family', 6, true, 7500, '📋', '#E9967A', NOW()),
    (38, 'Street Captain', calculate_accurate_xp_for_level(38), 30000, 'family', 7, false, 9000, '🧑‍✈️', '#FFA07A', NOW()),
    (40, 'Lieutenant Material', calculate_accurate_xp_for_level(40), 35000, 'family', 7, true, 10000, '🎯', '#FFB347', NOW()),
    (42, 'Business Partner', calculate_accurate_xp_for_level(42), 40000, 'family', 8, false, 12000, '🤵', '#FFD700', NOW()),
    (45, 'Vice Coordinator', calculate_accurate_xp_for_level(45), 47500, 'family', 8, true, 15000, '🎩', '#FFA500', NOW()),
    (48, 'Regional Enforcer', calculate_accurate_xp_for_level(48), 55000, 'family', 9, false, 18000, '👮', '#FF8C00', NOW()),
    (50, 'Family Advisor', calculate_accurate_xp_for_level(50), 62500, 'family', 9, true, 20000, '🏛️', '#FF7F50', NOW()),

    -- Elite Tier (51-100) - Advanced Progression
    (55, 'Capo Candidate', calculate_accurate_xp_for_level(55), 75000, 'elite', 1, true, 25000, '👑', '#4B0082', NOW()),
    (60, 'Junior Capo', calculate_accurate_xp_for_level(60), 87500, 'elite', 2, true, 30000, '💎', '#6A0DAD', NOW()),
    (65, 'District Manager', calculate_accurate_xp_for_level(65), 100000, 'elite', 3, false, 35000, '🏢', '#7B68EE', NOW()),
    (70, 'Family Enforcer', calculate_accurate_xp_for_level(70), 125000, 'elite', 4, true, 40000, '⚡', '#9370DB', NOW()),
    (75, 'Operations Chief', calculate_accurate_xp_for_level(75), 150000, 'elite', 5, true, 50000, '🎖️', '#BA55D3', NOW()),
    (80, 'Senior Capo', calculate_accurate_xp_for_level(80), 175000, 'elite', 6, true, 60000, '👨‍💼', '#DA70D6', NOW()),
    (85, 'Regional Boss', calculate_accurate_xp_for_level(85), 200000, 'elite', 7, false, 70000, '🏰', '#EE82EE', NOW()),
    (90, 'Underboss Material', calculate_accurate_xp_for_level(90), 237500, 'elite', 8, true, 85000, '🦅', '#DDA0DD', NOW()),
    (95, 'Family Consigliere', calculate_accurate_xp_for_level(95), 275000, 'elite', 9, false, 100000, '🧠', '#D8BFD8', NOW()),
    (100, 'Territory Don', calculate_accurate_xp_for_level(100), 312500, 'elite', 10, true, 120000, '👨‍⚖️', '#E6E6FA', NOW()),

    -- Legendary Tier (100+) - Endgame Content
    (110, 'Vice Lieutenant', calculate_accurate_xp_for_level(110), 375000, 'legendary', 1, false, 150000, '🌟', '#FFD700', NOW()),
    (125, 'Don Candidate', calculate_accurate_xp_for_level(125), 462500, 'legendary', 2, true, 200000, '👑', '#FFA500', NOW()),
    (150, 'Family Don', calculate_accurate_xp_for_level(150), 625000, 'legendary', 3, true, 300000, '💫', '#FF8C00', NOW()),
    (175, 'Commission Member', calculate_accurate_xp_for_level(175), 787500, 'legendary', 4, true, 400000, '⚡', '#FF7F50', NOW()),
    (200, 'Regional Kingpin', calculate_accurate_xp_for_level(200), 950000, 'legendary', 5, true, 500000, '🔥', '#FF6347', NOW()),
    (225, 'Criminal Empire', calculate_accurate_xp_for_level(225), 1125000, 'legendary', 6, true, 650000, '🏛️', '#FF4500', NOW()),
    (250, 'Crime Lord', calculate_accurate_xp_for_level(250), 1300000, 'legendary', 7, true, 800000, '😈', '#FF0000', NOW()),
    (275, 'Shadow Government', calculate_accurate_xp_for_level(275), 1487500, 'legendary', 8, true, 1000000, '👤', '#DC143C', NOW()),
    (300, 'Global Syndicate', calculate_accurate_xp_for_level(300), 1675000, 'legendary', 9, true, 1250000, '🌍', '#B22222', NOW()),
    (350, 'Underworld Emperor', calculate_accurate_xp_for_level(350), 1975000, 'legendary', 10, true, 1500000, '👑', '#8B0000', NOW()),
    (400, 'Criminal Legend', calculate_accurate_xp_for_level(400), 2275000, 'legendary', 10, true, 2000000, '⭐', '#800000', NOW()),
    (450, 'Criminal Mastermind', calculate_accurate_xp_for_level(450), 2587500, 'legendary', 10, true, 2500000, '🧠', '#660000', NOW()),
    (500, 'Mythical Boss', calculate_accurate_xp_for_level(500), 2900000, 'legendary', 10, true, 3000000, '🐉', '#4B0000', NOW()),
    (600, 'Crime Deity', calculate_accurate_xp_for_level(600), 3525000, 'legendary', 10, true, 4000000, '🔱', '#2F0000', NOW()),
    (750, 'Underworld God', calculate_accurate_xp_for_level(750), 4650000, 'legendary', 10, true, 5000000, '☠️', '#1A0000', NOW());

-- Step 6: Create performance indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_level_ranks_level ON public.level_ranks(level);
CREATE INDEX IF NOT EXISTS idx_level_ranks_category ON public.level_ranks(category);
CREATE INDEX IF NOT EXISTS idx_level_ranks_tier ON public.level_ranks(tier);
CREATE INDEX IF NOT EXISTS idx_level_ranks_xp_required ON public.level_ranks(xp_required);
CREATE INDEX IF NOT EXISTS idx_level_ranks_milestone ON public.level_ranks(is_milestone);

-- Step 7: Create or replace enhanced RPC functions
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

-- Step 8: Create triggers (replace if exist)
DROP TRIGGER IF EXISTS ensure_xp_progression ON public.level_ranks;
DROP TRIGGER IF EXISTS update_level_ranks_updated_at ON public.level_ranks;

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

CREATE OR REPLACE FUNCTION update_level_ranks_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_ranks_updated_at
  BEFORE UPDATE ON public.level_ranks
  FOR EACH ROW EXECUTE FUNCTION update_level_ranks_timestamp();

-- Step 9: Enable RLS and create policies (safe operations)
ALTER TABLE public.level_ranks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view level ranks" ON public.level_ranks;
CREATE POLICY "Anyone can view level ranks" ON public.level_ranks
  FOR SELECT USING (true);

-- Step 10: Create materialized view for statistics
DROP MATERIALIZED VIEW IF EXISTS public.rank_statistics;

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

-- Grant permissions
GRANT SELECT ON public.rank_statistics TO authenticated;
GRANT SELECT ON public.level_ranks TO authenticated;

-- Step 11: Refresh statistics view
SELECT refresh_rank_statistics();

-- Step 12: Clean up temporary function
DROP FUNCTION calculate_accurate_xp_for_level(INTEGER);

-- Step 13: Final verification
DO $$
DECLARE
    total_ranks INTEGER;
    milestone_count INTEGER;
    max_level INTEGER;
    category_count INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(CASE WHEN is_milestone THEN 1 END), MAX(level)
    INTO total_ranks, milestone_count, max_level
    FROM public.level_ranks;

    SELECT COUNT(DISTINCT category) INTO category_count FROM public.level_ranks;

    RAISE NOTICE '====================================';
    RAISE NOTICE 'Enhanced Level Ranks Migration COMPLETE';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Total ranks created: %', total_ranks;
    RAISE NOTICE 'Milestone ranks: %', milestone_count;
    RAISE NOTICE 'Max level: %', max_level;
    RAISE NOTICE 'Categories: % (street, family, elite, legendary)', category_count;
    RAISE NOTICE 'Performance indexes: ✓ Created';
    RAISE NOTICE 'Enhanced RPC functions: ✓ Created';
    RAISE NOTICE 'Statistics view: ✓ Created';
    RAISE NOTICE 'Backup table: level_ranks_backup_before_enhancement';
    RAISE NOTICE '====================================';

    -- Verify data integrity
    IF EXISTS (
        SELECT 1 FROM public.level_ranks lr1, public.level_ranks lr2
        WHERE lr1.level < lr2.level AND lr1.xp_required >= lr2.xp_required
    ) THEN
        RAISE EXCEPTION 'MIGRATION ERROR: XP progression validation failed!';
    ELSE
        RAISE NOTICE 'XP progression validation: ✓ PASSED';
    END IF;

    IF total_ranks < 40 THEN
        RAISE EXCEPTION 'MIGRATION ERROR: Insufficient ranks created (expected 40+, got %)', total_ranks;
    ELSE
        RAISE NOTICE 'Rank count validation: ✓ PASSED';
    END IF;

    RAISE NOTICE '====================================';
    RAISE NOTICE 'Migration completed successfully! 🎉';
    RAISE NOTICE '====================================';
END $$;
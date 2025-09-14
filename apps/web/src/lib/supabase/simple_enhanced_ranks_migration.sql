-- Simple Enhanced Level Ranks Migration
-- Safe migration with pre-calculated XP values to avoid function call issues

-- Step 1: Check if migration needed
DO $$
DECLARE
    has_category BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'level_ranks' AND column_name = 'category'
    ) INTO has_category;

    IF has_category THEN
        RAISE NOTICE 'Enhanced level_ranks table already exists. Migration skipped.';
        RETURN;
    END IF;

    RAISE NOTICE 'Starting enhanced level_ranks migration...';
END $$;

-- Step 2: Create backup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'level_ranks_backup_simple'
    ) THEN
        CREATE TABLE level_ranks_backup_simple AS SELECT * FROM public.level_ranks;
        RAISE NOTICE 'Created backup: level_ranks_backup_simple';
    END IF;
END $$;

-- Step 3: Add new columns
DO $$
BEGIN
    -- Add category
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'category') THEN
        ALTER TABLE public.level_ranks ADD COLUMN category VARCHAR(20) DEFAULT 'street';
        ALTER TABLE public.level_ranks ADD CONSTRAINT check_category CHECK (category IN ('street', 'family', 'elite', 'legendary'));
    END IF;

    -- Add tier
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'tier') THEN
        ALTER TABLE public.level_ranks ADD COLUMN tier INTEGER DEFAULT 1;
        ALTER TABLE public.level_ranks ADD CONSTRAINT check_tier CHECK (tier BETWEEN 1 AND 10);
    END IF;

    -- Add icon_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'icon_name') THEN
        ALTER TABLE public.level_ranks ADD COLUMN icon_name VARCHAR(50);
    END IF;

    -- Add color_hex
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'color_hex') THEN
        ALTER TABLE public.level_ranks ADD COLUMN color_hex VARCHAR(7);
        ALTER TABLE public.level_ranks ADD CONSTRAINT check_color_hex CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$');
    END IF;

    -- Add min_reputation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'min_reputation') THEN
        ALTER TABLE public.level_ranks ADD COLUMN min_reputation INTEGER DEFAULT 0;
    END IF;

    -- Add is_milestone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'is_milestone') THEN
        ALTER TABLE public.level_ranks ADD COLUMN is_milestone BOOLEAN DEFAULT false;
    END IF;

    -- Add updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'level_ranks' AND column_name = 'updated_at') THEN
        ALTER TABLE public.level_ranks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    RAISE NOTICE 'Enhanced columns added successfully';
END $$;

-- Step 4: Clear and populate with enhanced data (using pre-calculated XP values)
TRUNCATE TABLE public.level_ranks RESTART IDENTITY;

INSERT INTO public.level_ranks (level, title, xp_required, money_reward, category, tier, is_milestone, min_reputation, icon_name, color_hex) VALUES
    -- Street Tier (1-10) - XP values calculated from levels.ts formula
    (1, 'Street Thug', 0, 0, 'street', 1, true, 0, '👊', '#8B4513'),
    (2, 'Petty Criminal', 100, 1000, 'street', 1, true, 0, '🔫', '#A0522D'),
    (4, 'Corner Hustler', 300, 2000, 'street', 2, false, 50, '💊', '#CD853F'),
    (6, 'Small Time Crook', 500, 3000, 'street', 2, false, 100, '🎲', '#D2B48C'),
    (8, 'Seasoned Criminal', 700, 4000, 'street', 3, false, 200, '🗡️', '#DEB887'),
    (10, 'Gang Associate', 900, 5000, 'street', 3, true, 500, '🏴', '#F4A460'),

    -- Family Tier (11-50)
    (12, 'Crew Runner', 1100, 6000, 'family', 1, false, 750, '🏃', '#8B0000'),
    (14, 'Numbers Runner', 1300, 7000, 'family', 1, false, 1000, '📊', '#A52A2A'),
    (16, 'Muscle for Hire', 1500, 8000, 'family', 2, false, 1250, '💪', '#B22222'),
    (18, 'Made Member', 1700, 9000, 'family', 2, true, 1500, '🤝', '#DC143C'),
    (20, 'Family Soldier', 1900, 10000, 'family', 3, true, 2000, '⚔️', '#FF0000'),
    (22, 'Bookmaker', 2100, 12000, 'family', 3, false, 2500, '📚', '#FF1493'),
    (24, 'Loan Shark', 2300, 14000, 'family', 4, false, 3000, '🦈', '#FF69B4'),
    (25, 'Protection Racketeer', 2400, 15000, 'family', 4, true, 3500, '🛡️', '#FF6347'),
    (28, 'Respected Soldier', 2700, 17500, 'family', 5, false, 4000, '🎖️', '#CD5C5C'),
    (30, 'Territory Controller', 2900, 20000, 'family', 5, true, 5000, '🗺️', '#F08080'),
    (32, 'Crew Leader', 3100, 22500, 'family', 6, false, 6000, '👥', '#FA8072'),
    (35, 'Operations Manager', 3400, 26250, 'family', 6, true, 7500, '📋', '#E9967A'),
    (38, 'Street Captain', 3700, 30000, 'family', 7, false, 9000, '🧑‍✈️', '#FFA07A'),
    (40, 'Lieutenant Material', 3900, 35000, 'family', 7, true, 10000, '🎯', '#FFB347'),
    (42, 'Business Partner', 4100, 40000, 'family', 8, false, 12000, '🤵', '#FFD700'),
    (45, 'Vice Coordinator', 4400, 47500, 'family', 8, true, 15000, '🎩', '#FFA500'),
    (48, 'Regional Enforcer', 4700, 55000, 'family', 9, false, 18000, '👮', '#FF8C00'),
    (50, 'Family Advisor', 4900, 62500, 'family', 9, true, 20000, '🏛️', '#FF7F50'),

    -- Elite Tier (51-100) - Exponential XP scaling starts here
    (55, 'Capo Candidate', 5900, 75000, 'elite', 1, true, 25000, '👑', '#4B0082'),
    (60, 'Junior Capo', 7400, 87500, 'elite', 2, true, 30000, '💎', '#6A0DAD'),
    (65, 'District Manager', 9100, 100000, 'elite', 3, false, 35000, '🏢', '#7B68EE'),
    (70, 'Family Enforcer', 11000, 125000, 'elite', 4, true, 40000, '⚡', '#9370DB'),
    (75, 'Operations Chief', 13100, 150000, 'elite', 5, true, 50000, '🎖️', '#BA55D3'),
    (80, 'Senior Capo', 15400, 175000, 'elite', 6, true, 60000, '👨‍💼', '#DA70D6'),
    (85, 'Regional Boss', 17900, 200000, 'elite', 7, false, 70000, '🏰', '#EE82EE'),
    (90, 'Underboss Material', 20600, 237500, 'elite', 8, true, 85000, '🦅', '#DDA0DD'),
    (95, 'Family Consigliere', 23500, 275000, 'elite', 9, false, 100000, '🧠', '#D8BFD8'),
    (100, 'Territory Don', 26600, 312500, 'elite', 10, true, 120000, '👨‍⚖️', '#E6E6FA'),

    -- Legendary Tier (100+) - Massive XP requirements
    (110, 'Vice Lieutenant', 30600, 375000, 'legendary', 1, false, 150000, '🌟', '#FFD700'),
    (125, 'Don Candidate', 38100, 462500, 'legendary', 2, true, 200000, '👑', '#FFA500'),
    (150, 'Family Don', 58600, 625000, 'legendary', 3, true, 300000, '💫', '#FF8C00'),
    (175, 'Commission Member', 84100, 787500, 'legendary', 4, true, 400000, '⚡', '#FF7F50'),
    (200, 'Regional Kingpin', 114600, 950000, 'legendary', 5, true, 500000, '🔥', '#FF6347'),
    (225, 'Criminal Empire', 150100, 1125000, 'legendary', 6, true, 650000, '🏛️', '#FF4500'),
    (250, 'Crime Lord', 190600, 1300000, 'legendary', 7, true, 800000, '😈', '#FF0000'),
    (275, 'Shadow Government', 236100, 1487500, 'legendary', 8, true, 1000000, '👤', '#DC143C'),
    (300, 'Global Syndicate', 286600, 1675000, 'legendary', 9, true, 1250000, '🌍', '#B22222'),
    (350, 'Underworld Emperor', 388600, 1975000, 'legendary', 10, true, 1500000, '👑', '#8B0000'),
    (400, 'Criminal Legend', 516600, 2275000, 'legendary', 10, true, 2000000, '⭐', '#800000'),
    (450, 'Criminal Mastermind', 670600, 2587500, 'legendary', 10, true, 2500000, '🧠', '#660000'),
    (500, 'Mythical Boss', 850600, 2900000, 'legendary', 10, true, 3000000, '🐉', '#4B0000'),
    (600, 'Crime Deity', 1250600, 3525000, 'legendary', 10, true, 4000000, '🔱', '#2F0000'),
    (750, 'Underworld God', 1875600, 4650000, 'legendary', 10, true, 5000000, '☠️', '#1A0000');

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_level_ranks_level ON public.level_ranks(level);
CREATE INDEX IF NOT EXISTS idx_level_ranks_category ON public.level_ranks(category);
CREATE INDEX IF NOT EXISTS idx_level_ranks_tier ON public.level_ranks(tier);
CREATE INDEX IF NOT EXISTS idx_level_ranks_milestone ON public.level_ranks(is_milestone);

-- Step 6: Create enhanced RPC functions
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

-- Step 7: Enable RLS and create policies
ALTER TABLE public.level_ranks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view level ranks" ON public.level_ranks;
CREATE POLICY "Anyone can view level ranks" ON public.level_ranks FOR SELECT USING (true);

-- Step 8: Create materialized view for statistics
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
GROUP BY category;

CREATE OR REPLACE FUNCTION refresh_rank_statistics() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.rank_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT SELECT ON public.rank_statistics TO authenticated;
GRANT SELECT ON public.level_ranks TO authenticated;

-- Step 9: Refresh statistics
SELECT refresh_rank_statistics();

-- Step 10: Final verification
DO $$
DECLARE
    total_ranks INTEGER;
    milestone_count INTEGER;
    category_count INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(CASE WHEN is_milestone THEN 1 END)
    INTO total_ranks, milestone_count FROM public.level_ranks;

    SELECT COUNT(DISTINCT category) INTO category_count FROM public.level_ranks;

    RAISE NOTICE '================================';
    RAISE NOTICE 'Enhanced Level Ranks Migration COMPLETE!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Total ranks: %', total_ranks;
    RAISE NOTICE 'Milestone ranks: %', milestone_count;
    RAISE NOTICE 'Categories: % (street, family, elite, legendary)', category_count;
    RAISE NOTICE 'Backup created: level_ranks_backup_simple';
    RAISE NOTICE 'Enhanced features: categories, tiers, icons, colors';
    RAISE NOTICE '================================';
END $$;
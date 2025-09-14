-- Enhanced Level Ranks Table
-- Comprehensive level progression system with categories, metadata, and performance optimizations

-- Drop existing table if recreating
-- DROP TABLE IF EXISTS public.level_ranks CASCADE;

-- Main level ranks table with enhanced structure
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

-- Performance indexes
CREATE INDEX idx_level_ranks_level ON public.level_ranks(level);
CREATE INDEX idx_level_ranks_category ON public.level_ranks(category);
CREATE INDEX idx_level_ranks_tier ON public.level_ranks(tier);
CREATE INDEX idx_level_ranks_xp_required ON public.level_ranks(xp_required);
CREATE INDEX idx_level_ranks_display_order ON public.level_ranks(display_order);

-- Ensure XP requirements are monotonically increasing
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

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_level_ranks_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_ranks_updated_at
  BEFORE UPDATE ON public.level_ranks
  FOR EACH ROW EXECUTE FUNCTION update_level_ranks_timestamp();

-- Insert data with calculated XP values and categorization
INSERT INTO public.level_ranks (level, title, xp_required, money_reward, category, tier, is_milestone, min_reputation, icon_name, color_hex) VALUES
  -- Street Tier (1-10) - Tutorial/Early Game
  (1, 'Street Thug', 0, 0, 'street', 1, true, 0, '👊', '#8B4513'),
  (2, 'Petty Criminal', 100, 1000, 'street', 1, true, 0, '🔫', '#A0522D'),
  (4, 'Corner Hustler', 300, 2000, 'street', 2, false, 50, '💊', '#CD853F'),
  (6, 'Small Time Crook', 500, 3000, 'street', 2, false, 100, '🎲', '#D2B48C'),
  (8, 'Seasoned Criminal', 700, 4000, 'street', 3, false, 200, '🗡️', '#DEB887'),
  (10, 'Gang Associate', 900, 5000, 'street', 3, true, 500, '🏴', '#F4A460'),

  -- Family Tier (11-50) - Core Game Progression
  (12, 'Crew Runner', 1100, 6000, 'family', 1, false, 750, '🏃', '#8B0000'),
  (14, 'Numbers Runner', 1300, 7000, 'family', 1, false, 1000, '📊', '#A52A2A'),
  (16, 'Muscle for Hire', 1500, 8000, 'family', 2, false, 1250, '💪', '#B22222'),
  (18, 'Made Member', 1700, 9000, 'family', 2, true, 1500, '🤝', '#DC143C'),
  (20, 'Family Soldier', 1900, 10000, 'family', 3, true, 2000, '⚔️', '#FF0000'),
  (22, 'Bookmaker', 2300, 12000, 'family', 3, false, 2500, '📚', '#FF1493'),
  (24, 'Loan Shark', 2700, 14000, 'family', 4, false, 3000, '🦈', '#FF69B4'),
  (25, 'Protection Racketeer', 2900, 15000, 'family', 4, true, 3500, '🛡️', '#FF6347'),
  (28, 'Respected Soldier', 3500, 17500, 'family', 5, false, 4000, '🎖️', '#CD5C5C'),
  (30, 'Territory Controller', 4000, 20000, 'family', 5, true, 5000, '🗺️', '#F08080'),
  (32, 'Crew Leader', 4800, 22500, 'family', 6, false, 6000, '👥', '#FA8072'),
  (35, 'Operations Manager', 6300, 26250, 'family', 6, true, 7500, '📋', '#E9967A'),
  (38, 'Street Captain', 8000, 30000, 'family', 7, false, 9000, '🧑‍✈️', '#FFA07A'),
  (40, 'Lieutenant Material', 10000, 35000, 'family', 7, true, 10000, '🎯', '#FFB347'),
  (42, 'Business Partner', 12200, 40000, 'family', 8, false, 12000, '🤵', '#FFD700'),
  (45, 'Vice Coordinator', 15500, 47500, 'family', 8, true, 15000, '🎩', '#FFA500'),
  (48, 'Regional Enforcer', 19000, 55000, 'family', 9, false, 18000, '👮', '#FF8C00'),
  (50, 'Family Advisor', 22800, 62500, 'family', 9, true, 20000, '🏛️', '#FF7F50'),

  -- Elite Tier (51-100) - Advanced Progression
  (55, 'Capo Candidate', 27800, 75000, 'elite', 1, true, 25000, '👑', '#4B0082'),
  (60, 'Junior Capo', 33800, 87500, 'elite', 2, true, 30000, '💎', '#6A0DAD'),
  (65, 'District Manager', 40800, 100000, 'elite', 3, false, 35000, '🏢', '#7B68EE'),
  (70, 'Family Enforcer', 48800, 125000, 'elite', 4, true, 40000, '⚡', '#9370DB'),
  (75, 'Operations Chief', 57800, 150000, 'elite', 5, true, 50000, '🎖️', '#BA55D3'),
  (80, 'Senior Capo', 67800, 175000, 'elite', 6, true, 60000, '👨‍💼', '#DA70D6'),
  (85, 'Regional Boss', 78800, 200000, 'elite', 7, false, 70000, '🏰', '#EE82EE'),
  (90, 'Underboss Material', 90800, 237500, 'elite', 8, true, 85000, '🦅', '#DDA0DD'),
  (95, 'Family Consigliere', 103800, 275000, 'elite', 9, false, 100000, '🧠', '#D8BFD8'),
  (100, 'Territory Don', 117800, 312500, 'elite', 10, true, 120000, '👨‍⚖️', '#E6E6FA'),

  -- Legendary Tier (100+) - Endgame Content
  (110, 'Vice Lieutenant', 137800, 375000, 'legendary', 1, false, 150000, '🌟', '#FFD700'),
  (125, 'Don Candidate', 167800, 462500, 'legendary', 2, true, 200000, '👑', '#FFA500'),
  (150, 'Family Don', 217800, 625000, 'legendary', 3, true, 300000, '💫', '#FF8C00'),
  (175, 'Commission Member', 278000, 787500, 'legendary', 4, true, 400000, '⚡', '#FF7F50'),
  (200, 'Regional Kingpin', 338000, 950000, 'legendary', 5, true, 500000, '🔥', '#FF6347'),
  (225, 'Criminal Empire', 408000, 1125000, 'legendary', 6, true, 650000, '🏛️', '#FF4500'),
  (250, 'Crime Lord', 488000, 1300000, 'legendary', 7, true, 800000, '😈', '#FF0000'),
  (275, 'Shadow Government', 578000, 1487500, 'legendary', 8, true, 1000000, '👤', '#DC143C'),
  (300, 'Global Syndicate', 678000, 1675000, 'legendary', 9, true, 1250000, '🌍', '#B22222'),
  (350, 'Underworld Emperor', 788000, 1975000, 'legendary', 10, true, 1500000, '👑', '#8B0000'),
  (400, 'Criminal Legend', 908000, 2275000, 'legendary', 10, true, 2000000, '⭐', '#800000'),
  (450, 'Criminal Mastermind', 1038000, 2587500, 'legendary', 10, true, 2500000, '🧠', '#660000'),
  (500, 'Mythical Boss', 1178000, 2900000, 'legendary', 10, true, 3000000, '🐉', '#4B0000'),
  (600, 'Crime Deity', 1678000, 3525000, 'legendary', 10, true, 4000000, '🔱', '#2F0000'),
  (750, 'Underworld God', 2178000, 4650000, 'legendary', 10, true, 5000000, '☠️', '#1A0000');

-- Enhanced RPC functions with performance optimizations
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

-- Enable RLS
ALTER TABLE public.level_ranks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view level ranks" ON public.level_ranks
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify level ranks" ON public.level_ranks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE id = auth.uid()
      AND rank = 'Admin'
    )
  );

-- Create a view for commonly accessed rank information
CREATE OR REPLACE VIEW public.level_progression AS
SELECT
  lr.level,
  lr.title,
  lr.xp_required,
  lr.money_reward,
  lr.category,
  lr.tier,
  lr.is_milestone,
  lr.icon_name,
  lr.color_hex,
  LAG(lr.level) OVER (ORDER BY lr.level) as prev_level,
  LEAD(lr.level) OVER (ORDER BY lr.level) as next_level,
  LAG(lr.xp_required) OVER (ORDER BY lr.level) as prev_xp,
  LEAD(lr.xp_required) OVER (ORDER BY lr.level) as next_xp,
  lr.xp_required - LAG(lr.xp_required, 1, 0) OVER (ORDER BY lr.level) as xp_gap
FROM public.level_ranks lr;

-- Grant access to the view
GRANT SELECT ON public.level_progression TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.level_ranks IS 'Enhanced level progression system with categories, tiers, and metadata';
COMMENT ON COLUMN public.level_ranks.category IS 'Progression category: street, family, elite, legendary';
COMMENT ON COLUMN public.level_ranks.tier IS 'Tier within category (1-10)';
COMMENT ON COLUMN public.level_ranks.is_milestone IS 'True for major progression milestones';
COMMENT ON COLUMN public.level_ranks.min_reputation IS 'Minimum reputation required to unlock this rank';
COMMENT ON COLUMN public.level_ranks.icon_name IS 'Emoji or icon identifier for UI display';
COMMENT ON COLUMN public.level_ranks.color_hex IS 'Hex color code for rank styling';

-- Create materialized view for rank statistics (refresh periodically)
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

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_rank_statistics() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.rank_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT SELECT ON public.rank_statistics TO authenticated;
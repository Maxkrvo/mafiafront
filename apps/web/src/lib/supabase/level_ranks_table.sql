-- Level Ranks Table
-- Stores all the level milestone descriptions from getLevelMilestones()
-- This is separate from the traditional famiglia ranks (Associate, Soldier, Capo, Don)

CREATE TABLE public.level_ranks (
  id SERIAL PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  xp_required INTEGER NOT NULL,
  money_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert all level milestone data from getLevelMilestones()
INSERT INTO public.level_ranks (level, title, xp_required, money_reward) VALUES
  -- Early progression (1–10) - every 2 levels
  (1, 'Street Thug', 0, 0),
  (2, 'Petty Criminal', 100, 1000),
  (4, 'Corner Hustler', 300, 1500),
  (6, 'Small Time Crook', 500, 2000),
  (8, 'Seasoned Criminal', 700, 2500),
  (10, 'Gang Associate', 900, 3000),

  -- Mid progression (11–25) - every 2–3 levels
  (12, 'Crew Runner', 1100, 3500),
  (14, 'Numbers Runner', 1300, 4000),
  (16, 'Muscle for Hire', 1500, 4500),
  (18, 'Made Member', 1700, 5000),
  (20, 'Family Soldier', 1900, 6000),
  (22, 'Bookmaker', 2300, 7000),
  (24, 'Loan Shark', 2700, 8000),
  (25, 'Protection Racketeer', 2900, 9000),

  -- High progression (26–50) - every 3–5 levels
  (28, 'Respected Soldier', 3500, 10000),
  (30, 'Territory Controller', 4000, 11000),
  (32, 'Crew Leader', 4800, 12000),
  (35, 'Operations Manager', 6300, 13000),
  (38, 'Street Captain', 8000, 14000),
  (40, 'Lieutenant Material', 10000, 15000),
  (42, 'Business Partner', 12200, 16000),
  (45, 'Vice Coordinator', 15500, 17000),
  (48, 'Regional Enforcer', 19000, 18000),
  (50, 'Family Advisor', 22800, 19000),

  -- Elite progression (51–100) - only major levels
  (55, 'Capo Candidate', 27800, 20000),
  (60, 'Junior Capo', 33800, 22500),
  (65, 'District Manager', 40800, 27500),
  (70, 'Family Enforcer', 48800, 32500),
  (75, 'Operations Chief', 57800, 37500),
  (80, 'Senior Capo', 67800, 45000),
  (85, 'Regional Boss', 78800, 52500),
  (90, 'Underboss Material', 90800, 60000),
  (95, 'Family Consigliere', 103800, 67500),
  (100, 'Territory Don', 117800, 77500),

  -- Legendary progression (100+)
  (110, 'Vice Lieutenant', 137800, 87500),
  (125, 'Don Candidate', 167800, 97500),
  (150, 'Family Don', 217800, 122500),
  (175, 'Commission Member', 278000, 147500),
  (200, 'Regional Kingpin', 338000, 172500),
  (225, 'Criminal Empire', 408000, 197500),
  (250, 'Crime Lord', 488000, 222500),
  (275, 'Shadow Government', 578000, 247500),
  (300, 'Global Syndicate', 678000, 272500),
  (350, 'Underworld Emperor', 788000, 297500),
  (400, 'Criminal Legend', 908000, 322500),
  (450, 'Criminal Mastermind', 1038000, 347500),
  (500, 'Mythical Boss', 1178000, 397500),
  (600, 'Crime Deity', 1678000, 472500),
  (750, 'Underworld God', 2178000, 597500);

-- Enable RLS
ALTER TABLE public.level_ranks ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read level ranks
CREATE POLICY "Anyone can view level ranks" ON public.level_ranks
  FOR SELECT USING (true);

-- Function to get level rank by level
CREATE OR REPLACE FUNCTION public.get_level_rank(player_level INTEGER)
RETURNS TABLE (
  level INTEGER,
  title VARCHAR(100),
  xp_required INTEGER,
  money_reward INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT lr.level, lr.title, lr.xp_required, lr.money_reward
  FROM public.level_ranks lr
  WHERE lr.level <= player_level
  ORDER BY lr.level DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next level rank milestone
CREATE OR REPLACE FUNCTION public.get_next_level_rank(player_level INTEGER)
RETURNS TABLE (
  level INTEGER,
  title VARCHAR(100),
  xp_required INTEGER,
  money_reward INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT lr.level, lr.title, lr.xp_required, lr.money_reward
  FROM public.level_ranks lr
  WHERE lr.level > player_level
  ORDER BY lr.level ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all level ranks for display
CREATE OR REPLACE FUNCTION public.get_all_level_ranks()
RETURNS TABLE (
  level INTEGER,
  title VARCHAR(100),
  xp_required INTEGER,
  money_reward INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT lr.level, lr.title, lr.xp_required, lr.money_reward
  FROM public.level_ranks lr
  ORDER BY lr.level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
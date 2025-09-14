-- Fix stat points system - Add missing columns and tables
-- This script fixes the issues with stat point allocation

-- 1. Add missing stat points columns to player_economics table
ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS unspent_stat_points INTEGER DEFAULT 0;

ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS allocated_health_points INTEGER DEFAULT 0;

ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS allocated_energy_points INTEGER DEFAULT 0;

ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS allocated_attack_points INTEGER DEFAULT 0;

ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS allocated_defense_points INTEGER DEFAULT 0;

-- 2. Create player_activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.player_activity_log (
  id UUID DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  money_change INTEGER DEFAULT 0,
  experience_change INTEGER DEFAULT 0,
  reputation_change INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- 3. Add RLS policy for activity log
ALTER TABLE public.player_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity log" ON public.player_activity_log;
CREATE POLICY "Users can view own activity log" ON public.player_activity_log
  FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "System can insert activity log" ON public.player_activity_log;
CREATE POLICY "System can insert activity log" ON public.player_activity_log
  FOR INSERT WITH CHECK (true);

-- 4. Create or replace the allocate_stat_points function (fixed version)
CREATE OR REPLACE FUNCTION allocate_stat_points(
  player_uuid UUID,
  health_points INTEGER DEFAULT 0,
  energy_points INTEGER DEFAULT 0,
  attack_points INTEGER DEFAULT 0,
  defense_points INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  current_unspent INTEGER;
  total_to_allocate INTEGER;
  result JSON;
  economics_exists BOOLEAN;
BEGIN
  -- Calculate total points being allocated
  total_to_allocate := health_points + energy_points + attack_points + defense_points;

  -- Validate input
  IF total_to_allocate <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No stat points to allocate');
  END IF;

  -- Check if player_economics record exists, create if not
  SELECT EXISTS(
    SELECT 1 FROM player_economics WHERE player_id = player_uuid
  ) INTO economics_exists;

  IF NOT economics_exists THEN
    -- Create economics record with defaults
    INSERT INTO player_economics (player_id, unspent_stat_points)
    VALUES (player_uuid, 0);
    current_unspent := 0;
  ELSE
    -- Get current unspent stat points
    SELECT COALESCE(unspent_stat_points, 0) INTO current_unspent
    FROM player_economics
    WHERE player_id = player_uuid;
  END IF;

  -- Check if player has enough unspent points
  IF current_unspent < total_to_allocate THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not enough stat points. Have: ' || current_unspent || ', Need: ' || total_to_allocate
    );
  END IF;

  -- Update player_economics with allocated points
  UPDATE player_economics
  SET
    unspent_stat_points = unspent_stat_points - total_to_allocate,
    allocated_health_points = COALESCE(allocated_health_points, 0) + health_points,
    allocated_energy_points = COALESCE(allocated_energy_points, 0) + energy_points,
    allocated_attack_points = COALESCE(allocated_attack_points, 0) + attack_points,
    allocated_defense_points = COALESCE(allocated_defense_points, 0) + defense_points,
    updated_at = NOW()
  WHERE player_id = player_uuid;

  -- Log the allocation (optional, with error handling)
  BEGIN
    INSERT INTO player_activity_log (
      player_id,
      activity_type,
      description,
      money_change,
      created_at
    ) VALUES (
      player_uuid,
      'stat_allocation',
      'Allocated ' || total_to_allocate || ' stat points - Health: +' || health_points || ', Energy: +' || energy_points || ', Attack: +' || attack_points || ', Defense: +' || defense_points,
      0,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Continue even if logging fails
    NULL;
  END;

  -- Prepare result
  result := json_build_object(
    'success', true,
    'points_allocated', total_to_allocate,
    'health_points', health_points,
    'energy_points', energy_points,
    'attack_points', attack_points,
    'defense_points', defense_points,
    'remaining_points', current_unspent - total_to_allocate
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant necessary permissions
GRANT ALL ON public.player_activity_log TO authenticated;
GRANT ALL ON public.player_economics TO authenticated;

-- 6. Update existing players to have some stat points based on their experience
UPDATE public.player_economics
SET unspent_stat_points = GREATEST(0, COALESCE(experience_points, 0) / 100)
WHERE unspent_stat_points = 0 OR unspent_stat_points IS NULL;

-- 7. Add constraints to ensure non-negative values
ALTER TABLE public.player_economics
DROP CONSTRAINT IF EXISTS check_unspent_stat_points_non_negative;

ALTER TABLE public.player_economics
ADD CONSTRAINT check_unspent_stat_points_non_negative
CHECK (unspent_stat_points >= 0);

ALTER TABLE public.player_economics
DROP CONSTRAINT IF EXISTS check_allocated_health_points_non_negative;

ALTER TABLE public.player_economics
ADD CONSTRAINT check_allocated_health_points_non_negative
CHECK (allocated_health_points >= 0);

ALTER TABLE public.player_economics
DROP CONSTRAINT IF EXISTS check_allocated_energy_points_non_negative;

ALTER TABLE public.player_economics
ADD CONSTRAINT check_allocated_energy_points_non_negative
CHECK (allocated_energy_points >= 0);

ALTER TABLE public.player_economics
DROP CONSTRAINT IF EXISTS check_allocated_attack_points_non_negative;

ALTER TABLE public.player_economics
ADD CONSTRAINT check_allocated_attack_points_non_negative
CHECK (allocated_attack_points >= 0);

ALTER TABLE public.player_economics
DROP CONSTRAINT IF EXISTS check_allocated_defense_points_non_negative;

ALTER TABLE public.player_economics
ADD CONSTRAINT check_allocated_defense_points_non_negative
CHECK (allocated_defense_points >= 0);
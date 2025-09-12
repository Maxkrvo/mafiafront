-- Level System Database Functions
-- Provides server-side level calculations and level-based benefits

-- Function to calculate player level from experience points
CREATE OR REPLACE FUNCTION public.calculate_player_level(experience_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level = floor(sqrt(XP / 100)), minimum level 1
  IF experience_points <= 0 THEN
    RETURN 1;
  END IF;
  
  RETURN GREATEST(1, FLOOR(SQRT(experience_points::FLOAT / 100)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate XP required for a specific level
CREATE OR REPLACE FUNCTION public.get_xp_for_level(target_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- XP = level^2 * 100
  IF target_level <= 1 THEN
    RETURN 0;
  END IF;
  
  RETURN target_level * target_level * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get level benefits (stat bonuses)
CREATE OR REPLACE FUNCTION public.calculate_level_benefits(player_level INTEGER)
RETURNS JSONB AS $$
DECLARE
  base_bonus INTEGER;
  milestone_bonus INTEGER;
  energy_bonus INTEGER;
  hp_bonus INTEGER;
BEGIN
  -- Each level gives +1 to attack/defense, with milestone bonuses every 10 levels
  base_bonus := GREATEST(0, player_level - 1);
  milestone_bonus := (player_level / 10) * 5;
  energy_bonus := (player_level / 5) * 5;
  hp_bonus := (player_level / 5) * 5;
  
  RETURN jsonb_build_object(
    'attack_bonus', base_bonus + milestone_bonus,
    'defense_bonus', base_bonus + milestone_bonus,
    'energy_bonus', energy_bonus,
    'hp_bonus', hp_bonus
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get comprehensive player level info
CREATE OR REPLACE FUNCTION public.get_player_level_info(player_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  economics_record public.player_economics%ROWTYPE;
  current_level INTEGER;
  xp_for_current INTEGER;
  xp_for_next INTEGER;
  xp_to_next INTEGER;
  progress FLOAT;
  benefits JSONB;
BEGIN
  -- Get player economics data
  SELECT * INTO economics_record FROM public.player_economics WHERE player_id = player_uuid;
  
  IF NOT FOUND THEN
    -- Return default level 1 info if no economics record
    RETURN jsonb_build_object(
      'level', 1,
      'current_xp', 0,
      'xp_to_next', 100,
      'xp_for_current_level', 0,
      'progress', 0.0,
      'benefits', calculate_level_benefits(1)
    );
  END IF;
  
  -- Calculate level information
  current_level := public.calculate_player_level(economics_record.experience_points);
  xp_for_current := public.get_xp_for_level(current_level);
  xp_for_next := public.get_xp_for_level(current_level + 1);
  xp_to_next := xp_for_next - economics_record.experience_points;
  
  -- Calculate progress (0.0 to 1.0)
  IF xp_for_next > xp_for_current THEN
    progress := (economics_record.experience_points - xp_for_current)::FLOAT / (xp_for_next - xp_for_current)::FLOAT;
  ELSE
    progress := 1.0;
  END IF;
  
  -- Get level benefits
  benefits := public.calculate_level_benefits(current_level);
  
  RETURN jsonb_build_object(
    'level', current_level,
    'current_xp', economics_record.experience_points,
    'xp_to_next', xp_to_next,
    'xp_for_current_level', xp_for_current,
    'progress', GREATEST(0.0, LEAST(1.0, progress)),
    'benefits', benefits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rank advancement eligibility
CREATE OR REPLACE FUNCTION public.check_rank_advancement(player_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  player_record public.players%ROWTYPE;
  economics_record public.player_economics%ROWTYPE;
  current_level INTEGER;
  can_advance BOOLEAN := false;
  next_rank VARCHAR(20);
  requirements TEXT;
BEGIN
  -- Get player data
  SELECT * INTO player_record FROM public.players WHERE id = player_uuid;
  SELECT * INTO economics_record FROM public.player_economics WHERE player_id = player_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_advance', false, 'error', 'Player not found');
  END IF;
  
  current_level := public.calculate_player_level(COALESCE(economics_record.experience_points, 0));
  
  -- Check advancement requirements based on current rank
  CASE player_record.rank
    WHEN 'Associate' THEN
      next_rank := 'Soldier';
      can_advance := current_level >= 10 AND player_record.reputation_score >= 500;
      IF NOT can_advance THEN
        requirements := 'Requires Level 10 and 500 reputation';
      END IF;
      
    WHEN 'Soldier' THEN
      next_rank := 'Capo';
      can_advance := current_level >= 25 AND player_record.reputation_score >= 2000;
      IF NOT can_advance THEN
        requirements := 'Requires Level 25 and 2,000 reputation';
      END IF;
      
    WHEN 'Capo' THEN
      next_rank := 'Don';
      can_advance := current_level >= 50 AND player_record.reputation_score >= 10000;
      IF NOT can_advance THEN
        requirements := 'Requires Level 50 and 10,000 reputation';
      END IF;
      
    WHEN 'Don' THEN
      -- Max rank reached
      RETURN jsonb_build_object('can_advance', false, 'message', 'Maximum rank achieved');
      
    ELSE
      RETURN jsonb_build_object('can_advance', false, 'error', 'Invalid rank');
  END CASE;
  
  RETURN jsonb_build_object(
    'can_advance', can_advance,
    'next_rank', next_rank,
    'current_level', current_level,
    'current_reputation', player_record.reputation_score,
    'requirements', requirements
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to advance player rank (if eligible)
CREATE OR REPLACE FUNCTION public.advance_player_rank(player_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  advancement_check JSONB;
  next_rank VARCHAR(20);
BEGIN
  -- Check if advancement is possible
  advancement_check := public.check_rank_advancement(player_uuid);
  
  IF NOT (advancement_check->>'can_advance')::BOOLEAN THEN
    RETURN advancement_check;
  END IF;
  
  next_rank := advancement_check->>'next_rank';
  
  -- Update player rank
  UPDATE public.players 
  SET 
    rank = next_rank,
    updated_at = NOW()
  WHERE id = player_uuid;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_rank', next_rank,
    'message', 'Congratulations! You have been promoted to ' || next_rank
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for player levels (for easy querying)
CREATE OR REPLACE VIEW public.player_levels AS
SELECT 
  p.id,
  p.nickname,
  p.rank,
  p.reputation_score,
  COALESCE(pe.experience_points, 0) as experience_points,
  public.calculate_player_level(COALESCE(pe.experience_points, 0)) as level,
  public.get_xp_for_level(public.calculate_player_level(COALESCE(pe.experience_points, 0))) as xp_for_current_level,
  public.get_xp_for_level(public.calculate_player_level(COALESCE(pe.experience_points, 0)) + 1) as xp_for_next_level,
  public.calculate_level_benefits(public.calculate_player_level(COALESCE(pe.experience_points, 0))) as level_benefits
FROM public.players p
LEFT JOIN public.player_economics pe ON p.id = pe.player_id;

-- Enable RLS on the view
ALTER VIEW public.player_levels SET (security_barrier = true);

-- Note: RLS policies are not supported on views. 
-- The view inherits security from the underlying tables (players and player_economics)

-- Update the calculate_attack_power function to include level bonuses
CREATE OR REPLACE FUNCTION public.calculate_attack_power(player_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  base_attack INTEGER := 10;
  equipment_bonus INTEGER := 0;
  level_bonus INTEGER := 0;
  player_level INTEGER;
  level_benefits JSONB;
BEGIN
  -- Get equipment bonus from equipped items
  SELECT COALESCE(SUM(it.attack_power), 0) INTO equipment_bonus
  FROM public.player_inventory pi
  JOIN public.item_templates it ON pi.item_template_id = it.id
  WHERE pi.player_id = player_uuid AND pi.is_equipped = true;
  
  -- Get level bonus
  SELECT COALESCE(pe.experience_points, 0) INTO player_level
  FROM public.player_economics pe 
  WHERE pe.player_id = player_uuid;
  
  IF player_level IS NOT NULL THEN
    player_level := public.calculate_player_level(player_level);
    level_benefits := public.calculate_level_benefits(player_level);
    level_bonus := (level_benefits->>'attack_bonus')::INTEGER;
  END IF;
  
  RETURN base_attack + equipment_bonus + level_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the calculate_defense_power function to include level bonuses
CREATE OR REPLACE FUNCTION public.calculate_defense_power(player_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  base_defense INTEGER := 10;
  equipment_bonus INTEGER := 0;
  level_bonus INTEGER := 0;
  player_level INTEGER;
  level_benefits JSONB;
BEGIN
  -- Get equipment bonus from equipped items
  SELECT COALESCE(SUM(it.defense_power), 0) INTO equipment_bonus
  FROM public.player_inventory pi
  JOIN public.item_templates it ON pi.item_template_id = it.id
  WHERE pi.player_id = player_uuid AND pi.is_equipped = true;
  
  -- Get level bonus
  SELECT COALESCE(pe.experience_points, 0) INTO player_level
  FROM public.player_economics pe 
  WHERE pe.player_id = player_uuid;
  
  IF player_level IS NOT NULL THEN
    player_level := public.calculate_player_level(player_level);
    level_benefits := public.calculate_level_benefits(player_level);
    level_bonus := (level_benefits->>'defense_bonus')::INTEGER;
  END IF;
  
  RETURN base_defense + equipment_bonus + level_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update player max stats based on level
CREATE OR REPLACE FUNCTION public.update_player_level_stats(player_uuid UUID)
RETURNS void AS $$
DECLARE
  player_level INTEGER;
  level_benefits JSONB;
  energy_bonus INTEGER;
  hp_bonus INTEGER;
BEGIN
  -- Get current level
  SELECT public.calculate_player_level(COALESCE(pe.experience_points, 0))
  INTO player_level
  FROM public.player_economics pe 
  WHERE pe.player_id = player_uuid;
  
  IF player_level IS NULL THEN
    player_level := 1;
  END IF;
  
  -- Get level benefits
  level_benefits := public.calculate_level_benefits(player_level);
  energy_bonus := (level_benefits->>'energy_bonus')::INTEGER;
  hp_bonus := (level_benefits->>'hp_bonus')::INTEGER;
  
  -- Update player max stats (base 100 + level bonus)
  UPDATE public.players 
  SET 
    max_energy = 100 + energy_bonus,
    max_hp = 100 + hp_bonus,
    updated_at = NOW()
  WHERE id = player_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update level-based stats when experience changes
CREATE OR REPLACE FUNCTION public.handle_experience_change()
RETURNS trigger AS $$
BEGIN
  -- Update player level-based stats when experience changes
  PERFORM public.update_player_level_stats(NEW.player_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to player_economics table for experience updates
DROP TRIGGER IF EXISTS update_level_stats_on_xp_change ON public.player_economics;
CREATE TRIGGER update_level_stats_on_xp_change
  AFTER UPDATE OF experience_points ON public.player_economics
  FOR EACH ROW 
  WHEN (OLD.experience_points IS DISTINCT FROM NEW.experience_points)
  EXECUTE FUNCTION public.handle_experience_change();

-- Note: Views cannot be added to realtime publications.
-- To get realtime updates for player levels, subscribe to the underlying tables:
-- - public.players (for rank, reputation changes)  
-- - public.player_economics (for experience_points changes)
-- SQL function to allocate stat points
-- This should be created in your Supabase database

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
BEGIN
  -- Calculate total points being allocated
  total_to_allocate := health_points + energy_points + attack_points + defense_points;

  -- Validate input
  IF total_to_allocate <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No stat points to allocate');
  END IF;

  -- Get current unspent stat points
  SELECT COALESCE(unspent_stat_points, 0) INTO current_unspent
  FROM player_economics
  WHERE player_id = player_uuid;

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
    allocated_defense_points = COALESCE(allocated_defense_points, 0) + defense_points
  WHERE player_id = player_uuid;

  -- Log the allocation
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
-- SQL function to grant level-up rewards to players
-- This should be created in your Supabase database

CREATE OR REPLACE FUNCTION grant_level_reward(
  player_uuid UUID,
  money_reward INTEGER,
  stat_points_earned INTEGER,
  levels_gained INTEGER,
  new_level INTEGER
)
RETURNS JSON AS $$
DECLARE
  current_cash INTEGER;
  result JSON;
BEGIN
  -- Get current cash from player_economics
  SELECT cash_on_hand INTO current_cash
  FROM player_economics
  WHERE player_id = player_uuid;

  -- If no economics record exists, create one
  IF current_cash IS NULL THEN
    INSERT INTO player_economics (player_id, cash_on_hand, total_earned, unspent_stat_points)
    VALUES (player_uuid, money_reward, money_reward, stat_points_earned)
    ON CONFLICT (player_id)
    DO UPDATE SET
      cash_on_hand = player_economics.cash_on_hand + money_reward,
      total_earned = player_economics.total_earned + money_reward,
      unspent_stat_points = COALESCE(player_economics.unspent_stat_points, 0) + stat_points_earned;
  ELSE
    -- Update existing record
    UPDATE player_economics
    SET
      cash_on_hand = cash_on_hand + money_reward,
      total_earned = total_earned + money_reward,
      unspent_stat_points = COALESCE(unspent_stat_points, 0) + stat_points_earned
    WHERE player_id = player_uuid;
  END IF;

  -- Log the level-up event
  INSERT INTO player_activity_log (
    player_id,
    activity_type,
    description,
    money_change,
    created_at
  ) VALUES (
    player_uuid,
    'level_up',
    'Leveled up to level ' || new_level || ' (gained ' || levels_gained || ' levels) - Earned $' || money_reward || ' and ' || stat_points_earned || ' stat points',
    money_reward,
    NOW()
  );

  -- Prepare result
  result := json_build_object(
    'success', true,
    'money_earned', money_reward,
    'stat_points_earned', stat_points_earned,
    'new_level', new_level,
    'levels_gained', levels_gained
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
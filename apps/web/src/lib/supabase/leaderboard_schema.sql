-- Leaderboard views for different rankings

-- Overall Reputation Leaderboard
CREATE OR REPLACE VIEW public.reputation_leaderboard AS
SELECT 
  p.id,
  p.nickname,
  p.username,
  p.rank,
  p.reputation_score,
  p.avatar_url,
  ps.total_games,
  ps.games_won,
  ps.survival_rate,
  ps.total_eliminations,
  ROW_NUMBER() OVER (ORDER BY p.reputation_score DESC) as position
FROM public.players p
LEFT JOIN public.player_stats ps ON p.id = ps.player_id
WHERE p.reputation_score > 0 OR ps.total_games > 0
ORDER BY p.reputation_score DESC, ps.games_won DESC
LIMIT 100;

-- Elimination Leaders (Most Eliminations)
CREATE OR REPLACE VIEW public.elimination_leaderboard AS
SELECT 
  p.id,
  p.nickname,
  p.username,
  p.rank,
  p.reputation_score,
  p.avatar_url,
  ps.total_games,
  ps.games_won,
  ps.survival_rate,
  ps.total_eliminations,
  ps.times_eliminated,
  CASE 
    WHEN ps.total_games > 0 THEN ROUND((ps.total_eliminations::DECIMAL / ps.total_games::DECIMAL), 2)
    ELSE 0 
  END as eliminations_per_game,
  ROW_NUMBER() OVER (ORDER BY ps.total_eliminations DESC, ps.games_won DESC) as position
FROM public.players p
LEFT JOIN public.player_stats ps ON p.id = ps.player_id
WHERE ps.total_eliminations > 0
ORDER BY ps.total_eliminations DESC, ps.games_won DESC
LIMIT 100;

-- Survival Rate Leaders (Best Survival Rate with minimum games)
CREATE OR REPLACE VIEW public.survival_leaderboard AS
SELECT 
  p.id,
  p.nickname,
  p.username,
  p.rank,
  p.reputation_score,
  p.avatar_url,
  ps.total_games,
  ps.games_won,
  ps.survival_rate,
  ps.total_eliminations,
  ps.times_eliminated,
  ps.longest_survival_streak,
  ps.current_streak,
  ROW_NUMBER() OVER (ORDER BY ps.survival_rate DESC, ps.games_won DESC, ps.longest_survival_streak DESC) as position
FROM public.players p
LEFT JOIN public.player_stats ps ON p.id = ps.player_id
WHERE ps.total_games >= 3 AND ps.survival_rate > 0
ORDER BY ps.survival_rate DESC, ps.games_won DESC, ps.longest_survival_streak DESC
LIMIT 100;

-- Win Rate Leaders
CREATE OR REPLACE VIEW public.winrate_leaderboard AS
SELECT 
  p.id,
  p.nickname,
  p.username,
  p.rank,
  p.reputation_score,
  p.avatar_url,
  ps.total_games,
  ps.games_won,
  ps.games_lost,
  ps.survival_rate,
  ps.total_eliminations,
  CASE 
    WHEN ps.total_games > 0 THEN ROUND((ps.games_won::DECIMAL / ps.total_games::DECIMAL) * 100, 1)
    ELSE 0 
  END as win_rate,
  ROW_NUMBER() OVER (
    ORDER BY 
      CASE WHEN ps.total_games > 0 THEN (ps.games_won::DECIMAL / ps.total_games::DECIMAL) * 100 ELSE 0 END DESC,
      ps.games_won DESC
  ) as position
FROM public.players p
LEFT JOIN public.player_stats ps ON p.id = ps.player_id
WHERE ps.total_games >= 3 AND ps.games_won > 0
ORDER BY 
  CASE WHEN ps.total_games > 0 THEN (ps.games_won::DECIMAL / ps.total_games::DECIMAL) * 100 ELSE 0 END DESC,
  ps.games_won DESC
LIMIT 100;

-- Most Active Players (by total games)
CREATE OR REPLACE VIEW public.activity_leaderboard AS
SELECT 
  p.id,
  p.nickname,
  p.username,
  p.rank,
  p.reputation_score,
  p.avatar_url,
  ps.total_games,
  ps.games_won,
  ps.survival_rate,
  ps.total_eliminations,
  ps.energy_spent,
  ps.total_damage_dealt,
  ps.total_healing_done,
  ROW_NUMBER() OVER (ORDER BY ps.total_games DESC, ps.games_won DESC) as position
FROM public.players p
LEFT JOIN public.player_stats ps ON p.id = ps.player_id
WHERE ps.total_games > 0
ORDER BY ps.total_games DESC, ps.games_won DESC
LIMIT 100;

-- Hall of Fame (Top performers across multiple categories)
CREATE OR REPLACE VIEW public.hall_of_fame AS
SELECT DISTINCT
  p.id,
  p.nickname,
  p.username,
  p.rank,
  p.reputation_score,
  p.avatar_url,
  ps.total_games,
  ps.games_won,
  ps.survival_rate,
  ps.total_eliminations,
  ps.longest_survival_streak,
  CASE 
    WHEN ps.total_games > 0 THEN ROUND((ps.games_won::DECIMAL / ps.total_games::DECIMAL) * 100, 1)
    ELSE 0 
  END as win_rate
FROM public.players p
LEFT JOIN public.player_stats ps ON p.id = ps.player_id
WHERE (
  -- Top 10 in reputation
  p.reputation_score >= (
    SELECT MIN(reputation_score) FROM (
      SELECT reputation_score FROM public.players ORDER BY reputation_score DESC LIMIT 10
    ) top_rep
  )
  OR 
  -- Top 10 in eliminations
  ps.total_eliminations >= (
    SELECT MIN(total_eliminations) FROM (
      SELECT total_eliminations FROM public.player_stats WHERE total_eliminations > 0 ORDER BY total_eliminations DESC LIMIT 10
    ) top_elim
  )
  OR 
  -- Top 10 in survival rate (min 5 games)
  (ps.total_games >= 5 AND ps.survival_rate >= (
    SELECT MIN(survival_rate) FROM (
      SELECT survival_rate FROM public.player_stats WHERE total_games >= 5 ORDER BY survival_rate DESC LIMIT 10
    ) top_survival
  ))
)
ORDER BY p.reputation_score DESC, ps.games_won DESC
LIMIT 50;

-- Function to get player ranking in specific category
CREATE OR REPLACE FUNCTION public.get_player_ranking(
  player_uuid UUID,
  category VARCHAR(50)
)
RETURNS TABLE(
  player_position INTEGER,
  total_players INTEGER
) AS $$
BEGIN
  CASE category
    WHEN 'reputation' THEN
      RETURN QUERY
      SELECT 
        COALESCE(rl.position::INTEGER, 0) as player_position,
        (SELECT COUNT(*)::INTEGER FROM public.reputation_leaderboard) as total_players
      FROM public.reputation_leaderboard rl
      WHERE rl.id = player_uuid;
    
    WHEN 'eliminations' THEN
      RETURN QUERY
      SELECT 
        COALESCE(el.position::INTEGER, 0) as player_position,
        (SELECT COUNT(*)::INTEGER FROM public.elimination_leaderboard) as total_players
      FROM public.elimination_leaderboard el
      WHERE el.id = player_uuid;
    
    WHEN 'survival' THEN
      RETURN QUERY
      SELECT 
        COALESCE(sl.position::INTEGER, 0) as player_position,
        (SELECT COUNT(*)::INTEGER FROM public.survival_leaderboard) as total_players
      FROM public.survival_leaderboard sl
      WHERE sl.id = player_uuid;
    
    ELSE
      RETURN QUERY
      SELECT 0::INTEGER as player_position, 0::INTEGER as total_players;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
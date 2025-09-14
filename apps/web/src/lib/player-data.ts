'use client';

import { supabase } from './supabase/client';
import { PlayerStats } from './supabase/types';
import { PlayerStatPoints, StatPointAllocation } from './stat-points';

// Type for either regular supabase client or authenticated client
type SupabaseClientType = typeof supabase | any;

/**
 * Fetch player stats from the database
 */
export async function fetchPlayerStats(playerId: string): Promise<PlayerStats | null> {
  try {
    const { data, error } = await supabase
      .from("player_stats")
      .select("*")
      .eq("player_id", playerId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching player stats:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching stats:", error);
    return null;
  }
}

/**
 * Fetch player stat points and allocation data
 */
export async function fetchPlayerStatPoints(playerId: string, authSupabase: SupabaseClientType = supabase): Promise<PlayerStatPoints> {
  try {
    const { data, error } = (await authSupabase
      .from("player_economics")
      .select(
        "unspent_stat_points, allocated_health_points, allocated_energy_points, allocated_attack_points, allocated_defense_points"
      )
      .eq("player_id", playerId)
      .single()) as {
      data: {
        unspent_stat_points: number | null;
        allocated_health_points: number | null;
        allocated_energy_points: number | null;
        allocated_attack_points: number | null;
        allocated_defense_points: number | null;
      } | null;
      error: { code?: string; message?: string } | null;
    };

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching stat points:", error);
      return {
        unspent: 0,
        allocated: { health: 0, energy: 0, attack: 0, defense: 0 },
        totalEarned: 0,
      };
    }

    if (!data) {
      return {
        unspent: 0,
        allocated: { health: 0, energy: 0, attack: 0, defense: 0 },
        totalEarned: 0,
      };
    }

    return {
      unspent: data.unspent_stat_points || 0,
      allocated: {
        health: data.allocated_health_points || 0,
        energy: data.allocated_energy_points || 0,
        attack: data.allocated_attack_points || 0,
        defense: data.allocated_defense_points || 0,
      },
      totalEarned:
        (data.unspent_stat_points || 0) +
        (data.allocated_health_points || 0) +
        (data.allocated_energy_points || 0) +
        (data.allocated_attack_points || 0) +
        (data.allocated_defense_points || 0),
    };
  } catch (error) {
    console.error("Unexpected error fetching stat points:", error);
    return {
      unspent: 0,
      allocated: { health: 0, energy: 0, attack: 0, defense: 0 },
      totalEarned: 0,
    };
  }
}

/**
 * Allocate stat points for a player
 */
export async function allocateStatPoints(
  playerId: string,
  allocation: StatPointAllocation,
  authSupabase: SupabaseClientType = supabase
): Promise<boolean> {
  try {
    const { data, error } = await authSupabase.rpc("allocate_stat_points", {
      player_uuid: playerId,
      health_points: allocation.health,
      energy_points: allocation.energy,
      attack_points: allocation.attack,
      defense_points: allocation.defense,
    });

    if (error) {
      console.error("Error allocating stat points:", error);
      return false;
    }

    if (data && data.success) {
      console.log("✅ Stat points allocated successfully:", data);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Unexpected error allocating stat points:", error);
    return false;
  }
}

/**
 * Combined function to fetch all player data needed for dashboard
 */
export async function fetchPlayerDashboardData(playerId: string, authSupabase: SupabaseClientType = supabase): Promise<{
  stats: PlayerStats | null;
  statPoints: PlayerStatPoints;
}> {
  const [stats, statPoints] = await Promise.all([
    fetchPlayerStats(playerId),
    fetchPlayerStatPoints(playerId, authSupabase)
  ]);

  return { stats, statPoints };
}
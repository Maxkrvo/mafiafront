'use client';

import { supabase } from './supabase/client';
import { getLevelInfo, canAdvanceToRank } from './levels';
import { RankAdvancement } from './supabase/jobs-types';

/**
 * Fetch player level progression data including economics and rank advancement info
 */
export async function fetchLevelProgressionData(player: { id: string; rank: string; reputation_score: number }): Promise<{
  levelInfo: ReturnType<typeof getLevelInfo>;
  rankAdvancement: RankAdvancement;
}> {
  try {
    // Fetch player economics
    const { data: economicsData, error: economicsError } = await supabase
      .from("player_economics")
      .select("*")
      .eq("player_id", player.id)
      .single();

    if (economicsError && economicsError.code !== "PGRST116") {
      console.error("Error fetching economics:", economicsError);
      throw economicsError;
    }

    // Default economics if not found
    const economics = economicsData || {
      player_id: player.id,
      experience_points: 0,
      cash_on_hand: 0,
      total_earned: 0,
      total_spent: 0,
      heat_level: 0,
      territory_owned: 0,
      attack_power: 10,
      defense_power: 10,
      last_job_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Calculate level info
    const levelInfo = getLevelInfo(economics.experience_points || 0);

    // Check rank advancement
    const advancement = canAdvanceToRank(
      player.rank,
      levelInfo.level,
      player.reputation_score
    );

    const rankAdvancement: RankAdvancement = {
      canAdvance: advancement.canAdvance,
      nextRank: advancement.nextRank,
      requirements: advancement.requirements,
      currentLevel: levelInfo.level,
      currentReputation: player.reputation_score,
    };

    return { levelInfo, rankAdvancement };
  } catch (error) {
    console.error("Error fetching level progression data:", error);
    throw error;
  }
}

/**
 * Advance player rank using the RPC function
 */
export async function advancePlayerRank(playerId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await supabase.rpc("advance_player_rank", {
      player_uuid: playerId,
    });

    if (error) throw error;

    if (data && typeof data === "object" && "success" in data && data.success) {
      return {
        success: true,
        message: "message" in data ? data.message : "Rank advanced successfully"
      };
    }

    return { success: false, message: "Failed to advance rank" };
  } catch (error) {
    console.error("Error advancing rank:", error);
    return { success: false, message: "An error occurred while advancing rank" };
  }
}
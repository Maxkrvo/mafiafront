'use client';

import { supabase } from './supabase/client';
import { JobTemplate, PlayerEconomics, JobExecutionResult } from './supabase/jobs-types';
import { getLevelInfo } from './levels';

type SupabaseClientType = typeof supabase | any;

/**
 * Fetch all job templates ordered by requirements
 */
export async function fetchJobTemplates(authSupabase: SupabaseClientType = supabase): Promise<JobTemplate[]> {
  try {
    const { data, error } = await authSupabase
      .from("job_templates")
      .select("*")
      .order("required_rank", { ascending: true })
      .order("energy_cost", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

/**
 * Fetch or create player economics data
 */
export async function fetchPlayerEconomics(playerId: string, authSupabase: SupabaseClientType = supabase): Promise<PlayerEconomics | null> {
  try {
    let { data: economicsData, error } = await authSupabase
      .from("player_economics")
      .select("*")
      .eq("player_id", playerId)
      .single();

    if (error && error.code === "PGRST116") {
      // Create economics record if it doesn't exist
      const { data: newEconomics, error: createError } = await authSupabase
        .from("player_economics")
        .insert({ player_id: playerId })
        .select("*")
        .single();

      if (createError) throw createError;
      economicsData = newEconomics;
    } else if (error) {
      throw error;
    }

    return economicsData;
  } catch (error) {
    console.error("Error fetching player economics:", error);
    return null;
  }
}

/**
 * Fetch jobs and economics data together for jobs page
 */
export async function fetchJobsPageData(playerId: string, authSupabase: SupabaseClientType = supabase): Promise<{
  jobs: JobTemplate[];
  economics: PlayerEconomics | null;
  levelInfo: ReturnType<typeof getLevelInfo>;
}> {
  const [jobs, economics] = await Promise.all([
    fetchJobTemplates(authSupabase),
    fetchPlayerEconomics(playerId, authSupabase)
  ]);

  // Calculate level info from experience points
  let levelInfo;
  if (economics && "experience_points" in economics) {
    const xp = typeof economics.experience_points === "number" ? economics.experience_points : 0;
    levelInfo = getLevelInfo(xp);
  } else {
    levelInfo = getLevelInfo(0);
  }

  return { jobs, economics, levelInfo };
}

/**
 * Execute a job with the given template ID
 */
export async function executeJobWithLoot(
  jobTemplateId: string,
  playerId: string,
  executeRpc: (fnName: string, params: any) => Promise<{ data: any; error: any }>
): Promise<JobExecutionResult | null> {
  try {
    const { data, error } = await executeRpc("execute_job_with_loot", {
      job_template_uuid: jobTemplateId,
      player_uuid: playerId,
    });

    if (error) throw error;
    return data as JobExecutionResult;
  } catch (error) {
    console.error("Error executing job:", error);
    return {
      success: false,
      error: "Failed to execute job. Please try again.",
    };
  }
}

/**
 * Fetch loot details for items received from job execution
 */
export async function fetchLootDetails(
  lootItems: { item_template_id: string; quantity: number }[],
  authSupabase: SupabaseClientType = supabase
): Promise<any[]> {
  if (lootItems.length === 0) return [];

  try {
    const lootIds = lootItems.map((item) => item.item_template_id);
    const { data: lootData } = await authSupabase
      .from("item_templates")
      .select("*")
      .in("id", lootIds);

    // Combine loot data with quantities
    return lootItems
      .map((lootItem) => {
        const template = lootData?.find((t) => t.id === lootItem.item_template_id);
        return {
          ...template,
          quantity: lootItem.quantity,
        };
      })
      .filter((item) => item.id); // Filter out items where template wasn't found
  } catch (error) {
    console.error("Error fetching loot details:", error);
    return [];
  }
}

/**
 * Check if a job is available to a player
 */
export function isJobAvailable(
  job: JobTemplate,
  player: { energy: number; rank: string },
  economics: PlayerEconomics | null
): boolean {
  if (!economics) return false;

  const rankOrder = ["Associate", "Soldier", "Capo", "Don"];
  const playerRankIndex = rankOrder.indexOf(player.rank);
  const jobRankIndex = rankOrder.indexOf(job.required_rank);

  return (
    player.energy >= job.energy_cost &&
    playerRankIndex >= jobRankIndex &&
    economics.attack_power >= job.required_attack_power &&
    economics.defense_power >= job.required_defense_power
  );
}

/**
 * Check if a player meets the requirements for a job (excluding energy)
 */
export function meetsJobRequirements(
  job: JobTemplate,
  player: { rank: string },
  economics: PlayerEconomics | null
): boolean {
  if (!economics) return false;

  const rankOrder = ["Associate", "Soldier", "Capo", "Don"];
  const playerRankIndex = rankOrder.indexOf(player.rank);
  const jobRankIndex = rankOrder.indexOf(job.required_rank);

  return (
    playerRankIndex >= jobRankIndex &&
    economics.attack_power >= job.required_attack_power &&
    economics.defense_power >= job.required_defense_power
  );
}
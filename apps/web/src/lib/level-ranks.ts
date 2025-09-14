'use client';

import { authenticatedSupabase } from '@/lib/supabase/authenticated-client';

export interface LevelRank {
  level: number;
  title: string;
  xp_required: number;
  money_reward: number;
}

/**
 * Get the current level rank title for a player's level
 */
export async function getCurrentLevelRank(playerLevel: number): Promise<LevelRank | null> {
  try {
    const { data, error } = await authenticatedSupabase.rpc('get_level_rank', {
      player_level: playerLevel
    });

    if (error) {
      console.error('Error fetching current level rank:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Unexpected error fetching current level rank:', error);
    return null;
  }
}

/**
 * Get the next level rank milestone for a player's level
 */
export async function getNextLevelRank(playerLevel: number): Promise<LevelRank | null> {
  try {
    const { data, error } = await authenticatedSupabase.rpc('get_next_level_rank', {
      player_level: playerLevel
    });

    if (error) {
      console.error('Error fetching next level rank:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Unexpected error fetching next level rank:', error);
    return null;
  }
}

/**
 * Get all level ranks for display in UI
 */
export async function getAllLevelRanks(): Promise<LevelRank[]> {
  try {
    const { data, error } = await authenticatedSupabase.rpc('get_all_level_ranks');

    if (error) {
      console.error('Error fetching all level ranks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching all level ranks:', error);
    return [];
  }
}

/**
 * Get level rank title by level (fallback to client-side calculation if needed)
 */
export function getLevelRankTitleFallback(level: number): string {
  // This is a fallback that matches the getLevelMilestones() data
  const milestones = [
    { level: 1, title: "Street Thug" },
    { level: 2, title: "Petty Criminal" },
    { level: 4, title: "Corner Hustler" },
    { level: 6, title: "Small Time Crook" },
    { level: 8, title: "Seasoned Criminal" },
    { level: 10, title: "Gang Associate" },
    { level: 12, title: "Crew Runner" },
    { level: 14, title: "Numbers Runner" },
    { level: 16, title: "Muscle for Hire" },
    { level: 18, title: "Made Member" },
    { level: 20, title: "Family Soldier" },
    { level: 22, title: "Bookmaker" },
    { level: 24, title: "Loan Shark" },
    { level: 25, title: "Protection Racketeer" },
    { level: 28, title: "Respected Soldier" },
    { level: 30, title: "Territory Controller" },
    { level: 32, title: "Crew Leader" },
    { level: 35, title: "Operations Manager" },
    { level: 38, title: "Street Captain" },
    { level: 40, title: "Lieutenant Material" },
    { level: 42, title: "Business Partner" },
    { level: 45, title: "Vice Coordinator" },
    { level: 48, title: "Regional Enforcer" },
    { level: 50, title: "Family Advisor" },
    { level: 55, title: "Capo Candidate" },
    { level: 60, title: "Junior Capo" },
    { level: 65, title: "District Manager" },
    { level: 70, title: "Family Enforcer" },
    { level: 75, title: "Operations Chief" },
    { level: 80, title: "Senior Capo" },
    { level: 85, title: "Regional Boss" },
    { level: 90, title: "Underboss Material" },
    { level: 95, title: "Family Consigliere" },
    { level: 100, title: "Territory Don" },
    { level: 110, title: "Vice Lieutenant" },
    { level: 125, title: "Don Candidate" },
    { level: 150, title: "Family Don" },
    { level: 175, title: "Commission Member" },
    { level: 200, title: "Regional Kingpin" },
    { level: 225, title: "Criminal Empire" },
    { level: 250, title: "Crime Lord" },
    { level: 275, title: "Shadow Government" },
    { level: 300, title: "Global Syndicate" },
    { level: 350, title: "Underworld Emperor" },
    { level: 400, title: "Criminal Legend" },
    { level: 450, title: "Criminal Mastermind" },
    { level: 500, title: "Mythical Boss" },
    { level: 600, title: "Crime Deity" },
    { level: 750, title: "Underworld God" }
  ];

  // Find the highest milestone we've reached
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (level >= milestones[i].level) {
      return milestones[i].title;
    }
  }

  return "Street Thug";
}
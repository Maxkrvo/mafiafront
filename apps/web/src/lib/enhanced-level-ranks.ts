'use client';

import { authenticatedSupabase } from '@/lib/supabase/authenticated-client';

export interface EnhancedLevelRank {
  level: number;
  title: string;
  xp_required: number;
  money_reward: number;
  category: 'street' | 'family' | 'elite' | 'legendary';
  tier: number;
  icon_name?: string;
  color_hex?: string;
  is_milestone: boolean;
  min_reputation?: number;
  reputation_gap?: number; // For next rank queries
}

export interface RankCategory {
  category: string;
  total_ranks: number;
  min_level: number;
  max_level: number;
  avg_reward: number;
  milestone_count: number;
}

export interface PlayerRankStatus {
  currentRank: EnhancedLevelRank | null;
  nextRank: EnhancedLevelRank | null;
  progressToNext: number; // 0-1
  canUnlockNext: boolean;
  reputationNeeded: number;
}

/**
 * Get enhanced level rank information for a player
 */
export async function getPlayerRankStatus(
  playerLevel: number,
  currentXP: number,
  playerReputation: number = 0
): Promise<PlayerRankStatus> {
  try {
    // Get current and next ranks in parallel
    const [currentResult, nextResult] = await Promise.all([
      authenticatedSupabase.rpc('get_level_rank_enhanced', {
        player_level: playerLevel,
        player_reputation: playerReputation
      }),
      authenticatedSupabase.rpc('get_next_level_rank_enhanced', {
        player_level: playerLevel,
        player_reputation: playerReputation
      })
    ]);

    const currentRank = currentResult.data?.[0] || null;
    const nextRank = nextResult.data?.[0] || null;

    let progressToNext = 0;
    let canUnlockNext = false;
    let reputationNeeded = 0;

    if (nextRank) {
      // Calculate XP progress to next rank
      const currentRankXP = currentRank?.xp_required || 0;
      const nextRankXP = nextRank.xp_required;
      const xpGap = nextRankXP - currentRankXP;
      const xpProgress = currentXP - currentRankXP;
      progressToNext = xpGap > 0 ? Math.max(0, Math.min(1, xpProgress / xpGap)) : 0;

      // Check if can unlock (level requirement met)
      canUnlockNext = playerLevel >= nextRank.level;
      reputationNeeded = nextRank.reputation_gap || 0;
    }

    return {
      currentRank,
      nextRank,
      progressToNext,
      canUnlockNext,
      reputationNeeded
    };
  } catch (error) {
    console.error('Error fetching player rank status:', error);
    return {
      currentRank: null,
      nextRank: null,
      progressToNext: 0,
      canUnlockNext: false,
      reputationNeeded: 0
    };
  }
}

/**
 * Get all ranks for a specific category
 */
export async function getRanksByCategory(category?: 'street' | 'family' | 'elite' | 'legendary'): Promise<EnhancedLevelRank[]> {
  try {
    const { data, error } = await authenticatedSupabase.rpc('get_level_ranks_by_category', {
      rank_category: category || null
    });

    if (error) {
      console.error('Error fetching ranks by category:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching ranks by category:', error);
    return [];
  }
}

/**
 * Get all milestone ranks for progression display
 */
export async function getMilestoneRanks(): Promise<EnhancedLevelRank[]> {
  try {
    const { data, error } = await authenticatedSupabase.rpc('get_milestone_ranks');

    if (error) {
      console.error('Error fetching milestone ranks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching milestone ranks:', error);
    return [];
  }
}

/**
 * Get rank category statistics
 */
export async function getRankStatistics(): Promise<RankCategory[]> {
  try {
    const { data, error } = await authenticatedSupabase
      .from('rank_statistics')
      .select('*')
      .order('category');

    if (error) {
      console.error('Error fetching rank statistics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching rank statistics:', error);
    return [];
  }
}

/**
 * Get rank color based on category
 */
export function getRankCategoryColor(category: string): string {
  switch (category) {
    case 'street': return '#8B4513';
    case 'family': return '#DC143C';
    case 'elite': return '#4B0082';
    case 'legendary': return '#FFD700';
    default: return '#666666';
  }
}

/**
 * Get rank category display name
 */
export function getRankCategoryName(category: string): string {
  switch (category) {
    case 'street': return 'Street Operations';
    case 'family': return 'Family Business';
    case 'elite': return 'Elite Status';
    case 'legendary': return 'Legendary Tier';
    default: return 'Unknown';
  }
}

/**
 * Format rank for display with emoji and color
 */
export function formatRankDisplay(rank: EnhancedLevelRank): string {
  const icon = rank.icon_name || '🎯';
  return `${icon} ${rank.title}`;
}

/**
 * Get next milestone for a player
 */
export async function getNextMilestone(playerLevel: number): Promise<EnhancedLevelRank | null> {
  try {
    const milestones = await getMilestoneRanks();
    return milestones.find(rank => rank.level > playerLevel) || null;
  } catch (error) {
    console.error('Error getting next milestone:', error);
    return null;
  }
}

/**
 * Calculate rank progression percentage within category
 */
export function calculateCategoryProgress(
  currentRank: EnhancedLevelRank,
  categoryRanks: EnhancedLevelRank[]
): number {
  if (!currentRank || categoryRanks.length === 0) return 0;

  const categoryRanksInSameCategory = categoryRanks.filter(r => r.category === currentRank.category);
  const currentIndex = categoryRanksInSameCategory.findIndex(r => r.level === currentRank.level);

  if (currentIndex === -1) return 0;

  return ((currentIndex + 1) / categoryRanksInSameCategory.length) * 100;
}

/**
 * Check if a rank is unlockable based on player stats
 */
export function isRankUnlockable(
  rank: EnhancedLevelRank,
  playerLevel: number,
  playerReputation: number
): { unlockable: boolean; reason?: string } {
  if (playerLevel < rank.level) {
    return {
      unlockable: false,
      reason: `Requires level ${rank.level} (current: ${playerLevel})`
    };
  }

  if (rank.min_reputation && playerReputation < rank.min_reputation) {
    return {
      unlockable: false,
      reason: `Requires ${rank.min_reputation.toLocaleString()} reputation (current: ${playerReputation.toLocaleString()})`
    };
  }

  return { unlockable: true };
}

/**
 * Client-side fallback for rank titles (matches database)
 */
export function getRankTitleFallback(level: number): string {
  const fallbackRanks = new Map([
    [1, 'Street Thug'], [2, 'Petty Criminal'], [4, 'Corner Hustler'],
    [6, 'Small Time Crook'], [8, 'Seasoned Criminal'], [10, 'Gang Associate'],
    [12, 'Crew Runner'], [14, 'Numbers Runner'], [16, 'Muscle for Hire'],
    [18, 'Made Member'], [20, 'Family Soldier'], [22, 'Bookmaker'],
    [24, 'Loan Shark'], [25, 'Protection Racketeer'], [28, 'Respected Soldier'],
    [30, 'Territory Controller'], [32, 'Crew Leader'], [35, 'Operations Manager'],
    [38, 'Street Captain'], [40, 'Lieutenant Material'], [42, 'Business Partner'],
    [45, 'Vice Coordinator'], [48, 'Regional Enforcer'], [50, 'Family Advisor'],
    [55, 'Capo Candidate'], [60, 'Junior Capo'], [65, 'District Manager'],
    [70, 'Family Enforcer'], [75, 'Operations Chief'], [80, 'Senior Capo'],
    [85, 'Regional Boss'], [90, 'Underboss Material'], [95, 'Family Consigliere'],
    [100, 'Territory Don'], [110, 'Vice Lieutenant'], [125, 'Don Candidate'],
    [150, 'Family Don'], [175, 'Commission Member'], [200, 'Regional Kingpin'],
    [225, 'Criminal Empire'], [250, 'Crime Lord'], [275, 'Shadow Government'],
    [300, 'Global Syndicate'], [350, 'Underworld Emperor'], [400, 'Criminal Legend'],
    [450, 'Criminal Mastermind'], [500, 'Mythical Boss'], [600, 'Crime Deity'],
    [750, 'Underworld God']
  ]);

  // Find the highest rank achieved
  let bestRank = 'Street Thug';
  for (const [rankLevel, title] of fallbackRanks) {
    if (level >= rankLevel) {
      bestRank = title;
    } else {
      break;
    }
  }

  return bestRank;
}

/**
 * Get rank category from level
 */
export function getRankCategory(level: number): 'street' | 'family' | 'elite' | 'legendary' {
  if (level <= 10) return 'street';
  if (level <= 50) return 'family';
  if (level <= 100) return 'elite';
  return 'legendary';
}
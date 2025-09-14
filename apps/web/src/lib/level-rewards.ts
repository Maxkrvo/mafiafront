'use client';

import { calculateLevel, calculateLevelUpReward, calculateStatPointsEarned } from './levels';
import { authenticatedSupabase } from '@/lib/supabase/authenticated-client';

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel?: number;
  oldLevel?: number;
  moneyEarned?: number;
  statPointsEarned?: number;
  error?: string;
}

/**
 * Check if player leveled up and grant rewards automatically
 * Should be called after any XP gain (job completion, etc.)
 */
export async function checkAndGrantLevelRewards(
  playerId: string,
  newXP: number,
  oldXP: number = 0
): Promise<LevelUpResult> {
  try {
    const oldLevel = calculateLevel(oldXP);
    const newLevel = calculateLevel(newXP);

    // No level up occurred
    if (newLevel <= oldLevel) {
      return { leveledUp: false };
    }

    // Player leveled up! Calculate total rewards for all levels gained
    let totalMoneyReward = 0;
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      totalMoneyReward += calculateLevelUpReward(level);
    }

    // Calculate stat points earned
    const statPointsEarned = calculateStatPointsEarned(oldLevel, newLevel);

    // Grant rewards to player
    if (totalMoneyReward > 0 || statPointsEarned > 0) {
      const { error } = await authenticatedSupabase.rpc('grant_level_reward', {
        player_uuid: playerId,
        money_reward: totalMoneyReward,
        stat_points_earned: statPointsEarned,
        levels_gained: newLevel - oldLevel,
        new_level: newLevel
      });

      if (error) {
        console.error('Failed to grant level reward:', error);
        return {
          leveledUp: true,
          newLevel,
          oldLevel,
          error: 'Failed to grant rewards'
        };
      }
    }

    console.log(`🎉 Player leveled up from ${oldLevel} to ${newLevel}! Earned $${totalMoneyReward.toLocaleString()} and ${statPointsEarned} stat points`);

    return {
      leveledUp: true,
      newLevel,
      oldLevel,
      moneyEarned: totalMoneyReward,
      statPointsEarned
    };

  } catch (error) {
    console.error('Error checking level rewards:', error);
    return {
      leveledUp: false,
      error: 'Failed to process level rewards'
    };
  }
}

/**
 * Helper to get the next level's reward amount for UI display
 */
export function getNextLevelReward(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  const nextLevel = currentLevel + 1;
  return calculateLevelUpReward(nextLevel);
}

/**
 * Get total rewards earned from level 1 to specified level
 */
export function getTotalRewardsEarned(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += calculateLevelUpReward(i);
  }
  return total;
}
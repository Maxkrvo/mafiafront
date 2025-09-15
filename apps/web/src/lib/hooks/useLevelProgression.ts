"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/cache/query-keys";
import {
  fetchLevelProgressionData,
  advancePlayerRank,
} from "@/lib/level-progression-data";
import { getLevelInfo, canAdvanceToRank, formatXP, getLevelTitle, getLevelMilestones } from "@/lib/levels";
import {
  getNextLevelReward,
  checkAndGrantLevelRewards,
  type LevelUpResult,
} from "@/lib/level-rewards";
import type { RankAdvancement } from "@/lib/supabase/jobs-types";

// =====================================
// LEVEL PROGRESSION QUERY HOOKS
// =====================================

// Combined Level Progression Hook
export function useLevelProgression(player: { id: string; rank: string; reputation_score: number }) {
  return useQuery({
    queryKey: [...queryKeys.player.stats(player.id), 'progression'],
    queryFn: () => fetchLevelProgressionData(player),
    enabled: !!player.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - level progression changes with XP/reputation
  });
}

// Level Info Hook (using player economics data)
export function useLevelInfo(experiencePoints: number) {
  return useQuery({
    queryKey: ['levels', 'info', experiencePoints],
    queryFn: () => Promise.resolve(getLevelInfo(experiencePoints)),
    staleTime: Infinity, // Level calculations are deterministic
  });
}

// Rank Advancement Check Hook
export function useRankAdvancement(
  currentRank: string,
  level: number,
  reputationScore: number
) {
  return useQuery({
    queryKey: ['levels', 'rankAdvancement', currentRank, level, reputationScore],
    queryFn: () => {
      const advancement = canAdvanceToRank(currentRank, level, reputationScore);
      const rankAdvancement: RankAdvancement = {
        canAdvance: advancement.canAdvance,
        nextRank: advancement.nextRank,
        requirements: advancement.requirements,
        currentLevel: level,
        currentReputation: reputationScore,
      };
      return Promise.resolve(rankAdvancement);
    },
    staleTime: 30 * 1000, // 30 seconds - rank requirements are mostly static
  });
}

// Level Milestones Hook
export function useLevelMilestones(currentLevel: number) {
  return useQuery({
    queryKey: ['levels', 'milestones', currentLevel],
    queryFn: () => Promise.resolve(getLevelMilestones()),
    staleTime: Infinity, // Milestones are static
  });
}

// Next Level Reward Hook
export function useNextLevelReward(currentLevel: number, nextLevel?: number) {
  return useQuery({
    queryKey: ['levels', 'nextReward', currentLevel, nextLevel],
    queryFn: () => Promise.resolve(getNextLevelReward(nextLevel || currentLevel + 1)),
    enabled: !!nextLevel || currentLevel > 0,
    staleTime: Infinity, // Rewards are static
  });
}

// Combined Hook for Level Progress Card
export function useLevelProgressCard(
  player: { id: string; rank: string; reputation_score: number },
  experiencePoints: number
) {
  const levelInfo = getLevelInfo(experiencePoints);

  const { data: progressionData, ...progressionQuery } = useLevelProgression(player);
  const { data: nextReward } = useNextLevelReward(levelInfo.level, levelInfo.level + 1);
  const { data: milestones } = useLevelMilestones(levelInfo.level);

  return {
    levelInfo,
    rankAdvancement: progressionData?.rankAdvancement,
    nextReward,
    milestones,
    ...progressionQuery,
  };
}

// =====================================
// MUTATION HOOKS
// =====================================

// Advance Player Rank Mutation
export function useAdvancePlayerRank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerId: string) => advancePlayerRank(playerId),

    onSuccess: (result: { success: boolean; message?: string }, playerId: string) => {
      if (result.success) {
        // Invalidate player data since rank affects many things
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(playerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.stats(playerId),
        });

        // Invalidate level progression data
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.player.stats(playerId), 'progression'],
        });

        // Invalidate family data if player is in a family (rank affects family status)
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'families';
          }
        });

        // Invalidate leaderboards since rank changes affect reputation leaderboards
        queryClient.invalidateQueries({
          queryKey: queryKeys.leaderboards.global(),
        });
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async (playerId: string) => {
      // We could optimistically update the rank, but it's safer to just show loading state
      // and let the server determine the actual advancement
      return { playerId };
    },

    onError: (error, playerId, context) => {
      // Show error message to user
      console.error('Failed to advance rank:', error);
    },

    onSettled: (data, error, playerId) => {
      // Always refetch progression data after mutation completes
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.player.stats(playerId), 'progression'],
      });
    },
  });
}

// Grant Level Rewards Mutation
export function useGrantLevelRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      newXP,
      oldXP = 0,
    }: {
      playerId: string;
      newXP: number;
      oldXP?: number;
    }) => checkAndGrantLevelRewards(playerId, newXP, oldXP),

    onSuccess: (result: LevelUpResult, { playerId, newXP, oldXP }) => {
      if (result.leveledUp) {
        // Invalidate all player data since leveling up affects multiple systems
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(playerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.economics(playerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.stats(playerId),
        });

        // Invalidate level progression data
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.player.stats(playerId), 'progression'],
        });

        // If stat points were earned, invalidate stat points query
        if (result.statPointsEarned && result.statPointsEarned > 0) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.statPoints(playerId),
          });
        }

        // Invalidate leaderboards since level affects reputation rankings
        queryClient.invalidateQueries({
          queryKey: queryKeys.leaderboards.global(),
        });

        // If player is in a family, invalidate family data (level affects family power)
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'families' &&
                   query.queryKey.includes('dashboard');
          }
        });
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async ({ playerId, newXP, oldXP = 0 }) => {
      // Calculate level change for optimistic update
      const oldLevel = Math.floor(Math.sqrt(oldXP / 100));
      const newLevel = Math.floor(Math.sqrt(newXP / 100));

      if (newLevel > oldLevel) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: queryKeys.player.economics(playerId),
        });

        // Snapshot the previous value
        const previousEconomics = queryClient.getQueryData(
          queryKeys.player.economics(playerId)
        );

        // Optimistically update XP
        if (previousEconomics && typeof previousEconomics === 'object' && 'experience_points' in previousEconomics) {
          const updatedEconomics = {
            ...previousEconomics,
            experience_points: newXP,
          };
          queryClient.setQueryData(
            queryKeys.player.economics(playerId),
            updatedEconomics
          );
        }

        return { previousEconomics, leveledUp: true, newLevel, oldLevel };
      }

      return { leveledUp: false };
    },

    // If the mutation fails, use the context to roll back
    onError: (err, { playerId }, context) => {
      if (context?.previousEconomics && context.leveledUp) {
        queryClient.setQueryData(
          queryKeys.player.economics(playerId),
          context.previousEconomics
        );
      }
    },

    // Always refetch after error or success for accuracy
    onSettled: (data, error, { playerId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.player.economics(playerId),
      });
    },
  });
}

// Utility Hooks for formatting and display
export function useLevelFormatting() {
  return {
    formatXP,
    getLevelTitle,
    formatLevel: (level: number) => `Lv.${level}`,
    formatRank: (rank: string) => rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase(),
  };
}
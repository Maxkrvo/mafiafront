"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/cache/query-keys";
import {
  fetchLeaderboardData,
  LeaderboardCategory,
  LeaderboardEntry,
} from "@/lib/leaderboard-data";

// =====================================
// LEADERBOARD QUERY HOOKS
// =====================================

// Single Leaderboard Category Hook
export function useLeaderboard(category: LeaderboardCategory, limit: number = 50) {
  return useQuery({
    queryKey: [...queryKeys.leaderboards.global(), category, limit],
    queryFn: () => fetchLeaderboardData(category, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes - leaderboards change slowly
  });
}

// Reputation Leaderboard Hook
export function useReputationLeaderboard(limit: number = 50) {
  return useLeaderboard("reputation", limit);
}

// Eliminations Leaderboard Hook
export function useEliminationsLeaderboard(limit: number = 50) {
  return useLeaderboard("eliminations", limit);
}

// Survival Leaderboard Hook
export function useSurvivalLeaderboard(limit: number = 50) {
  return useLeaderboard("survival", limit);
}

// Win Rate Leaderboard Hook
export function useWinRateLeaderboard(limit: number = 50) {
  return useLeaderboard("winrate", limit);
}

// Activity Leaderboard Hook
export function useActivityLeaderboard(limit: number = 50) {
  return useLeaderboard("activity", limit);
}

// Combined Hook for Multiple Categories (for preloading)
export function useMultipleLeaderboards(categories: LeaderboardCategory[], limit: number = 50) {
  const queries = categories.reduce((acc, category) => {
    acc[category] = useLeaderboard(category, limit);
    return acc;
  }, {} as Record<LeaderboardCategory, ReturnType<typeof useLeaderboard>>);

  return queries;
}

// Player Position Hook - finds player's position in a specific leaderboard
export function usePlayerLeaderboardPosition(
  playerId: string,
  category: LeaderboardCategory,
  limit: number = 100 // Check more entries to find player position
) {
  const { data: leaderboardData = [], ...query } = useLeaderboard(category, limit);

  const playerEntry = leaderboardData.find((entry) => entry.id === playerId);
  const playerPosition = playerEntry?.position || null;
  const playerRank = playerPosition ? `#${playerPosition}` : "Unranked";

  return {
    ...query,
    playerEntry,
    playerPosition,
    playerRank,
    isInTop: playerPosition ? playerPosition <= limit : false,
  };
}

// Top Players Hook - gets top N players for a category
export function useTopPlayers(category: LeaderboardCategory, count: number = 10) {
  const { data: leaderboardData = [], ...query } = useLeaderboard(category, count);

  const topPlayers = leaderboardData.slice(0, count);

  return {
    ...query,
    data: topPlayers,
  };
}

// Family Leaderboard Hook - gets players from a specific family
export function useFamilyLeaderboard(
  familyId: string,
  category: LeaderboardCategory,
  limit: number = 50
) {
  const { data: leaderboardData = [], ...query } = useLeaderboard(category, limit);

  // Note: This assumes leaderboard entries would have family info
  // If not available, this would need a separate API endpoint
  const familyPlayers = leaderboardData.filter((entry) => {
    // This would need to be adjusted based on actual data structure
    return (entry as any).family_id === familyId;
  });

  return {
    ...query,
    data: familyPlayers,
  };
}

// Leaderboard Statistics Hook - provides summary stats
export function useLeaderboardStats(category: LeaderboardCategory) {
  const { data: leaderboardData = [], ...query } = useLeaderboard(category, 50);

  const stats = {
    totalPlayers: leaderboardData.length,
    topScore: leaderboardData[0]?.[categoryConfig[category]?.mainStat as keyof LeaderboardEntry] || 0,
    averageScore: leaderboardData.length > 0
      ? leaderboardData.reduce((sum, entry) => {
          const value = entry[categoryConfig[category]?.mainStat as keyof LeaderboardEntry];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0) / leaderboardData.length
      : 0,
  };

  return {
    ...query,
    stats,
  };
}

// Import categoryConfig for internal use
const categoryConfig = {
  reputation: { mainStat: 'reputation_score' },
  eliminations: { mainStat: 'total_eliminations' },
  survival: { mainStat: 'survival_rate' },
  winrate: { mainStat: 'win_rate' },
  activity: { mainStat: 'total_games' },
};
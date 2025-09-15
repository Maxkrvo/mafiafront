"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/cache/query-keys";
import {
  fetchPlayerStats,
  fetchPlayerStatPoints,
  fetchPlayerDashboardData,
  allocateStatPoints,
} from "@/lib/player-data";
import { fetchPlayerEconomics } from "@/lib/jobs-data";
import { PlayerStatPoints, StatPointAllocation } from "../stat-points";

// Player Stats Hook
export function usePlayerStats(playerId: string) {
  return useQuery({
    queryKey: queryKeys.player.stats(playerId),
    queryFn: () => fetchPlayerStats(playerId),
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Player Stat Points Hook
export function usePlayerStatPoints(playerId: string, authSupabase?: any) {
  return useQuery({
    queryKey: queryKeys.player.statPoints(playerId),
    queryFn: () => fetchPlayerStatPoints(playerId, authSupabase),
    enabled: !!playerId,
    staleTime: 1 * 60 * 1000, // 1 minute for stat points
  });
}

// Player Economics Hook
export function usePlayerEconomics(playerId: string, authSupabase?: any) {
  return useQuery({
    queryKey: queryKeys.player.economics(playerId),
    queryFn: () => fetchPlayerEconomics(playerId, authSupabase),
    enabled: !!playerId,
    staleTime: 2 * 60 * 1000, // 2 minutes for economics
  });
}

// Combined Player Dashboard Hook - High Impact Optimization
export function usePlayerDashboard(playerId: string, authSupabase?: any) {
  return useQuery({
    queryKey: queryKeys.player.dashboard(playerId),
    queryFn: async () => {
      const [dashboardData, economicsData] = await Promise.all([
        fetchPlayerDashboardData(playerId, authSupabase),
        fetchPlayerEconomics(playerId, authSupabase),
      ]);

      return {
        ...dashboardData,
        economics: economicsData,
      };
    },
    enabled: !!playerId,
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
  });
}

// =====================================
// MUTATION HOOKS
// =====================================

// Allocate Stat Points Mutation
export function useAllocateStatPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      allocation,
      authSupabase,
    }: {
      playerId: string;
      allocation: StatPointAllocation;
      authSupabase?: any;
    }) => allocateStatPoints(playerId, allocation, authSupabase),

    onSuccess: (success: boolean, { playerId }) => {
      if (success) {
        // Invalidate stat points data
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.statPoints(playerId),
        });

        // Invalidate dashboard data to reflect new effective stats
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(playerId),
        });

        // Also invalidate player stats if they exist
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.stats(playerId),
        });
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async ({ playerId, allocation }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.player.statPoints(playerId),
      });

      // Snapshot the previous value
      const previousStatPoints = queryClient.getQueryData<PlayerStatPoints>(
        queryKeys.player.statPoints(playerId)
      );

      // Optimistically update to the new value
      if (previousStatPoints) {
        const totalAllocating =
          allocation.health +
          allocation.energy +
          allocation.attack +
          allocation.defense;
        const newStatPoints: PlayerStatPoints = {
          ...previousStatPoints,
          unspent: Math.max(0, previousStatPoints.unspent - totalAllocating),
          allocated: {
            health: previousStatPoints.allocated.health + allocation.health,
            energy: previousStatPoints.allocated.energy + allocation.energy,
            attack: previousStatPoints.allocated.attack + allocation.attack,
            defense: previousStatPoints.allocated.defense + allocation.defense,
          },
        };

        queryClient.setQueryData(
          queryKeys.player.statPoints(playerId),
          newStatPoints
        );
      }

      // Return a context object with the snapshotted value
      return { previousStatPoints };
    },

    // If the mutation fails, use the context to roll back
    onError: (err, { playerId }, context) => {
      if (context?.previousStatPoints) {
        queryClient.setQueryData(
          queryKeys.player.statPoints(playerId),
          context.previousStatPoints
        );
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, { playerId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.player.statPoints(playerId),
      });
    },
  });
}

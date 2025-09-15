"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/cache/query-keys";
import {
  fetchJobTemplates,
  fetchPlayerEconomics,
  fetchJobsPageData,
  executeJobWithLoot,
  fetchLootDetails,
} from "@/lib/jobs-data";
import { getLevelInfo } from "@/lib/levels";
import type { JobExecutionResult } from "@/lib/supabase/jobs-types";

// Job Templates Hook
export function useJobTemplates(authSupabase?: any) {
  return useQuery({
    queryKey: queryKeys.jobs.templates(),
    queryFn: () => fetchJobTemplates(authSupabase),
    staleTime: 10 * 60 * 1000, // 10 minutes for job templates (relatively static)
  });
}

// Jobs Page Data Hook - Fetches both jobs and economics
export function useJobsPageData(playerId: string, authSupabase?: any) {
  return useQuery({
    queryKey: queryKeys.jobs.pageData(playerId),
    queryFn: () => fetchJobsPageData(playerId, authSupabase),
    enabled: !!playerId,
    staleTime: 2 * 60 * 1000, // 2 minutes for combined page data
  });
}

// Loot Details Hook
export function useLootDetails(
  lootItems: { item_template_id: string; quantity: number }[],
  authSupabase?: any
) {
  const lootIds = lootItems.map((item) => item.item_template_id);

  return useQuery({
    queryKey: queryKeys.jobs.lootDetails(lootIds),
    queryFn: () => fetchLootDetails(lootItems, authSupabase),
    enabled: lootItems.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes for loot details (very static)
  });
}

// =====================================
// MUTATION HOOKS
// =====================================

// Execute Job Mutation
export function useExecuteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobTemplateId,
      playerId,
      executeRpc,
    }: {
      jobTemplateId: string;
      playerId: string;
      executeRpc: (fnName: string, params: any) => Promise<{ data: any; error: any }>;
    }) => executeJobWithLoot(jobTemplateId, playerId, executeRpc),

    onSuccess: (result: JobExecutionResult | null, { playerId }) => {
      if (result?.success) {
        // Invalidate player economics and dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.economics(playerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(playerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.stats(playerId),
        });

        // Invalidate jobs page data to reflect new player state
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobs.pageData(playerId),
        });

        // Invalidate player inventory if loot was received
        if (result.loot_received && result.loot_received.length > 0) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.inventory.player(playerId),
          });
        }

        // Invalidate job history
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobs.playerHistory(playerId),
        });

        // If the job gave experience, invalidate stat points
        if (result.experience_gained && result.experience_gained > 0) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.statPoints(playerId),
          });
        }
      }
    },

    // Optimistic update for immediate feedback
    onMutate: async ({ playerId }) => {
      // Cancel any outgoing refetches for player economics
      await queryClient.cancelQueries({
        queryKey: queryKeys.player.economics(playerId),
      });

      // Get previous economics data for rollback
      const previousEconomics = queryClient.getQueryData(
        queryKeys.player.economics(playerId)
      );

      return { previousEconomics };
    },

    // Rollback on error
    onError: (err, { playerId }, context) => {
      if (context?.previousEconomics) {
        queryClient.setQueryData(
          queryKeys.player.economics(playerId),
          context.previousEconomics
        );
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, { playerId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.player.economics(playerId),
      });
    },
  });
}
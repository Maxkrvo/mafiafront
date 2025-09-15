"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidationHelpers } from "@/lib/cache/query-keys";
import {
  getFamilyJoinRequests,
  approveFamilyJoinRequest,
  kickFamilyMember,
  updateFamilyMemberRank,
} from "@/lib/family-data";
import type { FamilyMemberAction, FamilyValidationResult } from "@/lib/family-data";

// =====================================
// FAMILY MANAGEMENT QUERY HOOKS
// =====================================

// Family Join Requests Hook
export function useFamilyJoinRequests(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.families.members(familyId), 'joinRequests'],
    queryFn: () => getFamilyJoinRequests(familyId),
    enabled: !!familyId,
    staleTime: 30 * 1000, // 30 seconds for join requests (time-sensitive)
  });
}

// =====================================
// FAMILY MANAGEMENT MUTATION HOOKS
// =====================================

// Approve Family Join Request Mutation
export function useApproveFamilyJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      approverId,
      action,
      authSupabase,
    }: {
      approverId: string;
      action: FamilyMemberAction;
      authSupabase?: any;
    }) => approveFamilyJoinRequest(approverId, action, authSupabase),

    onSuccess: (result: FamilyValidationResult, { approverId, action }) => {
      if (result.valid && action.family_id) {
        // Invalidate join requests for the family
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.families.members(action.family_id), 'joinRequests'],
        });

        // Invalidate family members list
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.members(action.family_id),
        });

        // Invalidate family stats (member count changed)
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.stats(action.family_id),
        });

        // Invalidate family dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.dashboard(action.family_id),
        });

        // Invalidate new member's family data
        invalidationHelpers
          .invalidatePlayerFamilyData(action.target_player_id)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

        // Invalidate approver's dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(approverId),
        });
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async ({ action }) => {
      if (!action.family_id) return {};

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [...queryKeys.families.members(action.family_id), 'joinRequests'],
      });

      // Snapshot the previous value
      const previousRequests = queryClient.getQueryData(
        [...queryKeys.families.members(action.family_id), 'joinRequests']
      );

      // Optimistically remove the request from the list
      if (previousRequests && Array.isArray(previousRequests)) {
        const updatedRequests = previousRequests.filter(
          (request: any) => request.player_id !== action.target_player_id
        );
        queryClient.setQueryData(
          [...queryKeys.families.members(action.family_id), 'joinRequests'],
          updatedRequests
        );
      }

      return { previousRequests };
    },

    // If the mutation fails, use the context to roll back
    onError: (err, { action }, context) => {
      if (context?.previousRequests && action.family_id) {
        queryClient.setQueryData(
          [...queryKeys.families.members(action.family_id), 'joinRequests'],
          context.previousRequests
        );
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, { action }) => {
      if (action.family_id) {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.families.members(action.family_id), 'joinRequests'],
        });
      }
    },
  });
}

// Kick Family Member Mutation
export function useKickFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      kickerId,
      action,
      authSupabase,
    }: {
      kickerId: string;
      action: FamilyMemberAction;
      authSupabase?: any;
    }) => kickFamilyMember(kickerId, action, authSupabase),

    onSuccess: (result: FamilyValidationResult, { kickerId, action }) => {
      if (result.valid && action.family_id) {
        // Invalidate family members list
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.members(action.family_id),
        });

        // Invalidate family stats (member count changed)
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.stats(action.family_id),
        });

        // Invalidate family dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.dashboard(action.family_id),
        });

        // Invalidate kicked member's family data
        invalidationHelpers
          .invalidatePlayerFamilyData(action.target_player_id)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

        // Invalidate kicker's dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(kickerId),
        });
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async ({ action }) => {
      if (!action.family_id) return {};

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.families.members(action.family_id),
      });

      // Snapshot the previous value
      const previousMembers = queryClient.getQueryData(
        queryKeys.families.members(action.family_id)
      );

      // Optimistically remove the member from the list
      if (previousMembers && Array.isArray(previousMembers)) {
        const updatedMembers = previousMembers.filter(
          (member: any) => member.player_id !== action.target_player_id
        );
        queryClient.setQueryData(
          queryKeys.families.members(action.family_id),
          updatedMembers
        );
      }

      return { previousMembers };
    },

    // If the mutation fails, use the context to roll back
    onError: (err, { action }, context) => {
      if (context?.previousMembers && action.family_id) {
        queryClient.setQueryData(
          queryKeys.families.members(action.family_id),
          context.previousMembers
        );
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, { action }) => {
      if (action.family_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.members(action.family_id),
        });
      }
    },
  });
}

// Update Family Member Rank Mutation (Enhanced version)
export function useUpdateMemberRank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      promoterId,
      action,
      authSupabase,
    }: {
      promoterId: string;
      action: FamilyMemberAction;
      authSupabase?: any;
    }) => updateFamilyMemberRank(promoterId, action, authSupabase),

    onSuccess: (result: FamilyValidationResult, { promoterId, action }) => {
      if (result.valid && action.family_id) {
        // Invalidate family members list to show new rank
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.members(action.family_id),
        });

        // Invalidate family stats
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.stats(action.family_id),
        });

        // Invalidate family dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.dashboard(action.family_id),
        });

        // Invalidate target player's family data (rank affects permissions)
        invalidationHelpers
          .invalidatePlayerFamilyData(action.target_player_id)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

        // Invalidate promoter's dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(promoterId),
        });
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async ({ action }) => {
      if (!action.family_id || !action.rank) return {};

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.families.members(action.family_id),
      });

      // Snapshot the previous value
      const previousMembers = queryClient.getQueryData(
        queryKeys.families.members(action.family_id)
      );

      // Optimistically update the member's rank
      if (previousMembers && Array.isArray(previousMembers)) {
        const updatedMembers = previousMembers.map(
          (member: any) => member.player_id === action.target_player_id
            ? { ...member, rank: action.rank }
            : member
        );
        queryClient.setQueryData(
          queryKeys.families.members(action.family_id),
          updatedMembers
        );
      }

      return { previousMembers };
    },

    // If the mutation fails, use the context to roll back
    onError: (err, { action }, context) => {
      if (context?.previousMembers && action.family_id) {
        queryClient.setQueryData(
          queryKeys.families.members(action.family_id),
          context.previousMembers
        );
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, { action }) => {
      if (action.family_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.members(action.family_id),
        });
      }
    },
  });
}

// Combined Family Management Hook for easy access
export function useFamilyManagement(familyId: string) {
  const joinRequests = useFamilyJoinRequests(familyId);
  const approveRequest = useApproveFamilyJoinRequest();
  const kickMember = useKickFamilyMember();
  const updateRank = useUpdateMemberRank();

  return {
    joinRequests,
    mutations: {
      approveRequest,
      kickMember,
      updateRank,
    },
  };
}
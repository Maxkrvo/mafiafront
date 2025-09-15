"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidationHelpers } from "@/lib/cache/query-keys";
import {
  getFamilyDashboardData,
  approveFamilyJoinRequest,
  getFamilyById,
  getPlayerFamilyMembership,
  getFamilyMembers,
  searchFamilies,
  createFamily,
  requestJoinFamily,
  leaveFamily,
  kickFamilyMember,
  updateFamilyMemberRank,
  getFamilyStats,
  getFamilyActivities,
  getFamilyEconomics,
  checkFamilyPermission,
} from "@/lib/family-data";
import type {
  FamilySearchParams,
  CreateFamilyRequest,
  CreateFamilyResponse,
  JoinFamilyRequest,
  FamilyValidationResult,
  FamilyMemberAction,
  FamilyPermissions,
} from "@/lib/supabase/family-types";

// Family Dashboard Hook - Primary high-impact optimization
export function useFamilyDashboard(playerId: string) {
  return useQuery({
    queryKey: queryKeys.families.dashboard(playerId),
    queryFn: () => getFamilyDashboardData(playerId),
    enabled: !!playerId,
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
  });
}

// Family Details Hook
export function useFamily(familyId: string) {
  return useQuery({
    queryKey: queryKeys.families.detail(familyId),
    queryFn: () => getFamilyById(familyId),
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes for family details
  });
}

// Player Family Membership Hook
export function useFamilyMembership(playerId: string) {
  return useQuery({
    queryKey: queryKeys.families.membership(playerId),
    queryFn: () => getPlayerFamilyMembership(playerId),
    enabled: !!playerId,
    staleTime: 3 * 60 * 1000, // 3 minutes for membership status
  });
}

// Family Members Hook
export function useFamilyMembers(
  familyId: string,
  options?: { active_only?: boolean; exclude_boss?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.families.members(familyId), options],
    queryFn: () => getFamilyMembers(familyId, options),
    enabled: !!familyId,
    staleTime: 1 * 60 * 1000, // 1 minute for member lists
  });
}

// Family Search Hook
export function useFamilySearch(params: FamilySearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.families.list(JSON.stringify(params)),
    queryFn: () => searchFamilies(params),
    staleTime: 30 * 1000, // 30 seconds for search results
  });
}

// Family Stats Hook
export function useFamilyStats(familyId: string) {
  return useQuery({
    queryKey: queryKeys.families.stats(familyId),
    queryFn: () => getFamilyStats(familyId),
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
  });
}

// Family Activities Hook
export function useFamilyActivities(familyId: string, limit: number = 20) {
  return useQuery({
    queryKey: [...queryKeys.families.activities(familyId), limit],
    queryFn: () => getFamilyActivities(familyId, limit),
    enabled: !!familyId,
    staleTime: 1 * 60 * 1000, // 1 minute for activities
  });
}

// Family Economics Hook
export function useFamilyEconomics(familyId: string) {
  return useQuery({
    queryKey: queryKeys.families.economics(familyId),
    queryFn: () => getFamilyEconomics(familyId),
    enabled: !!familyId,
    staleTime: 2 * 60 * 1000, // 2 minutes for economics
  });
}

// Family Permissions Hook
export function useFamilyPermission(
  playerId: string,
  permission: keyof FamilyPermissions
) {
  return useQuery({
    queryKey: [...queryKeys.families.permissions(playerId), permission],
    queryFn: () => checkFamilyPermission(playerId, permission),
    enabled: !!playerId && !!permission,
    staleTime: 5 * 60 * 1000, // 5 minutes for permissions
  });
}

// =====================================
// MUTATION HOOKS
// =====================================

// Create Family Mutation
export function useCreateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      creatorId,
      familyData,
      authSupabase,
    }: {
      creatorId: string;
      familyData: CreateFamilyRequest;
      authSupabase?: any;
    }) => createFamily(creatorId, familyData, authSupabase),

    onSuccess: (result: CreateFamilyResponse, { creatorId }) => {
      if (result.success && result.family) {
        // Invalidate player's family-related data
        invalidationHelpers
          .invalidatePlayerFamilyData(creatorId)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

        // Update family lists
        queryClient.invalidateQueries({ queryKey: queryKeys.families.lists() });

        // Set the new family data in cache
        queryClient.setQueryData(
          queryKeys.families.detail(result.family.id),
          result.family
        );
      }
    },
  });
}

// Join Family Request Mutation
export function useRequestJoinFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      request,
      authSupabase,
    }: {
      playerId: string;
      request: JoinFamilyRequest;
      authSupabase?: any;
    }) => requestJoinFamily(playerId, request, authSupabase),

    onSuccess: (result: FamilyValidationResult, { playerId, request }) => {
      if (result.valid) {
        // Invalidate join requests for the target family
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.joinRequests(request.family_id),
        });

        // Invalidate player's membership status
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.membership(playerId),
        });
      }
    },
  });
}

// Approve Join Request Mutation
export function useApproveFamilyJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      approverId,
      familyId,
      playerId,
      authSupabase,
    }: {
      approverId: string;
      familyId: string;
      playerId: string;
      authSupabase?: any;
    }) =>
      approveFamilyJoinRequest(approverId, familyId, playerId, authSupabase),

    onSuccess: (
      result: FamilyValidationResult,
      { approverId, familyId, playerId }
    ) => {
      if (result.valid) {
        // Invalidate family dashboard for the approver
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.dashboard(approverId),
        });

        // Invalidate family data
        invalidationHelpers
          .invalidateFamilyData(familyId)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

        // Invalidate approved player's family data
        invalidationHelpers
          .invalidatePlayerFamilyData(playerId)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });
      }
    },
  });
}

// Leave Family Mutation
export function useLeaveFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      authSupabase,
    }: {
      playerId: string;
      authSupabase?: any;
    }) => leaveFamily(playerId, authSupabase),

    onSuccess: (result: FamilyValidationResult, { playerId }) => {
      if (result.valid) {
        // Invalidate all player's family-related data
        invalidationHelpers
          .invalidatePlayerFamilyData(playerId)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

        // Could also invalidate the family's member list if we knew the family ID
        // This will be handled by real-time subscriptions
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
      if (result.valid) {
        // Invalidate kicker's dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.dashboard(kickerId),
        });

        // Invalidate kicked player's family data
        invalidationHelpers
          .invalidatePlayerFamilyData(action.target_player_id)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

        // Invalidate family member lists and activities
        // Family ID would need to be passed or retrieved from membership data
      }
    },
  });
}

// Update Member Rank Mutation
export function useUpdateFamilyMemberRank() {
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
      if (result.valid) {
        // Invalidate promoter's dashboard
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.dashboard(promoterId),
        });

        // Invalidate target player's family data
        invalidationHelpers
          .invalidatePlayerFamilyData(action.target_player_id)
          .forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

        // Invalidate family stats and members
        // Family ID would need to be passed or retrieved from membership data
      }
    },
  });
}

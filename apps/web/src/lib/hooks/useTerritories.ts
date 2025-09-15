"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidationHelpers } from "@/lib/cache/query-keys";
import {
  getAllTerritories,
  getTerritory,
  getTerritoriesByType,
  getAdjacentTerritories,
  getTerritoryControl,
  getAllTerritoryControls,
  getFamilyTerritories,
  updateTerritoryControl,
  declareWar,
  getActiveWars,
  getWarsByFamily,
  getWar,
  getActiveWarForTerritory,
  advanceWarPhase,
  participateInWar,
  getWarParticipants,
  getWarEvents,
  getSabotageMissions,
  executeSabotageMission,
  calculateTerritoryIncome,
  getTerritoryIncomeHistory,
  getFamilyTerritoryReport,
  processTerritoryPayouts,
} from "@/lib/territory-data";
import type {
  DeclareWarRequest,
  DeclareWarResponse,
  ParticipateinWarRequest,
  WarParticipationResponse,
  TerritoryIncomeCalculation,
} from "@/lib/supabase/territory-types";

// =====================================
// TERRITORY MANAGEMENT HOOKS
// =====================================

// All Territories Hook
export function useTerritories() {
  return useQuery({
    queryKey: queryKeys.territories.lists(),
    queryFn: getAllTerritories,
    staleTime: 10 * 60 * 1000, // 10 minutes - territories don't change often
  });
}

// Single Territory Hook
export function useTerritory(territoryId: string) {
  return useQuery({
    queryKey: queryKeys.territories.detail(territoryId),
    queryFn: () => getTerritory(territoryId),
    enabled: !!territoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Territories by Type Hook
export function useTerritoriesByType(territoryType: string) {
  return useQuery({
    queryKey: queryKeys.territories.list(territoryType),
    queryFn: () => getTerritoriesByType(territoryType),
    enabled: !!territoryType,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Adjacent Territories Hook
export function useAdjacentTerritories(territoryId: string) {
  return useQuery({
    queryKey: [...queryKeys.territories.detail(territoryId), 'adjacent'],
    queryFn: () => getAdjacentTerritories(territoryId),
    enabled: !!territoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// =====================================
// TERRITORY CONTROL HOOKS
// =====================================

// Territory Control Hook
export function useTerritoryControl(territoryId: string) {
  return useQuery({
    queryKey: queryKeys.territories.control(territoryId),
    queryFn: () => getTerritoryControl(territoryId),
    enabled: !!territoryId,
    staleTime: 2 * 60 * 1000, // 2 minutes - control can change
  });
}

// All Territory Controls Hook
export function useTerritoryControls() {
  return useQuery({
    queryKey: queryKeys.territories.controls(),
    queryFn: getAllTerritoryControls,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Family Territories Hook
export function useFamilyTerritories(familyId: string) {
  return useQuery({
    queryKey: queryKeys.territories.byFamily(familyId),
    queryFn: () => getFamilyTerritories(familyId),
    enabled: !!familyId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// =====================================
// TERRITORY WARS HOOKS
// =====================================

// Active Wars Hook
export function useActiveWars() {
  return useQuery({
    queryKey: queryKeys.territories.activeWars(),
    queryFn: getActiveWars,
    staleTime: 30 * 1000, // 30 seconds - wars are active
  });
}

// Wars by Family Hook
export function useWarsByFamily(familyId: string) {
  return useQuery({
    queryKey: queryKeys.territories.warsByFamily(familyId),
    queryFn: () => getWarsByFamily(familyId),
    enabled: !!familyId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Single War Hook
export function useWar(warId: string) {
  return useQuery({
    queryKey: queryKeys.territories.war(warId),
    queryFn: () => getWar(warId),
    enabled: !!warId,
    staleTime: 30 * 1000, // 30 seconds - war state changes frequently
  });
}

// Active War for Territory Hook
export function useActiveWarForTerritory(territoryId: string) {
  return useQuery({
    queryKey: queryKeys.territories.warForTerritory(territoryId),
    queryFn: () => getActiveWarForTerritory(territoryId),
    enabled: !!territoryId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// War Participants Hook
export function useWarParticipants(warId: string) {
  return useQuery({
    queryKey: queryKeys.territories.battleParticipants(warId),
    queryFn: () => getWarParticipants(warId),
    enabled: !!warId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// War Events Hook
export function useWarEvents(warId: string) {
  return useQuery({
    queryKey: [...queryKeys.territories.war(warId), 'events'],
    queryFn: () => getWarEvents(warId),
    enabled: !!warId,
    staleTime: 15 * 1000, // 15 seconds - events update frequently
  });
}

// =====================================
// SABOTAGE HOOKS
// =====================================

// Sabotage Missions Hook
export function useSabotageMissions(territoryId: string) {
  return useQuery({
    queryKey: queryKeys.territories.sabotageHistory(territoryId),
    queryFn: () => getSabotageMissions(territoryId),
    enabled: !!territoryId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// =====================================
// INCOME HOOKS
// =====================================

// Territory Income History Hook
export function useTerritoryIncomeHistory(territoryId: string, days: number = 7) {
  return useQuery({
    queryKey: queryKeys.territories.incomeHistory(territoryId, days),
    queryFn: () => getTerritoryIncomeHistory(territoryId, days),
    enabled: !!territoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Family Territory Report Hook
export function useFamilyTerritoryReport(familyId: string) {
  return useQuery({
    queryKey: queryKeys.territories.familyTerritoryReport(familyId),
    queryFn: () => getFamilyTerritoryReport(familyId),
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// =====================================
// MUTATION HOOKS
// =====================================

// Declare War Mutation
export function useDeclareWar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      authSupabase,
    }: {
      request: DeclareWarRequest;
      authSupabase?: any;
    }) => declareWar(request, authSupabase),

    onSuccess: (result: DeclareWarResponse, { request }) => {
      if (result.success) {
        // Invalidate war-related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.territories.activeWars(),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.territories.warsByFamily(request.attacker_family_id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.territories.warForTerritory(request.territory_id),
        });

        // Invalidate family dashboards
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'families' &&
                   query.queryKey[1] === 'dashboard';
          }
        });

        // Invalidate territory control
        queryClient.invalidateQueries({
          queryKey: queryKeys.territories.control(request.territory_id),
        });
      }
    },
  });
}

// Participate in War Mutation
export function useParticipateInWar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      authSupabase,
    }: {
      request: ParticipateinWarRequest;
      authSupabase?: any;
    }) => participateInWar(request, authSupabase),

    onSuccess: (result: WarParticipationResponse, { request }) => {
      if (result.success) {
        // Invalidate war participants
        queryClient.invalidateQueries({
          queryKey: queryKeys.territories.battleParticipants(request.war_id),
        });

        // Invalidate war details
        queryClient.invalidateQueries({
          queryKey: queryKeys.territories.war(request.war_id),
        });

        // Invalidate war events
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.territories.war(request.war_id), 'events'],
        });

        // Invalidate player data (energy spent, potential damage)
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(request.player_id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.stats(request.player_id),
        });
      }
    },
  });
}

// Update Territory Control Mutation
export function useUpdateTerritoryControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      territoryId,
      familyId,
      authSupabase,
    }: {
      territoryId: string;
      familyId: string | null;
      authSupabase?: any;
    }) => updateTerritoryControl(territoryId, familyId, authSupabase),

    onSuccess: (success: boolean, { territoryId, familyId }) => {
      if (success) {
        // Invalidate territory control
        invalidationHelpers.invalidateTerritoryData(territoryId).forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });

        // Invalidate all territory controls
        queryClient.invalidateQueries({
          queryKey: queryKeys.territories.controls(),
        });

        // Invalidate family territories if family involved
        if (familyId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.territories.byFamily(familyId),
          });

          // Invalidate family data
          invalidationHelpers.invalidateFamilyData(familyId).forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
      }
    },
  });
}

// Execute Sabotage Mission Mutation
export function useExecuteSabotageMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      missionId,
      playerId,
      authSupabase,
    }: {
      missionId: string;
      playerId: string;
      authSupabase?: any;
    }) => executeSabotageMission(missionId, playerId, authSupabase),

    onSuccess: (result: any, { missionId, playerId }) => {
      if (result?.success) {
        // Invalidate sabotage missions
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'territories' &&
                   query.queryKey.includes('sabotageHistory');
          }
        });

        // Invalidate player data
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(playerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.economics(playerId),
        });

        // Invalidate mission executions
        queryClient.invalidateQueries({
          queryKey: queryKeys.territories.missionExecutions(missionId),
        });
      }
    },
  });
}

// Calculate Territory Income Mutation
export function useCalculateTerritoryIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      territoryId,
      authSupabase,
    }: {
      territoryId: string;
      authSupabase?: any;
    }) => calculateTerritoryIncome(territoryId, authSupabase),

    onSuccess: (result: TerritoryIncomeCalculation, { territoryId }) => {
      // Invalidate territory income data
      queryClient.invalidateQueries({
        queryKey: queryKeys.territories.income(territoryId),
      });

      // Invalidate family economics if territory has controlling family
      if (result.controlling_family_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.economics(result.controlling_family_id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.families.dashboard(result.controlling_family_id),
        });
      }
    },
  });
}

// Process Territory Payouts Mutation (Admin function)
export function useProcessTerritoryPayouts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => processTerritoryPayouts(),

    onSuccess: (success: boolean) => {
      if (success) {
        // Invalidate all territory income related queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'territories' &&
                   (query.queryKey.includes('income') ||
                    query.queryKey.includes('familyIncomeReport') ||
                    query.queryKey.includes('familyTerritoryReport'));
          }
        });

        // Invalidate all family economics
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'families' &&
                   (query.queryKey[1] === 'economics' || query.queryKey[1] === 'dashboard');
          }
        });
      }
    },
  });
}
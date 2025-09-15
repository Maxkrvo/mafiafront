'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { queryKeys, invalidationHelpers } from '@/lib/cache/query-keys';

// Real-time subscription hook for family data updates
export function useRealtimeFamilyUpdates(familyId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!familyId) return;

    // Subscribe to family member changes
    const memberSubscription = supabase
      .channel(`family_members:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_members',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          // Invalidate family-related queries when members change
          invalidationHelpers.invalidateFamilyData(familyId).forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });

          // Also invalidate any family dashboards for members of this family
          queryClient.invalidateQueries({
            predicate: (query) => {
              return query.queryKey[0] === 'families' &&
                     query.queryKey[1] === 'dashboard';
            }
          });
        }
      )
      .subscribe();

    // Subscribe to family activities
    const activitySubscription = supabase
      .channel(`family_activities:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_activities',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          // Invalidate activities and dashboard
          queryClient.invalidateQueries({
            queryKey: queryKeys.families.activities(familyId)
          });
          queryClient.invalidateQueries({
            predicate: (query) => {
              return query.queryKey[0] === 'families' &&
                     query.queryKey[1] === 'dashboard';
            }
          });
        }
      )
      .subscribe();

    // Subscribe to family economics changes
    const economicsSubscription = supabase
      .channel(`family_economics:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'family_economics',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.families.economics(familyId)
          });
          queryClient.invalidateQueries({
            predicate: (query) => {
              return query.queryKey[0] === 'families' &&
                     query.queryKey[1] === 'dashboard';
            }
          });
        }
      )
      .subscribe();

    return () => {
      memberSubscription.unsubscribe();
      activitySubscription.unsubscribe();
      economicsSubscription.unsubscribe();
    };
  }, [familyId, queryClient]);
}

// Real-time subscription hook for player data updates
export function useRealtimePlayerUpdates(playerId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    // Subscribe to player stats changes
    const statsSubscription = supabase
      .channel(`player_stats:${playerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_stats',
          filter: `player_id=eq.${playerId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.stats(playerId)
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.dashboard(playerId)
          });
        }
      )
      .subscribe();

    // Subscribe to player economics changes
    const economicsSubscription = supabase
      .channel(`player_economics:${playerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_economics',
          filter: `player_id=eq.${playerId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.economics(playerId)
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.statPoints(playerId)
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.dashboard(playerId)
          });
        }
      )
      .subscribe();

    // Subscribe to player profile changes
    const profileSubscription = supabase
      .channel(`players:${playerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `id=eq.${playerId}`,
        },
        () => {
          // Invalidate all player-related queries
          invalidationHelpers.invalidatePlayerData(playerId).forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
      )
      .subscribe();

    return () => {
      statsSubscription.unsubscribe();
      economicsSubscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, [playerId, queryClient]);
}

// Real-time subscription hook for territory updates
export function useRealtimeTerritoryUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to territory control changes
    const controlSubscription = supabase
      .channel('territory_control_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'territory_control',
        },
        () => {
          // Invalidate all territory-related queries
          queryClient.invalidateQueries({
            queryKey: queryKeys.territories.controls()
          });

          // Also invalidate family dashboards as territory changes affect income
          queryClient.invalidateQueries({
            predicate: (query) => {
              return query.queryKey[0] === 'families' &&
                     query.queryKey[1] === 'dashboard';
            }
          });
        }
      )
      .subscribe();

    // Subscribe to territory wars
    const warsSubscription = supabase
      .channel('territory_wars')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'territory_wars',
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.territories.wars()
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.territories.activeWars()
          });
        }
      )
      .subscribe();

    return () => {
      controlSubscription.unsubscribe();
      warsSubscription.unsubscribe();
    };
  }, [queryClient]);
}

// Combined real-time hook for dashboard components
export function useRealtimeDashboard(playerId: string | null, familyId: string | null) {
  useRealtimePlayerUpdates(playerId);
  useRealtimeFamilyUpdates(familyId);
  useRealtimeTerritoryUpdates();
}
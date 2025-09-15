"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/cache/query-keys";
import {
  fetchPlayerInventory,
  toggleItemEquipped,
  sellInventoryItem,
} from "@/lib/inventory-data";
import type { PlayerInventoryItem } from "@/lib/supabase/jobs-types";

// =====================================
// INVENTORY QUERY HOOKS
// =====================================

// Player Inventory Hook
export function usePlayerInventory(playerId: string) {
  return useQuery({
    queryKey: queryKeys.inventory.player(playerId),
    queryFn: () => fetchPlayerInventory(playerId),
    enabled: !!playerId,
    staleTime: 3 * 60 * 1000, // 3 minutes for inventory - changes when jobs completed or items sold/equipped
  });
}

// Filtered Inventory Hooks for different tabs
export function useFilteredInventory(
  playerId: string,
  filter: "all" | "equipped" | string // item_type or "equipped"
) {
  const { data: inventory = [], ...query } = usePlayerInventory(playerId);

  const filteredInventory = inventory.filter((item) => {
    if (filter === "all") return true;
    if (filter === "equipped") return item.is_equipped;
    return item.item_template?.item_type === filter;
  });

  return {
    ...query,
    data: filteredInventory,
  };
}

// Equipped Items Hook - useful for calculating player stats
export function useEquippedItems(playerId: string) {
  const { data: inventory = [], ...query } = usePlayerInventory(playerId);

  const equippedItems = inventory.filter((item) => item.is_equipped);

  return {
    ...query,
    data: equippedItems,
  };
}

// =====================================
// MUTATION HOOKS
// =====================================

// Toggle Item Equipped Mutation
export function useToggleItemEquipped() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inventoryId,
      currentEquipped,
    }: {
      inventoryId: string;
      currentEquipped: boolean;
    }) => toggleItemEquipped(inventoryId, currentEquipped),

    onSuccess: (success: boolean, { inventoryId, currentEquipped }, context: any) => {
      if (success) {
        // Get the player ID from the context or inventory item
        const playerId = context?.playerId;
        if (playerId) {
          // Invalidate inventory data
          queryClient.invalidateQueries({
            queryKey: queryKeys.inventory.player(playerId),
          });

          // Invalidate player stats since equipment affects stats
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.stats(playerId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.player.dashboard(playerId),
          });
        }
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async ({ inventoryId, currentEquipped }) => {
      // We need player ID for optimistic updates, but we might not have it
      // For now, we'll just rely on the onSuccess invalidation
      return {};
    },
  });
}

// Enhanced Toggle Item Equipped Mutation with Player ID
export function useToggleItemEquippedWithPlayer(playerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inventoryId,
      currentEquipped,
    }: {
      inventoryId: string;
      currentEquipped: boolean;
    }) => toggleItemEquipped(inventoryId, currentEquipped),

    onSuccess: (success: boolean) => {
      if (success) {
        // Invalidate inventory data
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventory.player(playerId),
        });

        // Invalidate player stats since equipment affects stats
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.stats(playerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(playerId),
        });
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async ({ inventoryId, currentEquipped }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.inventory.player(playerId),
      });

      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData<PlayerInventoryItem[]>(
        queryKeys.inventory.player(playerId)
      );

      // Optimistically update the inventory
      if (previousInventory) {
        const updatedInventory = previousInventory.map((item) =>
          item.id === inventoryId
            ? { ...item, is_equipped: !currentEquipped }
            : item
        );

        queryClient.setQueryData(
          queryKeys.inventory.player(playerId),
          updatedInventory
        );
      }

      // Return context object with the snapshotted value
      return { previousInventory };
    },

    // If the mutation fails, use the context to roll back
    onError: (err, variables, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(
          queryKeys.inventory.player(playerId),
          context.previousInventory
        );
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.player(playerId),
      });
    },
  });
}

// Sell Inventory Item Mutation
export function useSellInventoryItem(playerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inventoryId,
      value,
    }: {
      inventoryId: string;
      value: number;
    }) => sellInventoryItem(playerId, inventoryId, value),

    onSuccess: (success: boolean, { inventoryId, value }) => {
      if (success) {
        // Invalidate inventory data
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventory.player(playerId),
        });

        // Invalidate player economics since selling gives money
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.economics(playerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.player.dashboard(playerId),
        });
      }
    },

    // Optimistic update for immediate UI feedback
    onMutate: async ({ inventoryId, value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.inventory.player(playerId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.player.economics(playerId),
      });

      // Snapshot the previous values
      const previousInventory = queryClient.getQueryData<PlayerInventoryItem[]>(
        queryKeys.inventory.player(playerId)
      );
      const previousEconomics = queryClient.getQueryData(
        queryKeys.player.economics(playerId)
      );

      // Optimistically update the inventory (remove the item)
      if (previousInventory) {
        const updatedInventory = previousInventory.filter(
          (item) => item.id !== inventoryId
        );
        queryClient.setQueryData(
          queryKeys.inventory.player(playerId),
          updatedInventory
        );
      }

      // Optimistically update economics (add money)
      if (previousEconomics && typeof previousEconomics === "object" && "cash_on_hand" in previousEconomics) {
        const updatedEconomics = {
          ...previousEconomics,
          cash_on_hand: (previousEconomics.cash_on_hand as number) + value,
          total_earned: (previousEconomics.total_earned as number) + value,
        };
        queryClient.setQueryData(
          queryKeys.player.economics(playerId),
          updatedEconomics
        );
      }

      // Return context object with the snapshotted values
      return { previousInventory, previousEconomics };
    },

    // If the mutation fails, use the context to roll back
    onError: (err, variables, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(
          queryKeys.inventory.player(playerId),
          context.previousInventory
        );
      }
      if (context?.previousEconomics) {
        queryClient.setQueryData(
          queryKeys.player.economics(playerId),
          context.previousEconomics
        );
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.player(playerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.player.economics(playerId),
      });
    },
  });
}
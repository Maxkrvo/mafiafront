'use client';

import { supabase } from './supabase/client';
import { PlayerInventoryItem } from './supabase/jobs-types';

/**
 * Fetch player inventory with item template details
 */
export async function fetchPlayerInventory(playerId: string): Promise<PlayerInventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from("player_inventory")
      .select(`
        *,
        item_template:item_templates(*)
      `)
      .eq("player_id", playerId)
      .order("acquired_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

/**
 * Toggle equipment status for an inventory item
 */
export async function toggleItemEquipped(inventoryId: string, currentEquipped: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("player_inventory")
      .update({ is_equipped: !currentEquipped })
      .eq("id", inventoryId)
      .select()
      .single();

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating equipment:", error);
    return false;
  }
}

/**
 * Sell an inventory item and update player economics
 */
export async function sellInventoryItem(playerId: string, inventoryId: string, value: number): Promise<boolean> {
  try {
    // Add money to player economics
    const { error: economicsError } = await supabase
      .from("player_economics")
      .update({
        cash_on_hand: supabase.raw(`cash_on_hand + ${value}`),
        total_earned: supabase.raw(`total_earned + ${value}`),
      })
      .eq("player_id", playerId);

    if (economicsError) throw economicsError;

    // Remove item from inventory
    const { error: inventoryError } = await supabase
      .from("player_inventory")
      .delete()
      .eq("id", inventoryId);

    if (inventoryError) throw inventoryError;

    return true;
  } catch (error) {
    console.error("Error selling item:", error);
    return false;
  }
}
'use client';

import { Player } from './supabase/types';
import { calculateStatBonuses, PlayerStatPoints } from './stat-points';

export interface EffectivePlayerStats {
  maxHealth: number;
  maxEnergy: number;
  attackPower: number;
  defensePower: number;
  // Current values remain unchanged
  currentHealth: number;
  currentEnergy: number;
}

/**
 * Calculate effective player stats including stat point bonuses
 */
export function calculateEffectiveStats(
  player: Player,
  statPoints: PlayerStatPoints
): EffectivePlayerStats {
  const bonuses = calculateStatBonuses(statPoints.allocated);

  return {
    maxHealth: player.max_hp + bonuses.healthBonus,
    maxEnergy: player.max_energy + bonuses.energyBonus,
    attackPower: bonuses.attackBonus, // Base attack power comes from bonuses
    defensePower: bonuses.defenseBonus, // Base defense power comes from bonuses
    currentHealth: player.hp, // Current values are not modified by stat bonuses
    currentEnergy: player.energy
  };
}

/**
 * Calculate total attack power including equipment and bonuses
 */
export function calculateTotalAttackPower(
  statPoints: PlayerStatPoints,
  equipmentBonus: number = 0
): number {
  const bonuses = calculateStatBonuses(statPoints.allocated);
  return bonuses.attackBonus + equipmentBonus;
}

/**
 * Calculate total defense power including equipment and bonuses
 */
export function calculateTotalDefensePower(
  statPoints: PlayerStatPoints,
  equipmentBonus: number = 0
): number {
  const bonuses = calculateStatBonuses(statPoints.allocated);
  return bonuses.defenseBonus + equipmentBonus;
}

/**
 * Check if player's current health exceeds their new max health after stat allocation
 * If so, the current health should be capped to the new max
 */
export function shouldCapCurrentHealth(
  currentHealth: number,
  newMaxHealth: number
): boolean {
  return currentHealth > newMaxHealth;
}

/**
 * Check if player's current energy exceeds their new max energy after stat allocation
 * If so, the current energy should be capped to the new max
 */
export function shouldCapCurrentEnergy(
  currentEnergy: number,
  newMaxEnergy: number
): boolean {
  return currentEnergy > newMaxEnergy;
}
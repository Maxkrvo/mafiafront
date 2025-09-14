'use client';

export interface StatPointAllocation {
  health: number;
  energy: number;
  attack: number;
  defense: number;
}

export interface PlayerStatPoints {
  unspent: number;
  allocated: StatPointAllocation;
  totalEarned: number;
}

export interface StatBonuses {
  healthBonus: number;
  energyBonus: number;
  attackBonus: number;
  defenseBonus: number;
}

/**
 * Calculate stat bonuses from allocated stat points
 * Each stat point provides +10 to the corresponding stat
 */
export function calculateStatBonuses(allocation: StatPointAllocation): StatBonuses {
  return {
    healthBonus: allocation.health * 10,
    energyBonus: allocation.energy * 10,
    attackBonus: allocation.attack * 10,
    defenseBonus: allocation.defense * 10,
  };
}

/**
 * Validate a stat point allocation request
 */
export function validateAllocation(
  currentAllocation: StatPointAllocation,
  unspentPoints: number,
  newAllocation: Partial<StatPointAllocation>
): { valid: boolean; error?: string } {
  const totalCurrentSpent = Object.values(currentAllocation).reduce((sum, val) => sum + val, 0);
  const totalNewSpent = Object.values(newAllocation).reduce((sum, val) => sum + (val || 0), 0);
  const additionalPointsNeeded = totalNewSpent;

  if (additionalPointsNeeded > unspentPoints) {
    return {
      valid: false,
      error: `Not enough stat points. Need ${additionalPointsNeeded}, have ${unspentPoints}`
    };
  }

  // Check for negative values
  for (const [key, value] of Object.entries(newAllocation)) {
    if (value !== undefined && value < 0) {
      return {
        valid: false,
        error: `Cannot allocate negative points to ${key}`
      };
    }
  }

  return { valid: true };
}

/**
 * Get stat point allocation summary for UI display
 */
export function getStatPointSummary(statPoints: PlayerStatPoints): {
  totalSpent: number;
  breakdown: Array<{ stat: string; points: number; bonus: string }>;
} {
  const totalSpent = Object.values(statPoints.allocated).reduce((sum, val) => sum + val, 0);

  const breakdown = [
    {
      stat: 'Health',
      points: statPoints.allocated.health,
      bonus: `+${statPoints.allocated.health * 10} HP`
    },
    {
      stat: 'Energy',
      points: statPoints.allocated.energy,
      bonus: `+${statPoints.allocated.energy * 10} Energy`
    },
    {
      stat: 'Attack',
      points: statPoints.allocated.attack,
      bonus: `+${statPoints.allocated.attack * 10} Attack`
    },
    {
      stat: 'Defense',
      points: statPoints.allocated.defense,
      bonus: `+${statPoints.allocated.defense * 10} Defense`
    }
  ];

  return { totalSpent, breakdown };
}

/**
 * Calculate how many stat points a player should have earned by their level
 */
export function calculateTotalStatPointsForLevel(level: number): number {
  // 1 stat point per level, starting from level 2
  return Math.max(0, level - 1);
}

/**
 * Stat point allocation presets for new players
 */
export const STAT_ALLOCATION_PRESETS = {
  balanced: {
    name: 'Balanced Build',
    description: 'Equal focus on all stats',
    allocation: (points: number) => {
      const perStat = Math.floor(points / 4);
      const remainder = points % 4;
      return {
        health: perStat + (remainder > 0 ? 1 : 0),
        energy: perStat + (remainder > 1 ? 1 : 0),
        attack: perStat + (remainder > 2 ? 1 : 0),
        defense: perStat
      };
    }
  },
  tank: {
    name: 'Tank Build',
    description: 'Focus on health and defense',
    allocation: (points: number) => {
      const healthPoints = Math.ceil(points * 0.4);
      const defensePoints = Math.ceil(points * 0.4);
      const remaining = points - healthPoints - defensePoints;
      const energyPoints = Math.ceil(remaining / 2);
      const attackPoints = remaining - energyPoints;

      return {
        health: healthPoints,
        energy: energyPoints,
        attack: attackPoints,
        defense: defensePoints
      };
    }
  },
  dps: {
    name: 'DPS Build',
    description: 'Focus on attack and energy',
    allocation: (points: number) => {
      const attackPoints = Math.ceil(points * 0.5);
      const energyPoints = Math.ceil(points * 0.3);
      const remaining = points - attackPoints - energyPoints;
      const healthPoints = Math.ceil(remaining / 2);
      const defensePoints = remaining - healthPoints;

      return {
        health: healthPoints,
        energy: energyPoints,
        attack: attackPoints,
        defense: defensePoints
      };
    }
  }
};
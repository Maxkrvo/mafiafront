// Level System Implementation
// Provides uncapped progression tied to experience points

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpToNext: number;
  xpForCurrentLevel: number;
  progress: number; // 0-1 progress to next level
  benefits: LevelBenefits;
}

export interface LevelBenefits {
  attackBonus: number;
  defenseBonus: number;
  energyBonus: number;
  hpBonus: number;
}

/**
 * Calculate level from experience points using exponential scaling
 * Formula: Level = floor(sqrt(XP / 100))
 * This provides reasonable progression: Level 10 = 10,000 XP, Level 50 = 250,000 XP
 */
export function calculateLevel(experiencePoints: number): number {
  if (experiencePoints <= 0) return 1;
  return Math.max(1, Math.floor(Math.sqrt(experiencePoints / 100)));
}

/**
 * Calculate XP required to reach a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return level * level * 100;
}

/**
 * Get detailed level information including progress to next level
 */
export function getLevelInfo(experiencePoints: number): LevelInfo {
  const currentLevel = calculateLevel(experiencePoints);
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpToNext = xpForNextLevel - experiencePoints;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const xpGainedInCurrentLevel = experiencePoints - xpForCurrentLevel;
  const progress = xpNeededForNextLevel > 0 ? xpGainedInCurrentLevel / xpNeededForNextLevel : 1;

  return {
    level: currentLevel,
    currentXP: experiencePoints,
    xpToNext,
    xpForCurrentLevel,
    progress: Math.min(1, Math.max(0, progress)),
    benefits: getLevelBenefits(currentLevel)
  };
}

/**
 * Calculate stat bonuses from level progression
 * Small but meaningful bonuses to encourage progression
 */
export function getLevelBenefits(level: number): LevelBenefits {
  // Each level gives +1 to stats, with milestone bonuses every 10 levels
  const baseBonus = Math.max(0, level - 1);
  const milestoneBonus = Math.floor(level / 10) * 5;
  
  return {
    attackBonus: baseBonus + milestoneBonus,
    defenseBonus: baseBonus + milestoneBonus,
    energyBonus: Math.floor(level / 5) * 5, // +5 max energy every 5 levels
    hpBonus: Math.floor(level / 5) * 5, // +5 max HP every 5 levels
  };
}

/**
 * Check if player meets level requirements for rank advancement
 */
export function canAdvanceToRank(
  currentRank: string,
  level: number,
  reputation: number
): { canAdvance: boolean; nextRank?: string; requirements?: string } {
  const rankRequirements = {
    'Associate': { nextRank: 'Soldier', minLevel: 10, minReputation: 500 },
    'Soldier': { nextRank: 'Capo', minLevel: 25, minReputation: 2000 },
    'Capo': { nextRank: 'Don', minLevel: 50, minReputation: 10000 },
    'Don': null // Max rank
  };

  const requirement = rankRequirements[currentRank as keyof typeof rankRequirements];
  
  if (!requirement) {
    return { canAdvance: false };
  }

  const meetsLevel = level >= requirement.minLevel;
  const meetsReputation = reputation >= requirement.minReputation;
  const canAdvance = meetsLevel && meetsReputation;

  if (canAdvance) {
    return { 
      canAdvance: true, 
      nextRank: requirement.nextRank 
    };
  }

  const missingRequirements = [];
  if (!meetsLevel) missingRequirements.push(`Level ${requirement.minLevel}`);
  if (!meetsReputation) missingRequirements.push(`${requirement.minReputation.toLocaleString()} reputation`);

  return {
    canAdvance: false,
    nextRank: requirement.nextRank,
    requirements: `Requires: ${missingRequirements.join(', ')}`
  };
}

/**
 * Get level progression milestones for UI display
 */
export function getLevelMilestones(): Array<{ level: number; xp: number; description: string }> {
  return [
    { level: 1, xp: 0, description: "Street Thug" },
    { level: 5, xp: 2500, description: "Seasoned Criminal" },
    { level: 10, xp: 10000, description: "Made Member" },
    { level: 15, xp: 22500, description: "Respected Soldier" },
    { level: 20, xp: 40000, description: "Lieutenant Material" },
    { level: 25, xp: 62500, description: "Capo Candidate" },
    { level: 30, xp: 90000, description: "Family Enforcer" },
    { level: 40, xp: 160000, description: "Underboss Material" },
    { level: 50, xp: 250000, description: "Don Candidate" },
    { level: 75, xp: 562500, description: "Crime Lord" },
    { level: 100, xp: 1000000, description: "Criminal Mastermind" }
  ];
}

/**
 * Format XP numbers for display
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toLocaleString();
}

/**
 * Get descriptive title based on level
 */
export function getLevelTitle(level: number): string {
  const milestones = getLevelMilestones();
  
  // Find the highest milestone we've reached
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (level >= milestones[i].level) {
      return milestones[i].description;
    }
  }
  
  return "Street Thug";
}
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
  moneyReward: number;
  statPointsEarned: number;
}

/**
 * Calculate level from experience points using hybrid scaling
 * Early levels (1-20): More forgiving linear progression
 * Later levels (21+): Exponential scaling for long-term progression
 */
export function calculateLevel(experiencePoints: number): number {
  if (experiencePoints <= 0) return 1;

  // Early game progression (levels 1-20): 100 XP per level
  if (experiencePoints <= 2000) {
    return Math.min(20, Math.max(1, Math.floor(experiencePoints / 100) + 1));
  }

  // Mid-late game progression (21+): Exponential scaling
  const remainingXP = experiencePoints - 2000;
  const additionalLevels = Math.floor(Math.sqrt(remainingXP / 200));
  return Math.max(20, 20 + additionalLevels);
}

/**
 * Calculate XP required to reach a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;

  // Early levels (1-20): 100 XP per level
  if (level <= 20) {
    return (level - 1) * 100;
  }

  // Later levels: Base 2000 XP + exponential scaling
  const additionalLevels = level - 20;
  return 2000 + additionalLevels * additionalLevels * 200;
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
  const progress =
    xpNeededForNextLevel > 0
      ? xpGainedInCurrentLevel / xpNeededForNextLevel
      : 1;

  return {
    level: currentLevel,
    currentXP: experiencePoints,
    xpToNext,
    xpForCurrentLevel,
    progress: Math.min(1, Math.max(0, progress)),
    benefits: getLevelBenefits(currentLevel),
  };
}

/**
 * Calculate stat bonuses and money rewards from level progression
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
    moneyReward: calculateLevelUpReward(level),
    statPointsEarned: Math.max(0, level - 1), // 1 stat point per level starting from level 2
  };
}

/**
 * Calculate money reward for reaching a specific level
 * Generous early game rewards that scale significantly
 */
export function calculateLevelUpReward(level: number): number {
  if (level <= 1) return 0;

  // Early levels (2-10): Base reward $500-$5000
  if (level <= 10) {
    return level * 500;
  }

  // Mid levels (11-25): $1000 per level with bonus
  if (level <= 25) {
    return 5000 + (level - 10) * 1000;
  }

  // High levels (26-50): $2500 per level with bonus
  if (level <= 50) {
    return 20000 + (level - 25) * 2500;
  }

  // Elite levels (51+): $5000 per level with milestone bonuses
  const baseReward = 82500 + (level - 50) * 5000;
  const milestoneBonus = Math.floor(level / 10) * 10000; // Extra $10k every 10 levels

  return baseReward + milestoneBonus;
}

/**
 * Calculate stat points earned when leveling up from old level to new level
 */
export function calculateStatPointsEarned(
  oldLevel: number,
  newLevel: number
): number {
  // 1 stat point per level gained, starting from level 2
  const oldPoints = Math.max(0, oldLevel - 1);
  const newPoints = Math.max(0, newLevel - 1);
  return newPoints - oldPoints;
}

/**
 * Check if player meets level requirements for rank advancement
 * Spaced out more for meaningful progression milestones
 */
export function canAdvanceToRank(
  currentRank: string,
  level: number,
  reputation: number
): { canAdvance: boolean; nextRank?: string; requirements?: string } {
  const rankRequirements = {
    Associate: { nextRank: "Soldier", minLevel: 15, minReputation: 1000 },
    Soldier: { nextRank: "Capo", minLevel: 35, minReputation: 5000 },
    Capo: { nextRank: "Don", minLevel: 75, minReputation: 25000 },
    Don: null, // Max rank
  };

  const requirement =
    rankRequirements[currentRank as keyof typeof rankRequirements];

  if (!requirement) {
    return { canAdvance: false };
  }

  const meetsLevel = level >= requirement.minLevel;
  const meetsReputation = reputation >= requirement.minReputation;
  const canAdvance = meetsLevel && meetsReputation;

  if (canAdvance) {
    return {
      canAdvance: true,
      nextRank: requirement.nextRank,
    };
  }

  const missingRequirements = [];
  if (!meetsLevel) missingRequirements.push(`Level ${requirement.minLevel}`);
  if (!meetsReputation)
    missingRequirements.push(
      `${requirement.minReputation.toLocaleString()} reputation`
    );

  return {
    canAdvance: false,
    nextRank: requirement.nextRank,
    requirements: `Requires: ${missingRequirements.join(", ")}`,
  };
}

/**
 * Get level progression milestones for UI display
 * More frequent milestones for better progression feedback
 */
export function getLevelMilestones(): Array<{
  level: number;
  xp: number;
  description: string;
  reward: number;
}> {
  return [
    // Early progression (1–10) - every 2 levels
    { level: 1, xp: 0, description: "Street Thug", reward: 0 },
    { level: 2, xp: 100, description: "Petty Criminal", reward: 1000 },
    { level: 4, xp: 300, description: "Corner Hustler", reward: 1500 },
    { level: 6, xp: 500, description: "Small Time Crook", reward: 2000 },
    { level: 8, xp: 700, description: "Seasoned Criminal", reward: 2500 },
    { level: 10, xp: 900, description: "Gang Associate", reward: 3000 },

    // Mid progression (11–25) - every 2–3 levels
    { level: 12, xp: 1100, description: "Crew Runner", reward: 3500 },
    { level: 14, xp: 1300, description: "Numbers Runner", reward: 4000 },
    { level: 16, xp: 1500, description: "Muscle for Hire", reward: 4500 },
    { level: 18, xp: 1700, description: "Made Member", reward: 5000 },
    { level: 20, xp: 1900, description: "Family Soldier", reward: 6000 },
    { level: 22, xp: 2300, description: "Bookmaker", reward: 7000 },
    { level: 24, xp: 2700, description: "Loan Shark", reward: 8000 },
    { level: 25, xp: 2900, description: "Protection Racketeer", reward: 9000 },

    // High progression (26–50) - every 3–5 levels
    { level: 28, xp: 3500, description: "Respected Soldier", reward: 10000 },
    { level: 30, xp: 4000, description: "Territory Controller", reward: 11000 },
    { level: 32, xp: 4800, description: "Crew Leader", reward: 12000 },
    { level: 35, xp: 6300, description: "Operations Manager", reward: 13000 },
    { level: 38, xp: 8000, description: "Street Captain", reward: 14000 },
    { level: 40, xp: 10000, description: "Lieutenant Material", reward: 15000 },
    { level: 42, xp: 12200, description: "Business Partner", reward: 16000 },
    { level: 45, xp: 15500, description: "Vice Coordinator", reward: 17000 },
    { level: 48, xp: 19000, description: "Regional Enforcer", reward: 18000 },
    { level: 50, xp: 22800, description: "Family Advisor", reward: 19000 },

    // Elite progression (51–100) - only major levels
    { level: 55, xp: 27800, description: "Capo Candidate", reward: 20000 },
    { level: 60, xp: 33800, description: "Junior Capo", reward: 22500 },
    { level: 65, xp: 40800, description: "District Manager", reward: 27500 },
    { level: 70, xp: 48800, description: "Family Enforcer", reward: 32500 },
    { level: 75, xp: 57800, description: "Operations Chief", reward: 37500 },
    { level: 80, xp: 67800, description: "Senior Capo", reward: 45000 },
    { level: 85, xp: 78800, description: "Regional Boss", reward: 52500 },
    { level: 90, xp: 90800, description: "Underboss Material", reward: 60000 },
    { level: 95, xp: 103800, description: "Family Consigliere", reward: 67500 },
    { level: 100, xp: 117800, description: "Territory Don", reward: 77500 },

    // Legendary progression (100+)
    { level: 110, xp: 137800, description: "Vice Lieutenant", reward: 87500 },
    { level: 125, xp: 167800, description: "Don Candidate", reward: 97500 },
    { level: 150, xp: 217800, description: "Family Don", reward: 122500 },
    {
      level: 175,
      xp: 278000,
      description: "Commission Member",
      reward: 147500,
    },
    { level: 200, xp: 338000, description: "Regional Kingpin", reward: 172500 },
    { level: 225, xp: 408000, description: "Criminal Empire", reward: 197500 },
    { level: 250, xp: 488000, description: "Crime Lord", reward: 222500 },
    {
      level: 275,
      xp: 578000,
      description: "Shadow Government",
      reward: 247500,
    },
    { level: 300, xp: 678000, description: "Global Syndicate", reward: 272500 },
    {
      level: 350,
      xp: 788000,
      description: "Underworld Emperor",
      reward: 297500,
    },
    { level: 400, xp: 908000, description: "Criminal Legend", reward: 322500 },
    {
      level: 450,
      xp: 1038000,
      description: "Criminal Mastermind",
      reward: 347500,
    },
    { level: 500, xp: 1178000, description: "Mythical Boss", reward: 397500 },
    { level: 600, xp: 1678000, description: "Crime Deity", reward: 472500 },
    { level: 750, xp: 2178000, description: "Underworld God", reward: 597500 },
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

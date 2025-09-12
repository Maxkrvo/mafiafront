// Job System Types

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  category: 'street' | 'racket' | 'heist' | 'political' | 'territory';
  required_rank: 'Associate' | 'Soldier' | 'Capo' | 'Don';
  energy_cost: number;
  base_payout_min: number;
  base_payout_max: number;
  success_rate_base: number;
  risk_level: number; // 1-5
  experience_reward: number;
  reputation_reward: number;
  cooldown_minutes: number;
  required_attack_power: number;
  required_defense_power: number;
  icon_name: string | null;
  flavor_text: string | null;
  created_at: string;
}

export interface ItemTemplate {
  id: string;
  name: string;
  description: string;
  item_type: 'weapon' | 'protection' | 'tool' | 'consumable' | 'money';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  attack_power: number;
  defense_power: number;
  special_bonus: Record<string, unknown>; // JSON object for special effects
  base_value: number;
  icon_name: string | null;
  flavor_text: string | null;
  can_stack: boolean;
  max_stack_size: number;
  created_at: string;
}

export interface PlayerInventoryItem {
  id: string;
  player_id: string;
  item_template_id: string;
  quantity: number;
  is_equipped: boolean;
  acquired_at: string;
  // Joined data from item_templates
  item_template?: ItemTemplate;
}

export interface PlayerEconomics {
  player_id: string;
  cash_on_hand: number;
  total_earned: number;
  total_spent: number;
  heat_level: number; // 0-100
  territory_owned: number;
  experience_points: number;
  attack_power: number;
  defense_power: number;
  last_job_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobExecution {
  id: string;
  player_id: string;
  job_template_id: string;
  success: boolean;
  payout: number;
  energy_spent: number;
  experience_gained: number;
  reputation_gained: number;
  heat_gained: number;
  loot_gained: { item_template_id: string; quantity: number }[]; // Array of items received
  execution_details: Record<string, unknown>;
  executed_at: string;
  // Joined data
  job_template?: JobTemplate;
}

export interface Territory {
  id: string;
  name: string;
  description: string | null;
  controlled_by: string | null;
  income_per_hour: number;
  required_attack_power: number;
  last_income_collected: string;
  created_at: string;
}

export interface JobExecutionResult {
  success: boolean;
  job_success?: boolean;
  payout?: number;
  energy_spent?: number;
  experience_gained?: number;
  reputation_gained?: number;
  heat_gained?: number;
  loot_gained?: { item_template_id: string; quantity: number }[];
  message?: string;
  error?: string;
}

export interface PlayerCombatStats {
  attack_power: number;
  defense_power: number;
  total_attack: number; // Base + equipment
  total_defense: number; // Base + equipment
}

// Category configurations for UI
export const JOB_CATEGORIES = {
  street: {
    name: 'Street Operations',
    description: 'Basic criminal activities',
    color: '#8b7355', // Brown
    icon: '🏘️'
  },
  racket: {
    name: 'Organized Rackets', 
    description: 'Established criminal enterprises',
    color: '#722f37', // Wine red
    icon: '🏛️'
  },
  heist: {
    name: 'High-Stakes Heists',
    description: 'Dangerous but lucrative operations',
    color: '#8b0000', // Crimson
    icon: '💎'
  },
  political: {
    name: 'Political Corruption',
    description: 'Influence and manipulation',
    color: '#4a4a4a', // Smoke gray
    icon: '🏛️'
  },
  territory: {
    name: 'Territory Control',
    description: 'Expand family influence',
    color: '#d4af37', // Gold
    icon: '🗺️'
  }
} as const;

export const ITEM_RARITIES = {
  common: {
    name: 'Common',
    color: '#ffffff',
    borderColor: '#666666'
  },
  uncommon: {
    name: 'Uncommon',
    color: '#1eff00', 
    borderColor: '#0f7f00'
  },
  rare: {
    name: 'Rare',
    color: '#0099ff',
    borderColor: '#004d7f'
  },
  epic: {
    name: 'Epic', 
    color: '#cc00ff',
    borderColor: '#66007f'
  },
  legendary: {
    name: 'Legendary',
    color: '#ffaa00',
    borderColor: '#cc6600'
  }
} as const;

export const RANK_REQUIREMENTS = {
  Associate: {
    min_reputation: 0,
    min_level: 1
  },
  Soldier: {
    min_reputation: 500,
    min_level: 10
  },
  Capo: {
    min_reputation: 2000,
    min_level: 25
  },
  Don: {
    min_reputation: 10000,
    min_level: 50
  }
} as const;


export interface RankAdvancement {
  canAdvance: boolean;
  nextRank?: string;
  currentLevel: number;
  currentReputation: number;
  requirements?: string;
  message?: string;
}
// Territory System Types - matches database schema and TerritorySystemFoundation.md

// Core Enums - matches database enums
export type TerritoryType =
  | 'downtown'
  | 'docks'
  | 'warehouse'
  | 'casino'
  | 'neighborhood'
  | 'industrial'
  | 'smuggling'
  | 'political';

export type ResourceType =
  | 'cash'
  | 'contraband'
  | 'weapons'
  | 'influence'
  | 'information';

export type ControlStatus =
  | 'stable'
  | 'contested'
  | 'vulnerable'
  | 'consolidating';

export type ContestPhase =
  | 'scouting'
  | 'sabotage'
  | 'showdown'
  | 'consolidation';

// Core Territory Interface
export interface Territory {
  id: string;
  name: string;
  display_name: string;
  description?: string;

  // Map positioning
  map_x: number;
  map_y: number;
  territory_type: TerritoryType;

  // Economics
  base_income_per_hour: number;
  maintenance_cost_per_hour: number;
  control_difficulty: number; // 1-10 scale

  // Strategic value
  resource_types: ResourceType[];
  special_bonuses: TerritoryBonus[];
  adjacent_territories: string[]; // Array of territory IDs

  // Control mechanics
  min_defense_points: number;
  max_control_points: number;

  // Status
  is_contestable: boolean;
  is_strategic: boolean; // Key territories

  created_at: string;
  updated_at: string;
}

export interface TerritoryBonus {
  type: 'income_multiplier' | 'defense_bonus' | 'special_ability';
  value: number;
  description: string;
  applies_to: 'family' | 'territory' | 'adjacent_territories';
}

// Territory Control Interface
export interface TerritoryControl {
  id: string;
  territory_id: string;
  controlling_family_id: string;

  // Control status
  control_percentage: number; // 0-100%
  control_status: ControlStatus;

  // Defense infrastructure
  defense_points: number;
  guard_count: number;
  fortification_level: number; // 0-5

  // Income generation
  income_modifier: number; // Multiplier for base income
  total_income_generated: number;
  last_income_at: string;

  // Control history
  controlled_since: string;
  last_contested_at?: string;
  times_contested: number;

  // Warfare status
  under_attack: boolean;
  contest_phase?: ContestPhase;
  contest_expires_at?: string;

  created_at: string;
  updated_at: string;

  // Joined data (optional)
  territory?: Territory;
  controlling_family?: {
    id: string;
    name: string;
    display_name: string;
    color_hex: string;
  };
}

// Territory War Interface
export interface TerritoryWar {
  id: string;
  territory_id: string;
  attacking_family_id: string;
  defending_family_id: string;

  // War status
  current_phase: ContestPhase;
  phase_started_at: string;
  phase_duration_hours: number;

  // Battle mechanics
  attacking_pressure: number;
  defending_pressure: number;
  control_bar_position: number; // -100 to +100

  // Victory conditions
  victory_threshold: number; // Pressure difference needed to win
  stalemate_timer: number; // Hours until automatic draw

  // War outcome
  winner_family_id?: string;
  war_ended_at?: string;
  ending_reason?: 'victory' | 'stalemate' | 'cancelled';

  // Metadata
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;

  // Joined data (optional)
  territory?: Territory;
  attacking_family?: {
    id: string;
    name: string;
    display_name: string;
    color_hex: string;
  };
  defending_family?: {
    id: string;
    name: string;
    display_name: string;
    color_hex: string;
  };
}

// War Participation Interface
export interface BattleParticipant {
  id: string;
  war_id: string;
  player_id: string;
  family_id: string;

  // Participation stats
  contribution_score: number;
  missions_completed: number;
  supplies_provided: number;
  guard_duty_hours: number;

  // Activity tracking
  last_action_at: string;
  total_actions: number;

  created_at: string;
  updated_at: string;

  // Joined data (optional)
  player?: {
    id: string;
    nickname: string;
    username: string;
    avatar_url?: string;
  };
}

// War Event Interface
export interface PressureEvent {
  id: string;
  war_id: string;
  player_id?: string;

  // Event details
  event_type: 'mission_success' | 'mission_failure' | 'supply_delivery' | 'guard_duty';
  event_phase: ContestPhase;
  pressure_change: number;
  description?: string;

  // Metadata
  metadata: Record<string, any>;

  created_at: string;

  // Joined data (optional)
  player?: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
}

// Sabotage Mission Interface
export interface SabotageMission {
  id: string;
  war_id: string;
  name: string;
  description?: string;

  // Mission requirements
  energy_cost: number;
  required_rank: string;
  success_rate: number; // 0-100%
  risk_level: number; // 1-5

  // Mission rewards
  sabotage_points: number;
  pressure_impact: number;

  // Special requirements
  requires_intel: boolean;
  required_items: string[];
  cooldown_hours: number;

  // Status
  is_active: boolean;
  max_completions?: number; // -1 for unlimited
  current_completions: number;

  created_at: string;
  updated_at: string;
}

// Mission Execution Interface
export interface MissionExecution {
  id: string;
  mission_id: string;
  player_id: string;
  war_id: string;

  // Execution details
  success: boolean;
  energy_spent: number;
  pressure_generated: number;
  sabotage_points_earned: number;

  // Results
  execution_details: Record<string, any>;
  consequences: Record<string, any>;

  executed_at: string;

  // Joined data (optional)
  mission?: SabotageMission;
  player?: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
}

// Territory Income System
export interface TerritoryIncomeCalculation {
  territory_id: string;
  gross_income: number;
  maintenance_cost: number;
  net_income: number;
  bonuses_applied: Record<string, any>;
}

export interface TerritoryIncomeHistory {
  id: string;
  territory_id: string;
  controlling_family_id: string;

  // Income details
  gross_income: number;
  maintenance_costs: number;
  net_income: number;

  // Modifiers applied
  base_multiplier: number;
  control_percentage_bonus: number;
  fortification_bonus: number;
  synergy_bonuses: Record<string, any>;

  // Period
  income_period_start: string;
  income_period_end: string;

  created_at: string;
}

// Map Configuration
export interface TerritoryMapConfig {
  gridWidth: number; // 8
  gridHeight: number; // 8
  totalTerritories: number; // 64

  districts: {
    downtown: { x: number; y: number; width: number; height: number };
    docks: { x: number; y: number; width: number; height: number };
    industrial: { x: number; y: number; width: number; height: number };
    casino_row: { x: number; y: number; width: number; height: number };
    // ... more districts
  };
}

// Intelligence System
export interface IntelReport {
  defense_strength: number;
  guard_count: number;
  fortification_details: string[];
  income_estimates: number;
  vulnerabilities: string[];
  recommended_strategy: WarStrategy;
}

export interface GuardSchedule {
  shift_start: string;
  shift_end: string;
  guard_count: number;
  vulnerability_window: boolean;
}

export interface ResourceIntel {
  estimated_cash_flow: number;
  contraband_storage: number;
  weapon_caches: number;
  influence_networks: string[];
}

export type WarStrategy = 'direct_assault' | 'sabotage_first' | 'long_siege' | 'negotiate';
export type AlertLevel = 'none' | 'low' | 'medium' | 'high' | 'maximum';

// Phase-specific Interfaces
export interface ScoutingPhase {
  phase: 'scouting';
  duration_hours: number; // 2-6 based on territory difficulty

  // Intelligence gathering
  intel_missions_completed: number;
  intel_quality: number; // 0-100%
  discovery_risk: number; // Chance of being caught

  // Gathered intelligence
  enemy_strength: number;
  defense_weaknesses: string[];
  guard_schedules: GuardSchedule[];
  resource_information: ResourceIntel;

  // Participants
  scouts: string[]; // Player IDs
  scout_contributions: Record<string, number>;

  // Outcomes
  intel_gathered: IntelReport;
  discovered: boolean; // If scouting was detected
  alerts_triggered: AlertLevel;
}

export interface SabotagePhase {
  phase: 'sabotage';
  duration_hours: number; // Variable based on coordination

  // Sabotage activities
  supply_lines_cut: number;
  officials_bribed: number;
  warehouses_burned: number;
  communications_disrupted: boolean;

  // Defense weakening
  defense_reduction: number; // Points reduced
  guard_morale_impact: number;
  fortification_damage: number;

  // Coordination requirements
  required_missions: SabotageMission[];
  completed_missions: number;
  family_coordination_score: number;

  // Risk & Consequences
  heat_generated: number;
  retaliation_risk: number;
  police_attention: number;

  // Progress tracking
  total_sabotage_points: number;
  sabotage_threshold: number; // Points needed to advance
}

export interface ShowdownPhase {
  phase: 'showdown';
  duration_hours: number; // 12-48 based on family strength

  // Tug-of-war mechanics
  attacking_pressure: number;
  defending_pressure: number;
  control_bar_position: number; // -100 to +100

  // Battle participation
  attacking_participants: BattleParticipant[];
  defending_participants: BattleParticipant[];

  // Real-time tracking
  pressure_events: PressureEvent[];
  momentum_shifts: MomentumShift[];
  critical_moments: CriticalMoment[];

  // Dynamic factors
  weather_modifier: number;
  time_of_day_modifier: number;
  morale_factors: MoraleFactor[];

  // Victory conditions
  victory_threshold: number; // Pressure difference needed to win
  stalemate_timer: number; // Hours until automatic draw

  // Participation rewards/penalties
  contribution_tracking: Record<string, ContributionScore>;
}

export interface ConsolidationPhase {
  phase: 'consolidation';
  duration_hours: number; // 6-24 hours

  // Defense establishment
  new_guards_assigned: number;
  fortifications_built: number;
  supply_lines_established: boolean;

  // Counter-attack defense
  counter_attack_attempts: CounterAttack[];
  defense_successful: boolean;
  security_level: number;

  // Territory integration
  locals_pacified: boolean;
  businesses_contacted: number;
  tribute_established: boolean;
  information_networks_setup: boolean;

  // Final outcome
  control_secured: boolean;
  final_control_percentage: number;
  consolidation_bonuses: ConsolidationBonus[];
}

// Supporting Interfaces
export interface MomentumShift {
  timestamp: string;
  shift_type: 'major_victory' | 'devastating_loss' | 'tactical_advantage' | 'morale_boost';
  pressure_impact: number;
  description: string;
}

export interface CriticalMoment {
  timestamp: string;
  moment_type: 'last_stand' | 'breakthrough' | 'betrayal' | 'reinforcements';
  impact_description: string;
  pressure_change: number;
}

export interface MoraleFactor {
  factor_type: 'leadership_present' | 'recent_losses' | 'home_advantage' | 'superior_equipment';
  modifier: number;
  description: string;
}

export interface ContributionScore {
  player_id: string;
  total_contribution: number;
  missions_completed: number;
  supplies_provided: number;
  leadership_actions: number;
}

export interface CounterAttack {
  attacking_family_id: string;
  attack_strength: number;
  timestamp: string;
  success: boolean;
  casualties: number;
  description: string;
}

export interface ConsolidationBonus {
  bonus_type: 'quick_consolidation' | 'minimal_casualties' | 'local_support' | 'resource_capture';
  bonus_value: number;
  description: string;
}

// Territory Synergy System
export interface TerritorySynergy {
  // Adjacent bonuses
  adjacent_same_type: number; // Bonus for controlling adjacent same-type territories
  adjacent_complementary: Record<TerritoryType, number>; // Bonuses for complementary types

  // District control bonuses
  district_control_bonus: number; // Bonus for controlling entire districts
  strategic_chokepoints: string[]; // Key territories that provide network bonuses

  // Resource flow
  supply_chains: SupplyChain[];
  trade_routes: TradeRoute[];
}

export interface SupplyChain {
  source_territory_id: string;
  destination_territory_id: string;
  resource_type: ResourceType;
  efficiency_bonus: number;
  vulnerability: number; // Can be disrupted by enemies
}

export interface TradeRoute {
  territory_ids: string[];
  resource_type: ResourceType;
  daily_volume: number;
  security_level: number;
}

// Territory Job Integration
export interface TerritoryJob {
  id: string;
  name: string;
  description: string;
  category: 'territory';

  // Territory context
  territory_context: {
    territory_id: string;
    war_phase?: ContestPhase;
    requires_control: boolean;
    affects_pressure: number;
    sabotage_points: number;
    intel_value?: number;
    duration_hours?: number;
  };

  // Standard job properties
  energy_cost: number;
  success_rate: number;
  risk_level: number;
  required_rank: string;
  cooldown_minutes: number;
}

// API Request/Response Types
export interface DeclareWarRequest {
  territory_id: string;
  attacking_family_id: string;
}

export interface DeclareWarResponse {
  success: boolean;
  war?: TerritoryWar;
  error?: string;
}

export interface ParticipateinWarRequest {
  war_id: string;
  action_type: 'scout' | 'sabotage' | 'attack' | 'defend' | 'supply';
  mission_id?: string;
}

export interface WarParticipationResponse {
  success: boolean;
  pressure_change?: number;
  contribution_points?: number;
  phase_advanced?: boolean;
  error?: string;
}

export interface TerritoryIncomeReport {
  territory_id: string;
  territory_name: string;
  gross_income: number;
  maintenance_costs: number;
  net_income: number;
  control_percentage: number;
  bonuses_applied: TerritoryBonus[];
}

export interface FamilyTerritoryReport {
  total_territories: number;
  total_gross_income: number;
  total_maintenance: number;
  total_net_income: number;
  territory_details: TerritoryIncomeReport[];
  last_calculated: string;
}

// Constants and Configuration
export const TERRITORY_CONSTANTS = {
  MAP_WIDTH: 8,
  MAP_HEIGHT: 8,
  TOTAL_TERRITORIES: 64,
  MAX_FORTIFICATION_LEVEL: 5,
  MIN_CONTROL_DIFFICULTY: 1,
  MAX_CONTROL_DIFFICULTY: 10,
  PHASE_DURATIONS: {
    scouting: { min: 2, max: 6 },
    sabotage: { min: 6, max: 12 },
    showdown: { min: 12, max: 48 },
    consolidation: { min: 6, max: 24 },
  },
  INCOME_MULTIPLIERS: {
    fortification: 0.05, // 5% per fortification level
    control_percentage: 1.0, // 100% at full control
    adjacent_bonus: 0.1, // 10% per adjacent same-type territory
  },
} as const;

export const TERRITORY_TYPE_CONFIG: Record<TerritoryType, {
  name: string;
  description: string;
  color: string;
  icon: string;
  base_income_range: [number, number];
  difficulty_range: [number, number];
  common_resources: ResourceType[];
}> = {
  downtown: {
    name: 'Downtown Core',
    description: 'High-value commercial districts with maximum visibility',
    color: '#ffd700',
    icon: '🏢',
    base_income_range: [200, 400],
    difficulty_range: [7, 10],
    common_resources: ['cash', 'influence'],
  },
  docks: {
    name: 'Harbor District',
    description: 'Import/export hub with smuggling opportunities',
    color: '#4682b4',
    icon: '🚢',
    base_income_range: [150, 300],
    difficulty_range: [5, 8],
    common_resources: ['contraband', 'cash'],
  },
  warehouse: {
    name: 'Industrial Storage',
    description: 'Storage facilities and logistics centers',
    color: '#8b4513',
    icon: '🏭',
    base_income_range: [100, 200],
    difficulty_range: [3, 6],
    common_resources: ['contraband', 'weapons'],
  },
  casino: {
    name: 'Entertainment District',
    description: 'Gambling and entertainment venues',
    color: '#dc143c',
    icon: '🎰',
    base_income_range: [175, 350],
    difficulty_range: [4, 7],
    common_resources: ['cash', 'information'],
  },
  neighborhood: {
    name: 'Residential Area',
    description: 'Stable communities with consistent tribute',
    color: '#32cd32',
    icon: '🏘️',
    base_income_range: [75, 150],
    difficulty_range: [2, 5],
    common_resources: ['cash', 'information'],
  },
  industrial: {
    name: 'Manufacturing Zone',
    description: 'Factories and production facilities',
    color: '#696969',
    icon: '🏭',
    base_income_range: [125, 250],
    difficulty_range: [4, 7],
    common_resources: ['weapons', 'contraband'],
  },
  smuggling: {
    name: 'Black Market Hub',
    description: 'High-risk, high-reward illegal operations',
    color: '#8b0000',
    icon: '🚪',
    base_income_range: [250, 500],
    difficulty_range: [8, 10],
    common_resources: ['contraband', 'weapons', 'cash'],
  },
  political: {
    name: 'Government District',
    description: 'Centers of political power and corruption',
    color: '#4b0082',
    icon: '🏛️',
    base_income_range: [300, 600],
    difficulty_range: [9, 10],
    common_resources: ['influence', 'information'],
  },
} as const;

// Resource Type Configuration
export const RESOURCE_TYPE_CONFIG: Record<ResourceType, {
  name: string;
  description: string;
  color: string;
  icon: string;
}> = {
  cash: {
    name: 'Cash',
    description: 'Direct monetary income',
    color: '#228b22',
    icon: '💰',
  },
  contraband: {
    name: 'Contraband',
    description: 'Illegal goods and substances',
    color: '#8b0000',
    icon: '📦',
  },
  weapons: {
    name: 'Weapons',
    description: 'Arms and military equipment',
    color: '#2f4f4f',
    icon: '🔫',
  },
  influence: {
    name: 'Political Influence',
    description: 'Corruption and political connections',
    color: '#800080',
    icon: '🎭',
  },
  information: {
    name: 'Intelligence',
    description: 'Secrets and valuable information',
    color: '#4682b4',
    icon: '🕵️',
  },
} as const;
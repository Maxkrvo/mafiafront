// Family System Types - matches database schema

// Core Enums
export type FamilyRank = 'associate' | 'soldier' | 'caporegime' | 'underboss' | 'boss';

export type FamilyActivityType =
  | 'member_joined'
  | 'member_left'
  | 'member_kicked'
  | 'member_promoted'
  | 'member_demoted'
  | 'territory_captured'
  | 'territory_lost'
  | 'war_declared'
  | 'war_won'
  | 'war_lost'
  | 'alliance_formed'
  | 'alliance_broken'
  | 'tribute_received'
  | 'tribute_paid'
  | 'treasury_deposit'
  | 'treasury_withdrawal';

export type TerritoryType =
  | 'downtown'
  | 'docks'
  | 'warehouse'
  | 'casino'
  | 'neighborhood'
  | 'industrial'
  | 'smuggling'
  | 'political';

export type TerritoryControlStatus = 'stable' | 'contested' | 'vulnerable' | 'consolidating';

export type WarStatus = 'scouting' | 'sabotage' | 'showdown' | 'consolidation' | 'completed' | 'cancelled';

// Core Interfaces
export interface Family {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  motto?: string;
  color_hex: string;
  logo_url?: string;

  // Leadership
  boss_id?: string;
  underboss_id?: string;

  // Economics
  treasury_balance: number;
  total_income_generated: number;
  total_expenses: number;
  tax_rate: number;

  // Status
  reputation_score: number;
  total_territories: number;
  heat_level: number;
  respect_points: number;

  // Settings
  creation_fee_paid: number;
  created_by: string;
  is_active: boolean;
  is_recruiting: boolean;
  max_members: number;

  created_at: string;
  updated_at: string;
}

export interface FamilyPermissions {
  // Member Management
  can_invite_members: boolean;
  can_approve_requests: boolean;
  can_kick_members: boolean;
  can_promote_demote: boolean;
  can_set_member_titles: boolean;
  can_manage_permissions: boolean;

  // Territory Management
  can_view_territories: boolean;
  can_manage_territories: boolean;
  can_declare_wars: boolean;
  can_negotiate_peace: boolean;
  can_assign_guards: boolean;
  can_set_defenses: boolean;

  // Economic Powers
  can_view_treasury: boolean;
  can_manage_treasury: boolean;
  can_set_tax_rates: boolean;
  can_distribute_earnings: boolean;
  can_make_investments: boolean;
  can_authorize_expenses: boolean;

  // Strategic Powers
  can_form_alliances: boolean;
  can_declare_vendettas: boolean;
  can_access_intelligence: boolean;
  can_coordinate_operations: boolean;

  // Administrative
  can_edit_family_info: boolean;
  can_manage_family_settings: boolean;
  can_view_activity_logs: boolean;
  can_ban_members: boolean;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  player_id: string;

  // Hierarchy
  family_rank: FamilyRank;
  title?: string;

  // Permissions
  permissions: FamilyPermissions;

  // Economics
  contribution_total: number;
  earnings_received: number;
  last_contribution_at?: string;

  // Activity
  loyalty_score: number;
  activity_score: number;
  last_active_at: string;

  // Status
  join_requested_at?: string;
  joined_at: string;
  is_active: boolean;

  created_at: string;
  updated_at: string;

  // Joined data (optional)
  player?: {
    id: string;
    nickname: string;
    username: string;
    rank: string;
    avatar_url?: string;
  };
}

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
  control_difficulty: number;

  // Resources
  resource_types: string[];
  special_bonuses: TerritoryBonus[];

  // Control requirements
  min_defense_points: number;
  max_control_points: number;

  // Status
  is_contestable: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface TerritoryBonus {
  type: 'income_multiplier' | 'defense_bonus' | 'special_ability';
  value: number;
  description: string;
  applies_to: 'family' | 'territory' | 'adjacent_territories';
}

export interface TerritoryControl {
  id: string;
  territory_id: string;
  controlling_family_id: string;

  // Control status
  control_percentage: number;
  control_status: TerritoryControlStatus;

  // Defense
  defense_points: number;
  guard_count: number;
  fortification_level: number;

  // Economics
  income_modifier: number;
  total_income_generated: number;
  last_income_at: string;

  // History
  controlled_since: string;
  last_contested_at?: string;
  times_contested: number;

  // War status
  under_attack: boolean;
  contest_phase?: string;
  contest_expires_at?: string;

  created_at: string;
  updated_at: string;

  // Joined data (optional)
  territory?: Territory;
  controlling_family?: Family;
}

export interface FamilyEconomics {
  family_id: string;

  // Treasury
  treasury_balance: number;
  daily_income: number;
  daily_expenses: number;

  // Income sources
  territory_income: number;
  job_income: number;
  member_contributions: number;
  other_income: number;

  // Expenses
  territory_maintenance: number;
  war_expenses: number;
  recruitment_expenses: number;
  other_expenses: number;

  // Tax settings
  tax_rate: number;
  minimum_contribution: number;

  // History
  total_income_lifetime: number;
  total_expenses_lifetime: number;
  biggest_single_income: number;
  last_income_update: string;

  created_at: string;
  updated_at: string;
}

export interface FamilyActivity {
  id: string;
  family_id: string;
  player_id?: string;

  // Activity details
  activity_type: FamilyActivityType;
  activity_title: string;
  activity_description?: string;

  // Context
  territory_id?: string;
  target_family_id?: string;

  // Impact
  reputation_impact: number;
  treasury_impact: number;
  respect_impact: number;

  // Metadata
  metadata: Record<string, any>;
  is_public: boolean;

  created_at: string;

  // Joined data (optional)
  player?: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
  territory?: Territory;
  target_family?: Family;
}

// API Request/Response Types
export interface CreateFamilyRequest {
  name: string;
  display_name: string;
  description?: string;
  motto?: string;
  color_hex?: string;
}

export interface CreateFamilyResponse {
  success: boolean;
  family?: Family;
  error?: string;
}

export interface FamilyCreationFee {
  base_fee: number;
  existing_families_count: number;
  demand_multiplier: number;
  final_fee: number;
}

export interface JoinFamilyRequest {
  family_id: string;
  message?: string;
}

export interface FamilyMemberAction {
  target_player_id: string;
  action: 'promote' | 'demote' | 'kick' | 'ban';
  new_rank?: FamilyRank;
  reason?: string;
}

export interface UpdatePermissionsRequest {
  target_member_id: string;
  permissions: Partial<FamilyPermissions>;
}

export interface FamilyTreasuryTransaction {
  amount: number;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer';
  description: string;
  target_family_id?: string; // For transfers
}

export interface MemberContribution {
  player_id: string;
  amount: number;
  is_voluntary: boolean;
  note?: string;
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

export interface FamilyIncomeReport {
  total_territories: number;
  total_gross_income: number;
  total_maintenance: number;
  total_net_income: number;
  territory_details: TerritoryIncomeReport[];
  member_contributions: number;
  other_income: number;
  final_total: number;
  last_calculated: string;
}

export interface FamilyStats {
  total_members: number;
  members_by_rank: Record<FamilyRank, number>;
  total_territories: number;
  total_income: number;
  average_loyalty: number;
  reputation_rank: number;
  territory_rank: number;
  wealth_rank: number;
}

export interface FamilyDashboardData {
  family: Family;
  member: FamilyMember;
  stats: FamilyStats;
  recent_activities: FamilyActivity[];
  economics: FamilyEconomics;
  controlled_territories: TerritoryControl[];
  join_requests: FamilyMember[];
}

// Validation Types
export interface FamilyValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, any>;
}

export interface PermissionCheck {
  has_permission: boolean;
  required_permission: keyof FamilyPermissions;
  current_rank: FamilyRank;
  error_message?: string;
}

// Search and Filter Types
export interface FamilySearchParams {
  search?: string;
  is_recruiting?: boolean;
  min_members?: number;
  max_members?: number;
  territory_count_min?: number;
  territory_count_max?: number;
  sort_by?: 'name' | 'members' | 'territories' | 'reputation' | 'created_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FamilyListResponse {
  families: Family[];
  total_count: number;
  has_more: boolean;
}

// Default Permission Sets
export const DEFAULT_FAMILY_PERMISSIONS: Record<FamilyRank, FamilyPermissions> = {
  associate: {
    can_invite_members: false,
    can_approve_requests: false,
    can_kick_members: false,
    can_promote_demote: false,
    can_set_member_titles: false,
    can_manage_permissions: false,
    can_view_territories: true,
    can_manage_territories: false,
    can_declare_wars: false,
    can_negotiate_peace: false,
    can_assign_guards: false,
    can_set_defenses: false,
    can_view_treasury: false,
    can_manage_treasury: false,
    can_set_tax_rates: false,
    can_distribute_earnings: false,
    can_make_investments: false,
    can_authorize_expenses: false,
    can_form_alliances: false,
    can_declare_vendettas: false,
    can_access_intelligence: false,
    can_coordinate_operations: false,
    can_edit_family_info: false,
    can_manage_family_settings: false,
    can_view_activity_logs: false,
    can_ban_members: false,
  },
  soldier: {
    can_invite_members: true,
    can_approve_requests: false,
    can_kick_members: false,
    can_promote_demote: false,
    can_set_member_titles: false,
    can_manage_permissions: false,
    can_view_territories: true,
    can_manage_territories: false,
    can_declare_wars: false,
    can_negotiate_peace: false,
    can_assign_guards: true,
    can_set_defenses: false,
    can_view_treasury: true,
    can_manage_treasury: false,
    can_set_tax_rates: false,
    can_distribute_earnings: false,
    can_make_investments: false,
    can_authorize_expenses: false,
    can_form_alliances: false,
    can_declare_vendettas: false,
    can_access_intelligence: true,
    can_coordinate_operations: false,
    can_edit_family_info: false,
    can_manage_family_settings: false,
    can_view_activity_logs: true,
    can_ban_members: false,
  },
  caporegime: {
    can_invite_members: true,
    can_approve_requests: true,
    can_kick_members: true,
    can_promote_demote: true,
    can_set_member_titles: true,
    can_manage_permissions: false,
    can_view_territories: true,
    can_manage_territories: true,
    can_declare_wars: false,
    can_negotiate_peace: false,
    can_assign_guards: true,
    can_set_defenses: true,
    can_view_treasury: true,
    can_manage_treasury: false,
    can_set_tax_rates: false,
    can_distribute_earnings: false,
    can_make_investments: true,
    can_authorize_expenses: true,
    can_form_alliances: false,
    can_declare_vendettas: false,
    can_access_intelligence: true,
    can_coordinate_operations: true,
    can_edit_family_info: false,
    can_manage_family_settings: false,
    can_view_activity_logs: true,
    can_ban_members: false,
  },
  underboss: {
    can_invite_members: true,
    can_approve_requests: true,
    can_kick_members: true,
    can_promote_demote: true,
    can_set_member_titles: true,
    can_manage_permissions: true,
    can_view_territories: true,
    can_manage_territories: true,
    can_declare_wars: true,
    can_negotiate_peace: true,
    can_assign_guards: true,
    can_set_defenses: true,
    can_view_treasury: true,
    can_manage_treasury: true,
    can_set_tax_rates: true,
    can_distribute_earnings: true,
    can_make_investments: true,
    can_authorize_expenses: true,
    can_form_alliances: true,
    can_declare_vendettas: true,
    can_access_intelligence: true,
    can_coordinate_operations: true,
    can_edit_family_info: true,
    can_manage_family_settings: true,
    can_view_activity_logs: true,
    can_ban_members: true,
  },
  boss: {
    can_invite_members: true,
    can_approve_requests: true,
    can_kick_members: true,
    can_promote_demote: true,
    can_set_member_titles: true,
    can_manage_permissions: true,
    can_view_territories: true,
    can_manage_territories: true,
    can_declare_wars: true,
    can_negotiate_peace: true,
    can_assign_guards: true,
    can_set_defenses: true,
    can_view_treasury: true,
    can_manage_treasury: true,
    can_set_tax_rates: true,
    can_distribute_earnings: true,
    can_make_investments: true,
    can_authorize_expenses: true,
    can_form_alliances: true,
    can_declare_vendettas: true,
    can_access_intelligence: true,
    can_coordinate_operations: true,
    can_edit_family_info: true,
    can_manage_family_settings: true,
    can_view_activity_logs: true,
    can_ban_members: true,
  },
};

// Utility Types
export interface FamilyRankHierarchy {
  level: number;
  maxPromoteTo: FamilyRank[];
}

export const FAMILY_RANK_HIERARCHY: Record<FamilyRank, FamilyRankHierarchy> = {
  associate: { level: 1, maxPromoteTo: ['soldier'] },
  soldier: { level: 2, maxPromoteTo: ['caporegime'] },
  caporegime: { level: 3, maxPromoteTo: ['underboss'] },
  underboss: { level: 4, maxPromoteTo: ['boss'] },
  boss: { level: 5, maxPromoteTo: [] },
};

export const FAMILY_RANK_LIMITS: Record<FamilyRank, number> = {
  boss: 1,
  underboss: 1,
  caporegime: 5,
  soldier: 15,
  associate: -1, // unlimited
};

// Constants
export const FAMILY_CONSTANTS = {
  MIN_FAMILY_NAME_LENGTH: 3,
  MAX_FAMILY_NAME_LENGTH: 50,
  MIN_DISPLAY_NAME_LENGTH: 3,
  MAX_DISPLAY_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_MOTTO_LENGTH: 200,
  BASE_CREATION_FEE: 500000,
  MAX_MEMBERS_DEFAULT: 50,
  DEFAULT_LOYALTY_SCORE: 100,
  MIN_LOYALTY_SCORE: 0,
  MAX_LOYALTY_SCORE: 100,
} as const;
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          nickname: string
          username: string
          famiglia_name: string | null
          rank: string
          avatar_url: string | null
          bio: string | null
          reputation_score: number
          energy: number
          max_energy: number
          hp: number
          max_hp: number
          energy_regen_rate: number
          last_energy_regen: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname: string
          username: string
          famiglia_name?: string | null
          rank?: string
          avatar_url?: string | null
          bio?: string | null
          reputation_score?: number
          energy?: number
          max_energy?: number
          hp?: number
          max_hp?: number
          energy_regen_rate?: number
          last_energy_regen?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          username?: string
          famiglia_name?: string | null
          rank?: string
          avatar_url?: string | null
          bio?: string | null
          reputation_score?: number
          energy?: number
          max_energy?: number
          hp?: number
          max_hp?: number
          energy_regen_rate?: number
          last_energy_regen?: string
          created_at?: string
          updated_at?: string
        }
      }
      player_stats: {
        Row: {
          player_id: string
          total_games: number
          games_won: number
          games_lost: number
          favorite_role: string | null
          total_eliminations: number
          times_eliminated: number
          survival_rate: number
          longest_survival_streak: number
          current_streak: number
          total_damage_dealt: number
          total_healing_done: number
          energy_spent: number
          updated_at: string
        }
        Insert: {
          player_id: string
          total_games?: number
          games_won?: number
          games_lost?: number
          favorite_role?: string | null
          total_eliminations?: number
          times_eliminated?: number
          survival_rate?: number
          longest_survival_streak?: number
          current_streak?: number
          total_damage_dealt?: number
          total_healing_done?: number
          energy_spent?: number
          updated_at?: string
        }
        Update: {
          player_id?: string
          total_games?: number
          games_won?: number
          games_lost?: number
          favorite_role?: string | null
          total_eliminations?: number
          times_eliminated?: number
          survival_rate?: number
          longest_survival_streak?: number
          current_streak?: number
          total_damage_dealt?: number
          total_healing_done?: number
          energy_spent?: number
          updated_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          name: string
          status: string
          max_players: number
          current_player_count: number
          created_by: string | null
          game_type: string
          settings: Json
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: string
          max_players?: number
          current_player_count?: number
          created_by?: string | null
          game_type?: string
          settings?: Json
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: string
          max_players?: number
          current_player_count?: number
          created_by?: string | null
          game_type?: string
          settings?: Json
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      game_participants: {
        Row: {
          id: string
          game_session_id: string
          player_id: string
          role: string | null
          status: string
          elimination_round: number | null
          eliminated_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          game_session_id: string
          player_id: string
          role?: string | null
          status?: string
          elimination_round?: number | null
          eliminated_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          game_session_id?: string
          player_id?: string
          role?: string | null
          status?: string
          elimination_round?: number | null
          eliminated_by?: string | null
          joined_at?: string
        }
      }
      job_templates: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          required_rank: string
          energy_cost: number
          base_payout_min: number
          base_payout_max: number
          success_rate_base: number
          risk_level: number
          experience_reward: number
          reputation_reward: number
          cooldown_minutes: number
          required_attack_power: number
          required_defense_power: number
          icon_name: string | null
          flavor_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          required_rank?: string
          energy_cost: number
          base_payout_min: number
          base_payout_max: number
          success_rate_base?: number
          risk_level?: number
          experience_reward?: number
          reputation_reward?: number
          cooldown_minutes?: number
          required_attack_power?: number
          required_defense_power?: number
          icon_name?: string | null
          flavor_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          required_rank?: string
          energy_cost?: number
          base_payout_min?: number
          base_payout_max?: number
          success_rate_base?: number
          risk_level?: number
          experience_reward?: number
          reputation_reward?: number
          cooldown_minutes?: number
          required_attack_power?: number
          required_defense_power?: number
          icon_name?: string | null
          flavor_text?: string | null
          created_at?: string
        }
      }
      item_templates: {
        Row: {
          id: string
          name: string
          description: string
          item_type: string
          rarity: string
          attack_power: number
          defense_power: number
          special_bonus: Json
          base_value: number
          icon_name: string | null
          flavor_text: string | null
          can_stack: boolean
          max_stack_size: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          item_type: string
          rarity?: string
          attack_power?: number
          defense_power?: number
          special_bonus?: Json
          base_value?: number
          icon_name?: string | null
          flavor_text?: string | null
          can_stack?: boolean
          max_stack_size?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          item_type?: string
          rarity?: string
          attack_power?: number
          defense_power?: number
          special_bonus?: Json
          base_value?: number
          icon_name?: string | null
          flavor_text?: string | null
          can_stack?: boolean
          max_stack_size?: number
          created_at?: string
        }
      }
      player_inventory: {
        Row: {
          id: string
          player_id: string
          item_template_id: string
          quantity: number
          is_equipped: boolean
          acquired_at: string
        }
        Insert: {
          id?: string
          player_id: string
          item_template_id: string
          quantity?: number
          is_equipped?: boolean
          acquired_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          item_template_id?: string
          quantity?: number
          is_equipped?: boolean
          acquired_at?: string
        }
      }
      player_economics: {
        Row: {
          player_id: string
          cash_on_hand: number
          total_earned: number
          total_spent: number
          heat_level: number
          territory_owned: number
          experience_points: number
          attack_power: number
          defense_power: number
          last_job_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          player_id: string
          cash_on_hand?: number
          total_earned?: number
          total_spent?: number
          heat_level?: number
          territory_owned?: number
          experience_points?: number
          attack_power?: number
          defense_power?: number
          last_job_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          player_id?: string
          cash_on_hand?: number
          total_earned?: number
          total_spent?: number
          heat_level?: number
          territory_owned?: number
          experience_points?: number
          attack_power?: number
          defense_power?: number
          last_job_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_executions: {
        Row: {
          id: string
          player_id: string
          job_template_id: string
          success: boolean
          payout: number
          energy_spent: number
          experience_gained: number
          reputation_gained: number
          heat_gained: number
          loot_gained: Json
          execution_details: Json
          executed_at: string
        }
        Insert: {
          id?: string
          player_id: string
          job_template_id: string
          success: boolean
          payout?: number
          energy_spent: number
          experience_gained?: number
          reputation_gained?: number
          heat_gained?: number
          loot_gained?: Json
          execution_details?: Json
          executed_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          job_template_id?: string
          success?: boolean
          payout?: number
          energy_spent?: number
          experience_gained?: number
          reputation_gained?: number
          heat_gained?: number
          loot_gained?: Json
          execution_details?: Json
          executed_at?: string
        }
      }
      territories: {
        Row: {
          id: string
          name: string
          description: string | null
          controlled_by: string | null
          income_per_hour: number
          required_attack_power: number
          last_income_collected: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          controlled_by?: string | null
          income_per_hour?: number
          required_attack_power?: number
          last_income_collected?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          controlled_by?: string | null
          income_per_hour?: number
          required_attack_power?: number
          last_income_collected?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_job_with_loot: {
        Args: {
          job_template_uuid: string
          player_uuid: string
        }
        Returns: Json
      }
      execute_job: {
        Args: {
          job_template_uuid: string
          player_uuid?: string
        }
        Returns: Json
      }
      calculate_attack_power: {
        Args: {
          player_uuid: string
        }
        Returns: number
      }
      calculate_defense_power: {
        Args: {
          player_uuid: string
        }
        Returns: number
      }
      reduce_heat: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Player = Database['public']['Tables']['players']['Row'];
export type PlayerStats = Database['public']['Tables']['player_stats']['Row'];
export type GameSession = Database['public']['Tables']['game_sessions']['Row'];
export type GameParticipant = Database['public']['Tables']['game_participants']['Row'];
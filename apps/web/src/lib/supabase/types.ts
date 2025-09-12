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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
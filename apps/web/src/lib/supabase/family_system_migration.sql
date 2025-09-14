-- Family System Database Migration
-- Run these in order in your Supabase SQL editor

-- Step 1: Create enum types
DO $$ BEGIN
    CREATE TYPE family_rank_enum AS ENUM (
  'associate',    -- Support tasks, basic members
  'soldier',      -- Battle participation, missions
  'caporegime',   -- Zone management, squad leadership
  'underboss',    -- Second in command
  'boss'          -- Family leader
);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE family_activity_enum AS ENUM (
  'member_joined',
  'member_left',
  'member_kicked',
  'member_promoted',
  'member_demoted',
  'territory_captured',
  'territory_lost',
  'war_declared',
  'war_won',
  'war_lost',
  'alliance_formed',
  'alliance_broken',
  'tribute_received',
  'tribute_paid',
  'treasury_deposit',
  'treasury_withdrawal'
);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE territory_type_enum AS ENUM (
  'downtown',     -- High income, high visibility
  'docks',        -- Import/export bonuses
  'warehouse',    -- Storage and logistics
  'casino',       -- Entertainment income
  'neighborhood', -- Stable income, community
  'industrial',   -- Manufacturing
  'smuggling',    -- High risk, high reward
  'political'     -- Influence and corruption
);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE territory_control_status_enum AS ENUM (
  'stable',       -- Full control, no threats
  'contested',    -- Under attack/pressure
  'vulnerable',   -- Weakened defenses
  'consolidating' -- Recently captured, securing control
);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE war_status_enum AS ENUM (
  'scouting',      -- Intelligence gathering phase
  'sabotage',      -- Weakening defenses
  'showdown',      -- Active combat phase
  'consolidation', -- Post-victory securing
  'completed',     -- War finished
  'cancelled'      -- War called off
);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create core families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  motto TEXT,
  color_hex VARCHAR(7) DEFAULT '#FFD700',
  logo_url TEXT,

  -- Leadership
  boss_id UUID REFERENCES players(id),
  underboss_id UUID REFERENCES players(id),

  -- Economics
  treasury_balance BIGINT DEFAULT 0,
  total_income_generated BIGINT DEFAULT 0,
  total_expenses BIGINT DEFAULT 0,
  tax_rate DECIMAL(3,2) DEFAULT 0.10,

  -- Status
  reputation_score BIGINT DEFAULT 0,
  total_territories INTEGER DEFAULT 0,
  heat_level INTEGER DEFAULT 0,
  respect_points BIGINT DEFAULT 0,

  -- Settings
  creation_fee_paid BIGINT NOT NULL,
  created_by UUID REFERENCES players(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_recruiting BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 50,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create family members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,

  -- Hierarchy
  family_rank family_rank_enum DEFAULT 'associate',
  title VARCHAR(50),

  -- Permissions (detailed permissions stored as JSONB for flexibility)
  permissions JSONB DEFAULT '{
    "can_invite_members": false,
    "can_approve_requests": false,
    "can_kick_members": false,
    "can_promote_demote": false,
    "can_set_member_titles": false,
    "can_manage_permissions": false,
    "can_view_territories": true,
    "can_manage_territories": false,
    "can_declare_wars": false,
    "can_negotiate_peace": false,
    "can_assign_guards": false,
    "can_set_defenses": false,
    "can_view_treasury": false,
    "can_manage_treasury": false,
    "can_set_tax_rates": false,
    "can_distribute_earnings": false,
    "can_make_investments": false,
    "can_authorize_expenses": false,
    "can_form_alliances": false,
    "can_declare_vendettas": false,
    "can_access_intelligence": false,
    "can_coordinate_operations": false,
    "can_edit_family_info": false,
    "can_manage_family_settings": false,
    "can_view_activity_logs": false,
    "can_ban_members": false
  }'::JSONB,

  -- Economics
  contribution_total BIGINT DEFAULT 0,
  earnings_received BIGINT DEFAULT 0,
  last_contribution_at TIMESTAMPTZ,

  -- Activity tracking
  loyalty_score INTEGER DEFAULT 100,
  activity_score INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  join_requested_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,

  UNIQUE(family_id, player_id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create territories table
CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Map positioning
  map_x INTEGER NOT NULL,
  map_y INTEGER NOT NULL,
  territory_type territory_type_enum NOT NULL,

  -- Economics
  base_income_per_hour BIGINT DEFAULT 1000,
  maintenance_cost_per_hour BIGINT DEFAULT 100,
  control_difficulty INTEGER DEFAULT 1,

  -- Resources & bonuses stored as JSONB for flexibility
  resource_types TEXT[] DEFAULT '{}',
  special_bonuses JSONB DEFAULT '[]'::JSONB,

  -- Control requirements
  min_defense_points INTEGER DEFAULT 100,
  max_control_points INTEGER DEFAULT 1000,

  -- Status
  is_contestable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create territory control table
CREATE TABLE IF NOT EXISTS territory_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID REFERENCES territories(id) ON DELETE CASCADE,
  controlling_family_id UUID REFERENCES families(id) ON DELETE CASCADE,

  -- Control status
  control_percentage DECIMAL(5,2) DEFAULT 100.00,
  control_status territory_control_status_enum DEFAULT 'stable',

  -- Defense
  defense_points INTEGER DEFAULT 0,
  guard_count INTEGER DEFAULT 0,
  fortification_level INTEGER DEFAULT 0,

  -- Economics
  income_modifier DECIMAL(3,2) DEFAULT 1.00,
  total_income_generated BIGINT DEFAULT 0,
  last_income_at TIMESTAMPTZ DEFAULT NOW(),

  -- History
  controlled_since TIMESTAMPTZ DEFAULT NOW(),
  last_contested_at TIMESTAMPTZ,
  times_contested INTEGER DEFAULT 0,

  -- War status
  under_attack BOOLEAN DEFAULT false,
  contest_phase VARCHAR(50),
  contest_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(territory_id)
);

-- Step 6: Create family economics table
CREATE TABLE IF NOT EXISTS family_economics (
  family_id UUID REFERENCES families(id) PRIMARY KEY,

  -- Treasury
  treasury_balance BIGINT DEFAULT 0,
  daily_income BIGINT DEFAULT 0,
  daily_expenses BIGINT DEFAULT 0,

  -- Income sources
  territory_income BIGINT DEFAULT 0,
  job_income BIGINT DEFAULT 0,
  member_contributions BIGINT DEFAULT 0,
  other_income BIGINT DEFAULT 0,

  -- Expenses
  territory_maintenance BIGINT DEFAULT 0,
  war_expenses BIGINT DEFAULT 0,
  recruitment_expenses BIGINT DEFAULT 0,
  other_expenses BIGINT DEFAULT 0,

  -- Tax settings
  tax_rate DECIMAL(3,2) DEFAULT 0.10,
  minimum_contribution BIGINT DEFAULT 0,

  -- History
  total_income_lifetime BIGINT DEFAULT 0,
  total_expenses_lifetime BIGINT DEFAULT 0,
  biggest_single_income BIGINT DEFAULT 0,
  last_income_update TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: Create family activities log
CREATE TABLE IF NOT EXISTS family_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),

  -- Activity details
  activity_type family_activity_enum NOT NULL,
  activity_title VARCHAR(200) NOT NULL,
  activity_description TEXT,

  -- Context (optional references)
  territory_id UUID REFERENCES territories(id),
  target_family_id UUID REFERENCES families(id),

  -- Impact
  reputation_impact INTEGER DEFAULT 0,
  treasury_impact BIGINT DEFAULT 0,
  respect_impact INTEGER DEFAULT 0,

  -- Metadata (flexible JSON for different activity types)
  metadata JSONB DEFAULT '{}'::JSONB,
  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: Update existing players table to include family information
DO $$ BEGIN
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS current_family_id UUID REFERENCES families(id),
    ADD COLUMN IF NOT EXISTS family_rank family_rank_enum,
    ADD COLUMN IF NOT EXISTS family_joined_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS family_loyalty_score INTEGER DEFAULT 100;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 9: Update existing player_economics table for family integration
DO $$ BEGIN
    ALTER TABLE player_economics
    ADD COLUMN IF NOT EXISTS family_contribution_total BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS family_earnings_received BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_family_tax_paid TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 9.5: Ensure required columns exist for indexes and policies
DO $$ BEGIN
    ALTER TABLE family_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS is_contestable BOOLEAN DEFAULT true;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS map_x INTEGER;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS map_y INTEGER;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS base_income_per_hour BIGINT DEFAULT 1000;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS maintenance_cost_per_hour BIGINT DEFAULT 100;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS control_difficulty INTEGER DEFAULT 1;
    ALTER TABLE territories ADD COLUMN IF NOT EXISTS territory_type territory_type_enum;
    ALTER TABLE families ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 10: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_player_id ON family_members(player_id);
CREATE INDEX IF NOT EXISTS idx_family_members_active_rank ON family_members(family_id, is_active, family_rank);

CREATE INDEX IF NOT EXISTS idx_territory_control_family ON territory_control(controlling_family_id);
CREATE INDEX IF NOT EXISTS idx_territories_active_contestable ON territories(is_active, is_contestable);

CREATE INDEX IF NOT EXISTS idx_family_activities_family_time ON family_activities(family_id, created_at);
CREATE INDEX IF NOT EXISTS idx_family_activities_type ON family_activities(activity_type, created_at);

-- Step 11: Create RLS (Row Level Security) policies if needed
-- Enable RLS on sensitive tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_economics ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy for family members (can only see their own family data)
DO $$ BEGIN
    CREATE POLICY "Family members can view own family data" ON families
        FOR SELECT
        USING (
            id IN (
                SELECT family_id
                FROM family_members
                WHERE player_id = auth.uid() AND is_active = true
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Family members can view family member data" ON family_members
        FOR SELECT
        USING (
            family_id IN (
                SELECT family_id
                FROM family_members
                WHERE player_id = auth.uid() AND is_active = true
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 12: Insert initial territory data (example territories)
INSERT INTO territories (name, display_name, description, map_x, map_y, territory_type, base_income_per_hour, maintenance_cost_per_hour, control_difficulty)
SELECT name, display_name, description, map_x, map_y, territory_type::territory_type_enum, base_income_per_hour, maintenance_cost_per_hour, control_difficulty FROM (
VALUES
('downtown_01', 'Financial District', 'High-value downtown area with banks and corporate offices', 3, 3, 'downtown', 5000, 500, 8),
('downtown_02', 'Business Center', 'Core business district with government buildings', 4, 3, 'downtown', 4500, 450, 7),
('downtown_03', 'Entertainment Plaza', 'Downtown entertainment and nightlife hub', 3, 4, 'downtown', 4000, 400, 7),
('downtown_04', 'Shopping District', 'High-end retail and luxury shopping area', 4, 4, 'downtown', 3500, 350, 6),

('docks_01', 'Main Harbor', 'Primary shipping and receiving dock', 0, 4, 'docks', 3000, 200, 5),
('docks_02', 'Cargo Terminal', 'Heavy freight and container operations', 1, 4, 'docks', 2800, 180, 4),
('docks_03', 'Fishing Wharf', 'Commercial fishing and seafood processing', 0, 5, 'docks', 2000, 150, 3),
('docks_04', 'Marina', 'Private boats and yacht services', 1, 5, 'docks', 2500, 200, 4),

('industrial_01', 'Manufacturing Zone', 'Heavy manufacturing and factory district', 6, 0, 'industrial', 2500, 300, 4),
('industrial_02', 'Warehouse District', 'Storage and distribution facilities', 7, 0, 'industrial', 2200, 250, 3),
('industrial_03', 'Power Plant Area', 'Utilities and energy infrastructure', 6, 1, 'industrial', 2800, 350, 5),
('industrial_04', 'Chemical Plant', 'Chemical processing and refinement', 7, 1, 'industrial', 3000, 400, 6),

('casino_01', 'Golden Palace Casino', 'Luxury casino and entertainment venue', 2, 0, 'casino', 4000, 300, 5),
('casino_02', 'Riverside Gaming', 'Waterfront casino with river views', 3, 0, 'casino', 3500, 250, 4),
('casino_03', 'Lucky Star Resort', 'Casino resort with hotel amenities', 4, 0, 'casino', 3800, 280, 5),
('casino_04', 'Diamond Club', 'Exclusive high-stakes gaming establishment', 5, 0, 'casino', 4500, 350, 6)
) AS new_territories(name, display_name, description, map_x, map_y, territory_type, base_income_per_hour, maintenance_cost_per_hour, control_difficulty)
WHERE NOT EXISTS (SELECT 1 FROM territories WHERE territories.name = new_territories.name);

-- Step 13: Create database functions for family operations
CREATE OR REPLACE FUNCTION create_family(
  p_creator_id UUID,
  p_name VARCHAR(50),
  p_display_name VARCHAR(100),
  p_creation_fee BIGINT,
  p_description TEXT DEFAULT NULL,
  p_motto TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  family_id UUID;
  player_cash BIGINT;
BEGIN
  -- Check if player has enough money
  SELECT cash_on_hand INTO player_cash
  FROM player_economics
  WHERE player_id = p_creator_id;

  IF player_cash < p_creation_fee THEN
    RAISE EXCEPTION 'Insufficient funds. Required: %, Available: %', p_creation_fee, player_cash;
  END IF;

  -- Create family
  INSERT INTO families (name, display_name, description, motto, created_by, creation_fee_paid, boss_id)
  VALUES (p_name, p_display_name, p_description, p_motto, p_creator_id, p_creation_fee, p_creator_id)
  RETURNING id INTO family_id;

  -- Add creator as boss
  INSERT INTO family_members (family_id, player_id, family_rank, joined_at)
  VALUES (family_id, p_creator_id, 'boss', NOW());

  -- Initialize family economics
  INSERT INTO family_economics (family_id) VALUES (family_id);

  -- Deduct creation fee from player
  UPDATE player_economics
  SET cash_on_hand = cash_on_hand - p_creation_fee,
      total_spent = total_spent + p_creation_fee
  WHERE player_id = p_creator_id;

  -- Update player's family info
  UPDATE players
  SET current_family_id = family_id,
      family_rank = 'boss',
      family_joined_at = NOW()
  WHERE id = p_creator_id;

  -- Log family creation activity
  INSERT INTO family_activities (family_id, player_id, activity_type, activity_title, activity_description)
  VALUES (family_id, p_creator_id, 'member_joined', 'Family Founded', p_display_name || ' was founded');

  RETURN family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate family creation fee (dynamic pricing)
CREATE OR REPLACE FUNCTION calculate_family_creation_fee()
RETURNS BIGINT AS $$
DECLARE
  base_fee BIGINT := 500000; -- $500k base
  family_count INTEGER;
  final_fee BIGINT;
BEGIN
  -- Count existing active families
  SELECT COUNT(*) INTO family_count FROM families WHERE is_active = true;

  -- Increase cost by 5% for each existing family (scarcity pricing)
  final_fee := base_fee * (1 + (family_count * 0.05));

  RETURN final_fee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update family member permissions based on rank
CREATE OR REPLACE FUNCTION update_member_permissions_by_rank(member_id UUID, new_rank family_rank_enum)
RETURNS VOID AS $$
DECLARE
  default_permissions JSONB;
BEGIN
  -- Set default permissions based on rank
  CASE new_rank
    WHEN 'associate' THEN
      default_permissions := '{
        "can_invite_members": false,
        "can_approve_requests": false,
        "can_kick_members": false,
        "can_promote_demote": false,
        "can_view_territories": true,
        "can_manage_territories": false,
        "can_declare_wars": false,
        "can_view_treasury": false,
        "can_manage_treasury": false
      }';
    WHEN 'soldier' THEN
      default_permissions := '{
        "can_invite_members": true,
        "can_approve_requests": false,
        "can_kick_members": false,
        "can_promote_demote": false,
        "can_view_territories": true,
        "can_manage_territories": false,
        "can_declare_wars": false,
        "can_view_treasury": true,
        "can_manage_treasury": false,
        "can_assign_guards": true,
        "can_access_intelligence": true
      }';
    WHEN 'caporegime' THEN
      default_permissions := '{
        "can_invite_members": true,
        "can_approve_requests": true,
        "can_kick_members": true,
        "can_promote_demote": true,
        "can_view_territories": true,
        "can_manage_territories": true,
        "can_declare_wars": false,
        "can_view_treasury": true,
        "can_manage_treasury": false,
        "can_set_member_titles": true,
        "can_assign_guards": true,
        "can_set_defenses": true,
        "can_make_investments": true,
        "can_authorize_expenses": true,
        "can_access_intelligence": true,
        "can_coordinate_operations": true
      }';
    WHEN 'underboss' THEN
      default_permissions := '{
        "can_invite_members": true,
        "can_approve_requests": true,
        "can_kick_members": true,
        "can_promote_demote": true,
        "can_view_territories": true,
        "can_manage_territories": true,
        "can_declare_wars": true,
        "can_negotiate_peace": true,
        "can_view_treasury": true,
        "can_manage_treasury": true,
        "can_set_tax_rates": true,
        "can_distribute_earnings": true,
        "can_manage_permissions": true,
        "can_edit_family_info": true,
        "can_manage_family_settings": true,
        "can_view_activity_logs": true,
        "can_ban_members": true
      }';
    WHEN 'boss' THEN
      -- Boss gets all permissions
      default_permissions := '{
        "can_invite_members": true,
        "can_approve_requests": true,
        "can_kick_members": true,
        "can_promote_demote": true,
        "can_set_member_titles": true,
        "can_manage_permissions": true,
        "can_view_territories": true,
        "can_manage_territories": true,
        "can_declare_wars": true,
        "can_negotiate_peace": true,
        "can_assign_guards": true,
        "can_set_defenses": true,
        "can_view_treasury": true,
        "can_manage_treasury": true,
        "can_set_tax_rates": true,
        "can_distribute_earnings": true,
        "can_make_investments": true,
        "can_authorize_expenses": true,
        "can_form_alliances": true,
        "can_declare_vendettas": true,
        "can_access_intelligence": true,
        "can_coordinate_operations": true,
        "can_edit_family_info": true,
        "can_manage_family_settings": true,
        "can_view_activity_logs": true,
        "can_ban_members": true
      }';
  END CASE;

  -- Update the member's permissions and rank
  UPDATE family_members
  SET permissions = default_permissions,
      family_rank = new_rank,
      updated_at = NOW()
  WHERE id = member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update player table when family membership changes
CREATE OR REPLACE FUNCTION sync_player_family_info()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update player's current family info
    UPDATE players
    SET current_family_id = NEW.family_id,
        family_rank = NEW.family_rank,
        family_joined_at = NEW.joined_at,
        family_loyalty_score = NEW.loyalty_score
    WHERE id = NEW.player_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Clear player's family info
    UPDATE players
    SET current_family_id = NULL,
        family_rank = NULL,
        family_joined_at = NULL,
        family_loyalty_score = 100
    WHERE id = OLD.player_id;

    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_member_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON family_members
  FOR EACH ROW EXECUTE FUNCTION sync_player_family_info();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Family system database migration completed successfully!';
  RAISE NOTICE 'Tables created: families, family_members, territories, territory_control, family_economics, family_activities';
  RAISE NOTICE 'Functions created: create_family, calculate_family_creation_fee, update_member_permissions_by_rank';
  RAISE NOTICE 'Triggers created: family_member_sync_trigger';
  RAISE NOTICE 'Sample territories inserted: 16 territories across 4 districts';
END $$;
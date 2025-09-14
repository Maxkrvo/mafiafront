-- Territory System Foundation - Database Schema
-- This migration implements the comprehensive territory system described in TerritorySystemFoundation.md
-- IMPORTANT: This works with existing family system - does not drop existing tables

-- Drop only new territory-specific tables if they exist
DROP TABLE IF EXISTS public.territory_wars CASCADE;
DROP TABLE IF EXISTS public.war_participation CASCADE;
DROP TABLE IF EXISTS public.war_events CASCADE;
DROP TABLE IF EXISTS public.sabotage_missions CASCADE;
DROP TABLE IF EXISTS public.mission_executions CASCADE;
DROP TABLE IF EXISTS public.territory_income_history CASCADE;

-- Drop only new types (existing family system types are preserved)
DROP TYPE IF EXISTS public.resource_type CASCADE;
DROP TYPE IF EXISTS public.contest_phase CASCADE;

-- Resource Types Enum (new)
CREATE TYPE public.resource_type AS ENUM (
  'cash',
  'contraband',
  'weapons',
  'influence',
  'information'
);

-- War Phase Enum (new - different from existing war_status_enum)
CREATE TYPE public.contest_phase AS ENUM (
  'scouting',
  'sabotage',
  'showdown',
  'consolidation'
);

-- Enhance existing territories table with additional territory system columns
DO $$ BEGIN
  -- Add new columns for enhanced territory system
  ALTER TABLE public.territories ADD COLUMN IF NOT EXISTS resource_types public.resource_type[] DEFAULT '{}';
  ALTER TABLE public.territories ADD COLUMN IF NOT EXISTS special_bonuses JSONB DEFAULT '[]';
  ALTER TABLE public.territories ADD COLUMN IF NOT EXISTS adjacent_territories UUID[] DEFAULT '{}';
  ALTER TABLE public.territories ADD COLUMN IF NOT EXISTS min_defense_points INTEGER DEFAULT 100;
  ALTER TABLE public.territories ADD COLUMN IF NOT EXISTS max_control_points INTEGER DEFAULT 1000;
  ALTER TABLE public.territories ADD COLUMN IF NOT EXISTS is_strategic BOOLEAN DEFAULT false;

  -- Update control_difficulty check constraint
  ALTER TABLE public.territories DROP CONSTRAINT IF EXISTS territories_control_difficulty_check;
  ALTER TABLE public.territories ADD CONSTRAINT territories_control_difficulty_check
    CHECK (control_difficulty >= 1 AND control_difficulty <= 10);

EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN duplicate_object THEN null;
END $$;

-- Enhance existing territory_control table for war system
DO $$ BEGIN
  -- Add new columns for enhanced war system
  ALTER TABLE public.territory_control ADD COLUMN IF NOT EXISTS control_percentage INTEGER DEFAULT 100;
  ALTER TABLE public.territory_control ADD COLUMN IF NOT EXISTS contest_phase public.contest_phase;
  ALTER TABLE public.territory_control ADD COLUMN IF NOT EXISTS contest_expires_at TIMESTAMP WITH TIME ZONE;

  -- Add foreign key constraint to families table (using existing family table)
  ALTER TABLE public.territory_control
    ADD CONSTRAINT territory_control_family_fkey
    FOREIGN KEY (controlling_family_id) REFERENCES public.families(id) ON DELETE CASCADE;

  -- Add check constraints
  ALTER TABLE public.territory_control DROP CONSTRAINT IF EXISTS territory_control_control_percentage_check;
  ALTER TABLE public.territory_control ADD CONSTRAINT territory_control_control_percentage_check
    CHECK (control_percentage >= 0 AND control_percentage <= 100);

  ALTER TABLE public.territory_control DROP CONSTRAINT IF EXISTS territory_control_fortification_level_check;
  ALTER TABLE public.territory_control ADD CONSTRAINT territory_control_fortification_level_check
    CHECK (fortification_level >= 0 AND fortification_level <= 5);

EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN duplicate_object THEN null;
END $$;

-- Territory Wars Table
CREATE TABLE public.territory_wars (
  id UUID DEFAULT gen_random_uuid(),
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  attacking_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  defending_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,

  -- War status
  current_phase public.contest_phase NOT NULL DEFAULT 'scouting',
  phase_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  phase_duration_hours INTEGER NOT NULL DEFAULT 6,

  -- Battle mechanics
  attacking_pressure INTEGER NOT NULL DEFAULT 0,
  defending_pressure INTEGER NOT NULL DEFAULT 0,
  control_bar_position INTEGER NOT NULL DEFAULT 0 CHECK (control_bar_position >= -100 AND control_bar_position <= 100),

  -- Victory conditions
  victory_threshold INTEGER NOT NULL DEFAULT 50,
  stalemate_timer INTEGER NOT NULL DEFAULT 48, -- hours

  -- War outcome
  winner_family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  war_ended_at TIMESTAMP WITH TIME ZONE,
  ending_reason VARCHAR(50), -- 'victory', 'stalemate', 'cancelled'

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- War Participation Table
CREATE TABLE public.war_participation (
  id UUID DEFAULT gen_random_uuid(),
  war_id UUID NOT NULL REFERENCES public.territory_wars(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,

  -- Participation stats
  contribution_score INTEGER NOT NULL DEFAULT 0,
  missions_completed INTEGER NOT NULL DEFAULT 0,
  supplies_provided INTEGER NOT NULL DEFAULT 0,
  guard_duty_hours INTEGER NOT NULL DEFAULT 0,

  -- Activity tracking
  last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_actions INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE(war_id, player_id)
);

-- War Events Table - tracks all events during wars
CREATE TABLE public.war_events (
  id UUID DEFAULT gen_random_uuid(),
  war_id UUID NOT NULL REFERENCES public.territory_wars(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,

  -- Event details
  event_type VARCHAR(50) NOT NULL, -- 'mission_success', 'mission_failure', 'supply_delivery', 'guard_duty'
  event_phase public.contest_phase NOT NULL,
  pressure_change INTEGER NOT NULL DEFAULT 0,
  description TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Sabotage Missions Table
CREATE TABLE public.sabotage_missions (
  id UUID DEFAULT gen_random_uuid(),
  war_id UUID NOT NULL REFERENCES public.territory_wars(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Mission requirements
  energy_cost INTEGER NOT NULL DEFAULT 25,
  required_rank VARCHAR(20) NOT NULL DEFAULT 'associate',
  success_rate INTEGER NOT NULL DEFAULT 70 CHECK (success_rate >= 0 AND success_rate <= 100),
  risk_level INTEGER NOT NULL DEFAULT 3 CHECK (risk_level >= 1 AND risk_level <= 5),

  -- Mission rewards
  sabotage_points INTEGER NOT NULL DEFAULT 10,
  pressure_impact INTEGER NOT NULL DEFAULT 5,

  -- Special requirements
  requires_intel BOOLEAN DEFAULT false,
  required_items JSONB DEFAULT '[]',
  cooldown_hours INTEGER NOT NULL DEFAULT 2,

  -- Status
  is_active BOOLEAN DEFAULT true,
  max_completions INTEGER DEFAULT -1, -- -1 for unlimited
  current_completions INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Mission Executions Table
CREATE TABLE public.mission_executions (
  id UUID DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.sabotage_missions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  war_id UUID NOT NULL REFERENCES public.territory_wars(id) ON DELETE CASCADE,

  -- Execution details
  success BOOLEAN NOT NULL,
  energy_spent INTEGER NOT NULL,
  pressure_generated INTEGER NOT NULL DEFAULT 0,
  sabotage_points_earned INTEGER NOT NULL DEFAULT 0,

  -- Results
  execution_details JSONB DEFAULT '{}',
  consequences JSONB DEFAULT '{}',

  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Territory Income History Table
CREATE TABLE public.territory_income_history (
  id UUID DEFAULT gen_random_uuid(),
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  controlling_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,

  -- Income details
  gross_income INTEGER NOT NULL,
  maintenance_costs INTEGER NOT NULL,
  net_income INTEGER NOT NULL,

  -- Modifiers applied
  base_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  control_percentage_bonus DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  fortification_bonus DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  synergy_bonuses JSONB DEFAULT '{}',

  -- Period
  income_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  income_period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enhanced family economics to track territory income
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS territory_income_daily INTEGER DEFAULT 0;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS territory_maintenance_daily INTEGER DEFAULT 0;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS total_territories_controlled INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_territories_map_position ON public.territories(map_x, map_y);
CREATE INDEX IF NOT EXISTS idx_territories_type ON public.territories(territory_type);
CREATE INDEX IF NOT EXISTS idx_territory_control_family ON public.territory_control(controlling_family_id);
CREATE INDEX IF NOT EXISTS idx_territory_control_status ON public.territory_control(control_status);
CREATE INDEX IF NOT EXISTS idx_territory_wars_active ON public.territory_wars(current_phase) WHERE winner_family_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_war_participation_player ON public.war_participation(player_id);
CREATE INDEX IF NOT EXISTS idx_war_events_war_phase ON public.war_events(war_id, event_phase);
CREATE INDEX IF NOT EXISTS idx_sabotage_missions_war ON public.sabotage_missions(war_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_territory_income_history_family_period ON public.territory_income_history(controlling_family_id, income_period_start);

-- Row Level Security
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_wars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sabotage_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_income_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Territories (public read, admin write)
DO $$ BEGIN
  CREATE POLICY "Anyone can view territories" ON public.territories
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies - Territory Control (public read, family members write)
DO $$ BEGIN
  CREATE POLICY "Anyone can view territory control" ON public.territory_control
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Family members can update their territory control" ON public.territory_control
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.player_id = auth.uid() AND fm.family_id = controlling_family_id
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies - Territory Wars (public read, participants write)
DO $$ BEGIN
  CREATE POLICY "Anyone can view territory wars" ON public.territory_wars
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies - War Participation (participants can view/update their own)
DO $$ BEGIN
  CREATE POLICY "Players can view war participation" ON public.war_participation
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Players can update own war participation" ON public.war_participation
    FOR UPDATE USING (auth.uid() = player_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies - War Events (public read for transparency)
DO $$ BEGIN
  CREATE POLICY "Anyone can view war events" ON public.war_events
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies - Sabotage Missions (public read)
DO $$ BEGIN
  CREATE POLICY "Anyone can view sabotage missions" ON public.sabotage_missions
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies - Mission Executions (players can view all, update own)
DO $$ BEGIN
  CREATE POLICY "Anyone can view mission executions" ON public.mission_executions
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Players can insert own mission executions" ON public.mission_executions
    FOR INSERT WITH CHECK (auth.uid() = player_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies - Territory Income History (public read)
DO $$ BEGIN
  CREATE POLICY "Anyone can view territory income history" ON public.territory_income_history
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Updated At Triggers
DO $$ BEGIN
  CREATE TRIGGER handle_territories_updated_at
    BEFORE UPDATE ON public.territories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_territory_control_updated_at
    BEFORE UPDATE ON public.territory_control
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_territory_wars_updated_at
    BEFORE UPDATE ON public.territory_wars
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_war_participation_updated_at
    BEFORE UPDATE ON public.war_participation
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_sabotage_missions_updated_at
    BEFORE UPDATE ON public.sabotage_missions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable realtime for territory system tables
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.territories;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.territory_control;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.territory_wars;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.war_participation;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.war_events;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Function to calculate territory income
CREATE OR REPLACE FUNCTION public.calculate_territory_income(
  territory_uuid UUID,
  hours_elapsed DECIMAL DEFAULT 1.0
)
RETURNS TABLE(
  gross_income INTEGER,
  maintenance_cost INTEGER,
  net_income INTEGER,
  bonuses_applied JSONB
) AS $$
DECLARE
  territory_record public.territories%ROWTYPE;
  control_record public.territory_control%ROWTYPE;
  base_income INTEGER;
  maintenance INTEGER;
  income_modifier DECIMAL;
  control_bonus DECIMAL;
  fortification_bonus DECIMAL;
  final_gross INTEGER;
  final_maintenance INTEGER;
  final_net INTEGER;
  bonuses JSONB;
BEGIN
  -- Get territory and control data
  SELECT * INTO territory_record FROM public.territories WHERE id = territory_uuid;
  SELECT * INTO control_record FROM public.territory_control WHERE territory_id = territory_uuid;

  IF territory_record.id IS NULL OR control_record.id IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, '{}'::JSONB;
    RETURN;
  END IF;

  -- Calculate base income for the time period
  base_income := ROUND(territory_record.base_income_per_hour * hours_elapsed);
  maintenance := ROUND(territory_record.maintenance_cost_per_hour * hours_elapsed);

  -- Apply control percentage bonus
  control_bonus := control_record.control_percentage / 100.0;

  -- Apply fortification bonus (5% per level)
  fortification_bonus := 1.0 + (control_record.fortification_level * 0.05);

  -- Apply income modifier from control record
  income_modifier := control_record.income_modifier;

  -- Calculate final amounts
  final_gross := ROUND(base_income * control_bonus * fortification_bonus * income_modifier);
  final_maintenance := maintenance;
  final_net := final_gross - final_maintenance;

  -- Build bonuses JSON
  bonuses := json_build_object(
    'control_percentage', control_record.control_percentage,
    'control_bonus', control_bonus,
    'fortification_level', control_record.fortification_level,
    'fortification_bonus', fortification_bonus,
    'income_modifier', income_modifier
  );

  RETURN QUERY SELECT final_gross, final_maintenance, final_net, bonuses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process hourly territory income for all families
CREATE OR REPLACE FUNCTION public.process_territory_income()
RETURNS void AS $$
DECLARE
  control_rec RECORD;
  income_result RECORD;
BEGIN
  -- Process income for each controlled territory
  FOR control_rec IN
    SELECT tc.*, t.name as territory_name
    FROM public.territory_control tc
    JOIN public.territories t ON t.id = tc.territory_id
    WHERE tc.control_percentage > 0
  LOOP
    -- Calculate income for 1 hour
    SELECT * INTO income_result
    FROM public.calculate_territory_income(control_rec.territory_id, 1.0);

    -- Update territory control with new income
    UPDATE public.territory_control
    SET
      total_income_generated = total_income_generated + income_result.net_income,
      last_income_at = NOW()
    WHERE id = control_rec.id;

    -- Update family economics (if family tables exist)
    -- This will be implemented when family economics are ready

    -- Record income history
    INSERT INTO public.territory_income_history (
      territory_id,
      controlling_family_id,
      gross_income,
      maintenance_costs,
      net_income,
      base_multiplier,
      control_percentage_bonus,
      fortification_bonus,
      synergy_bonuses,
      income_period_start,
      income_period_end
    ) VALUES (
      control_rec.territory_id,
      control_rec.controlling_family_id,
      income_result.gross_income,
      income_result.maintenance_cost,
      income_result.net_income,
      control_rec.income_modifier,
      control_rec.control_percentage / 100.0,
      1.0 + (control_rec.fortification_level * 0.05),
      income_result.bonuses_applied,
      NOW() - INTERVAL '1 hour',
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to advance war phases
CREATE OR REPLACE FUNCTION public.advance_war_phase(war_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  war_record public.territory_wars%ROWTYPE;
  new_phase public.contest_phase;
  phase_duration INTEGER;
BEGIN
  SELECT * INTO war_record FROM public.territory_wars WHERE id = war_uuid;

  IF war_record.id IS NULL OR war_record.winner_family_id IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  -- Determine next phase and duration
  CASE war_record.current_phase
    WHEN 'scouting' THEN
      new_phase := 'sabotage';
      phase_duration := 12; -- 12 hours for sabotage
    WHEN 'sabotage' THEN
      new_phase := 'showdown';
      phase_duration := 24; -- 24 hours for showdown
    WHEN 'showdown' THEN
      new_phase := 'consolidation';
      phase_duration := 6; -- 6 hours for consolidation
    WHEN 'consolidation' THEN
      -- War ends, determine winner based on control_bar_position
      UPDATE public.territory_wars
      SET
        winner_family_id = CASE
          WHEN control_bar_position > 0 THEN attacking_family_id
          ELSE defending_family_id
        END,
        war_ended_at = NOW(),
        ending_reason = 'victory',
        updated_at = NOW()
      WHERE id = war_uuid;
      RETURN TRUE;
    ELSE
      RETURN FALSE;
  END CASE;

  -- Update to next phase
  UPDATE public.territory_wars
  SET
    current_phase = new_phase,
    phase_started_at = NOW(),
    phase_duration_hours = phase_duration,
    updated_at = NOW()
  WHERE id = war_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add missing stat points columns to player_economics table
-- Safe migration that adds columns with default values

-- Add unspent stat points
ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS unspent_stat_points INTEGER DEFAULT 0;

-- Add allocated stat points for each category
ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS allocated_health_points INTEGER DEFAULT 0;

ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS allocated_energy_points INTEGER DEFAULT 0;

ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS allocated_attack_points INTEGER DEFAULT 0;

ALTER TABLE public.player_economics
ADD COLUMN IF NOT EXISTS allocated_defense_points INTEGER DEFAULT 0;

-- Add constraints to ensure non-negative values
ALTER TABLE public.player_economics
ADD CONSTRAINT check_unspent_stat_points_non_negative
CHECK (unspent_stat_points >= 0);

ALTER TABLE public.player_economics
ADD CONSTRAINT check_allocated_health_points_non_negative
CHECK (allocated_health_points >= 0);

ALTER TABLE public.player_economics
ADD CONSTRAINT check_allocated_energy_points_non_negative
CHECK (allocated_energy_points >= 0);

ALTER TABLE public.player_economics
ADD CONSTRAINT check_allocated_attack_points_non_negative
CHECK (allocated_attack_points >= 0);

ALTER TABLE public.player_economics
ADD CONSTRAINT check_allocated_defense_points_non_negative
CHECK (allocated_defense_points >= 0);

-- Update existing players to have some initial stat points based on their level
-- This is a one-time update for existing data
UPDATE public.player_economics
SET unspent_stat_points = GREATEST(0, experience_points / 100)
WHERE unspent_stat_points = 0 AND experience_points > 0;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully added stat points columns to player_economics table';
END $$;
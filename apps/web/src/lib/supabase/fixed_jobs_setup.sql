-- Complete Jobs System Setup (Fixed Version)
-- Run this entire script in your Supabase SQL editor

-- First, create the tables
-- Job Categories and Templates
CREATE TABLE IF NOT EXISTS public.job_templates (
  id UUID DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- street, racket, heist, political, territory
  required_rank VARCHAR(20) DEFAULT 'Associate', -- Associate, Soldier, Capo, Don
  energy_cost INTEGER NOT NULL,
  base_payout_min INTEGER NOT NULL,
  base_payout_max INTEGER NOT NULL,
  success_rate_base DECIMAL(5,2) DEFAULT 75.00, -- Base success rate percentage
  risk_level INTEGER DEFAULT 1, -- 1-5, affects heat and consequences
  experience_reward INTEGER DEFAULT 10,
  reputation_reward INTEGER DEFAULT 5,
  cooldown_minutes INTEGER DEFAULT 60,
  required_attack_power INTEGER DEFAULT 0,
  required_defense_power INTEGER DEFAULT 0,
  icon_name VARCHAR(50),
  flavor_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Item Templates (Loot)
CREATE TABLE IF NOT EXISTS public.item_templates (
  id UUID DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- weapon, protection, tool, consumable, money
  rarity VARCHAR(20) DEFAULT 'common', -- common, uncommon, rare, epic, legendary
  attack_power INTEGER DEFAULT 0,
  defense_power INTEGER DEFAULT 0,
  special_bonus JSONB DEFAULT '{}', -- Additional effects like success_rate_bonus, energy_bonus, etc.
  base_value INTEGER DEFAULT 0, -- Market value in dollars
  icon_name VARCHAR(50),
  flavor_text TEXT,
  can_stack BOOLEAN DEFAULT false,
  max_stack_size INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Player Inventory
CREATE TABLE IF NOT EXISTS public.player_inventory (
  id UUID DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  item_template_id UUID REFERENCES public.item_templates(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT false,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Player Economics
CREATE TABLE IF NOT EXISTS public.player_economics (
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  cash_on_hand INTEGER DEFAULT 1000, -- Starting money
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  heat_level INTEGER DEFAULT 0, -- 0-100, affects job success and police attention
  territory_owned INTEGER DEFAULT 0, -- Number of territories controlled
  experience_points INTEGER DEFAULT 0,
  attack_power INTEGER DEFAULT 10, -- Base + equipment bonuses
  defense_power INTEGER DEFAULT 10, -- Base + equipment bonuses
  last_job_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (player_id)
);

-- Job Execution History
CREATE TABLE IF NOT EXISTS public.job_executions (
  id UUID DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  job_template_id UUID REFERENCES public.job_templates(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  payout INTEGER DEFAULT 0,
  energy_spent INTEGER NOT NULL,
  experience_gained INTEGER DEFAULT 0,
  reputation_gained INTEGER DEFAULT 0,
  heat_gained INTEGER DEFAULT 0,
  loot_gained JSONB DEFAULT '[]', -- Array of items received
  execution_details JSONB DEFAULT '{}', -- Job-specific data
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Territories (for high-level gameplay)
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  controlled_by UUID REFERENCES public.players(id),
  income_per_hour INTEGER DEFAULT 100,
  required_attack_power INTEGER DEFAULT 50,
  last_income_collected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_economics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can view job templates" ON public.job_templates;
DROP POLICY IF EXISTS "Anyone can view item templates" ON public.item_templates;
DROP POLICY IF EXISTS "Players can view own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Players can manage own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Players can view own economics" ON public.player_economics;
DROP POLICY IF EXISTS "Players can update own economics" ON public.player_economics;
DROP POLICY IF EXISTS "Players can insert own economics" ON public.player_economics;
DROP POLICY IF EXISTS "Players can view own job history" ON public.job_executions;
DROP POLICY IF EXISTS "Players can insert own job executions" ON public.job_executions;
DROP POLICY IF EXISTS "Anyone can view territories" ON public.territories;
DROP POLICY IF EXISTS "Territory owners can update" ON public.territories;

-- RLS Policies
CREATE POLICY "Anyone can view job templates" ON public.job_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can view item templates" ON public.item_templates FOR SELECT USING (true);

CREATE POLICY "Players can view own inventory" ON public.player_inventory FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can manage own inventory" ON public.player_inventory FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Players can view own economics" ON public.player_economics FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can update own economics" ON public.player_economics FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Players can insert own economics" ON public.player_economics FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can view own job history" ON public.job_executions FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can insert own job executions" ON public.job_executions FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Anyone can view territories" ON public.territories FOR SELECT USING (true);
CREATE POLICY "Territory owners can update" ON public.territories FOR UPDATE USING (auth.uid() = controlled_by);

-- Function to calculate player's total attack power
CREATE OR REPLACE FUNCTION public.calculate_attack_power(player_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  base_attack INTEGER := 10;
  equipment_bonus INTEGER := 0;
BEGIN
  -- Get equipment bonus from equipped items
  SELECT COALESCE(SUM(it.attack_power), 0) INTO equipment_bonus
  FROM public.player_inventory pi
  JOIN public.item_templates it ON pi.item_template_id = it.id
  WHERE pi.player_id = player_uuid AND pi.is_equipped = true;
  
  RETURN base_attack + equipment_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate player's total defense power
CREATE OR REPLACE FUNCTION public.calculate_defense_power(player_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  base_defense INTEGER := 10;
  equipment_bonus INTEGER := 0;
BEGIN
  -- Get equipment bonus from equipped items
  SELECT COALESCE(SUM(it.defense_power), 0) INTO equipment_bonus
  FROM public.player_inventory pi
  JOIN public.item_templates it ON pi.item_template_id = it.id
  WHERE pi.player_id = player_uuid AND pi.is_equipped = true;
  
  RETURN base_defense + equipment_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get possible loot for a job
CREATE OR REPLACE FUNCTION public.get_job_loot_pool(job_category VARCHAR, job_rank VARCHAR)
RETURNS TABLE (
  item_template_id UUID,
  drop_chance DECIMAL,
  min_quantity INTEGER,
  max_quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.id as item_template_id,
    CASE 
      WHEN job_rank = 'Associate' THEN
        CASE it.rarity
          WHEN 'common' THEN 25.0
          WHEN 'uncommon' THEN 5.0
          ELSE 0.0
        END
      WHEN job_rank = 'Soldier' THEN
        CASE it.rarity
          WHEN 'common' THEN 20.0
          WHEN 'uncommon' THEN 10.0
          WHEN 'rare' THEN 3.0
          ELSE 0.0
        END
      WHEN job_rank = 'Capo' THEN
        CASE it.rarity
          WHEN 'common' THEN 15.0
          WHEN 'uncommon' THEN 12.0
          WHEN 'rare' THEN 6.0
          WHEN 'epic' THEN 2.0
          ELSE 0.0
        END
      WHEN job_rank = 'Don' THEN
        CASE it.rarity
          WHEN 'common' THEN 10.0
          WHEN 'uncommon' THEN 15.0
          WHEN 'rare' THEN 8.0
          WHEN 'epic' THEN 4.0
          WHEN 'legendary' THEN 1.0
          ELSE 0.0
        END
      ELSE 0.0
    END as drop_chance,
    CASE it.can_stack WHEN true THEN 1 ELSE 1 END as min_quantity,
    CASE it.can_stack WHEN true THEN 3 ELSE 1 END as max_quantity
  FROM public.item_templates it
  WHERE 
    -- Filter items relevant to job category
    (job_category = 'street' AND it.item_type IN ('weapon', 'tool', 'consumable')) OR
    (job_category = 'racket' AND it.item_type IN ('weapon', 'protection', 'tool')) OR
    (job_category = 'heist' AND it.item_type IN ('weapon', 'tool', 'protection')) OR
    (job_category = 'political' AND it.item_type IN ('tool', 'protection')) OR
    (job_category = 'territory' AND it.item_type IN ('weapon', 'protection'))
  AND (CASE 
    WHEN job_rank = 'Associate' THEN
      CASE it.rarity
        WHEN 'common' THEN 25.0
        WHEN 'uncommon' THEN 5.0
        ELSE 0.0
      END
    WHEN job_rank = 'Soldier' THEN
      CASE it.rarity
        WHEN 'common' THEN 20.0
        WHEN 'uncommon' THEN 10.0
        WHEN 'rare' THEN 3.0
        ELSE 0.0
      END
    WHEN job_rank = 'Capo' THEN
      CASE it.rarity
        WHEN 'common' THEN 15.0
        WHEN 'uncommon' THEN 12.0
        WHEN 'rare' THEN 6.0
        WHEN 'epic' THEN 2.0
        ELSE 0.0
      END
    WHEN job_rank = 'Don' THEN
      CASE it.rarity
        WHEN 'common' THEN 10.0
        WHEN 'uncommon' THEN 15.0
        WHEN 'rare' THEN 8.0
        WHEN 'epic' THEN 4.0
        WHEN 'legendary' THEN 1.0
        ELSE 0.0
      END
    ELSE 0.0
  END) > 0
  ORDER BY it.rarity, it.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced job execution function with loot drops
CREATE OR REPLACE FUNCTION public.execute_job_with_loot(
  job_template_uuid UUID,
  player_uuid UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  job_template public.job_templates%ROWTYPE;
  player_econ public.player_economics%ROWTYPE;
  player_data public.players%ROWTYPE;
  success_rate DECIMAL;
  is_success BOOLEAN;
  payout INTEGER;
  energy_cost INTEGER;
  heat_gain INTEGER;
  exp_gain INTEGER;
  rep_gain INTEGER;
  player_attack INTEGER;
  player_defense INTEGER;
  loot_drops JSONB := '[]';
  loot_record RECORD;
  result JSONB;
  drop_roll DECIMAL;
  quantity INTEGER;
  existing_item_id UUID;
BEGIN
  -- Get job template
  SELECT * INTO job_template FROM public.job_templates WHERE id = job_template_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found');
  END IF;
  
  -- Get player data
  SELECT * INTO player_data FROM public.players WHERE id = player_uuid;
  SELECT * INTO player_econ FROM public.player_economics WHERE player_id = player_uuid;
  
  IF player_econ IS NULL THEN
    -- Initialize player economics if not exists
    INSERT INTO public.player_economics (player_id) VALUES (player_uuid);
    SELECT * INTO player_econ FROM public.player_economics WHERE player_id = player_uuid;
  END IF;
  
  -- Validation checks
  IF player_data.energy < job_template.energy_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough energy');
  END IF;
  
  -- Check rank requirement
  IF (job_template.required_rank = 'Soldier' AND player_data.rank IN ('Associate')) OR
     (job_template.required_rank = 'Capo' AND player_data.rank IN ('Associate', 'Soldier')) OR
     (job_template.required_rank = 'Don' AND player_data.rank != 'Don') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient rank');
  END IF;
  
  -- Calculate attack and defense power
  player_attack := public.calculate_attack_power(player_uuid);
  player_defense := public.calculate_defense_power(player_uuid);
  
  -- Check power requirements
  IF player_attack < job_template.required_attack_power OR player_defense < job_template.required_defense_power THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient combat power');
  END IF;
  
  -- Calculate success rate
  success_rate := job_template.success_rate_base;
  success_rate := success_rate - (player_econ.heat_level * 0.5);
  success_rate := GREATEST(success_rate, 10);
  
  -- Determine success
  is_success := (RANDOM() * 100) <= success_rate;
  
  -- Calculate rewards/penalties
  IF is_success THEN
    payout := job_template.base_payout_min + (RANDOM() * (job_template.base_payout_max - job_template.base_payout_min))::INTEGER;
    exp_gain := job_template.experience_reward;
    rep_gain := job_template.reputation_reward;
    heat_gain := job_template.risk_level;
    
    -- Process loot drops for successful jobs
    FOR loot_record IN 
      SELECT * FROM public.get_job_loot_pool(job_template.category, job_template.required_rank)
    LOOP
      drop_roll := RANDOM() * 100;
      
      IF drop_roll <= loot_record.drop_chance THEN
        quantity := loot_record.min_quantity;
        IF loot_record.max_quantity > loot_record.min_quantity THEN
          quantity := quantity + (RANDOM() * (loot_record.max_quantity - loot_record.min_quantity))::INTEGER;
        END IF;
        
        -- Check if player already has this item
        SELECT id INTO existing_item_id
        FROM public.player_inventory 
        WHERE player_id = player_uuid AND item_template_id = loot_record.item_template_id;
        
        IF existing_item_id IS NOT NULL THEN
          -- Update existing item quantity
          UPDATE public.player_inventory 
          SET quantity = player_inventory.quantity + execute_job_with_loot.quantity
          WHERE id = existing_item_id;
        ELSE
          -- Add new item to inventory
          INSERT INTO public.player_inventory (player_id, item_template_id, quantity)
          VALUES (player_uuid, loot_record.item_template_id, quantity);
        END IF;
        
        -- Add to loot drops list for response
        loot_drops := loot_drops || jsonb_build_object(
          'item_template_id', loot_record.item_template_id,
          'quantity', quantity
        );
      END IF;
    END LOOP;
  ELSE
    payout := 0;
    exp_gain := job_template.experience_reward / 4;
    rep_gain := 0;
    heat_gain := job_template.risk_level * 2;
  END IF;
  
  energy_cost := job_template.energy_cost;
  
  -- Update player
  UPDATE public.players 
  SET 
    energy = energy - energy_cost,
    reputation_score = reputation_score + rep_gain
  WHERE id = player_uuid;
  
  -- Update economics and combat stats
  UPDATE public.player_economics 
  SET 
    cash_on_hand = cash_on_hand + payout,
    total_earned = total_earned + payout,
    heat_level = LEAST(heat_level + heat_gain, 100),
    experience_points = experience_points + exp_gain,
    attack_power = public.calculate_attack_power(player_uuid),
    defense_power = public.calculate_defense_power(player_uuid),
    last_job_at = NOW(),
    updated_at = NOW()
  WHERE player_id = player_uuid;
  
  -- Record execution
  INSERT INTO public.job_executions (
    player_id, job_template_id, success, payout, energy_spent, 
    experience_gained, reputation_gained, heat_gained, loot_gained
  ) VALUES (
    player_uuid, job_template_uuid, is_success, payout, energy_cost,
    exp_gain, rep_gain, heat_gain, loot_drops
  );
  
  -- Build result
  result := jsonb_build_object(
    'success', true,
    'job_success', is_success,
    'payout', payout,
    'energy_spent', energy_cost,
    'experience_gained', exp_gain,
    'reputation_gained', rep_gain,
    'heat_gained', heat_gain,
    'loot_gained', loot_drops,
    'message', CASE 
      WHEN is_success THEN 
        CASE 
          WHEN jsonb_array_length(loot_drops) > 0 THEN 'Job completed successfully! You found some loot!'
          ELSE 'Job completed successfully!'
        END
      ELSE 'Job failed, but you learned something...'
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear existing data and insert fresh job templates
TRUNCATE public.job_templates CASCADE;
INSERT INTO public.job_templates (name, description, category, required_rank, energy_cost, base_payout_min, base_payout_max, success_rate_base, risk_level, experience_reward, reputation_reward, cooldown_minutes, icon_name, flavor_text) VALUES

-- Associate Level Jobs (Street)
('Protection Racket', 'Collect protection money from local businesses', 'street', 'Associate', 15, 50, 150, 80.0, 2, 15, 5, 30, '🏪', 'A little insurance never hurt nobody.'),
('Numbers Running', 'Run illegal lottery numbers for the neighborhood', 'street', 'Associate', 10, 30, 100, 85.0, 1, 10, 3, 45, '🎲', 'Everyone wants to get lucky.'),
('Loan Sharking', 'Collect on outstanding debts with interest', 'street', 'Associate', 20, 75, 200, 75.0, 3, 20, 8, 60, '💰', 'Pay up, or pay the consequences.'),
('Cigarette Smuggling', 'Transport untaxed cigarettes across state lines', 'street', 'Associate', 25, 100, 250, 70.0, 2, 25, 10, 90, '🚬', 'Tax-free profits, government-free problems.'),

-- Soldier Level Jobs (Rackets)  
('Casino Skimming', 'Skim profits from casino operations before they hit the books', 'racket', 'Soldier', 30, 200, 500, 70.0, 3, 40, 15, 120, '🎰', 'The house always wins, especially when we help count.'),
('Truck Hijacking', 'Intercept valuable cargo shipments', 'racket', 'Soldier', 35, 300, 800, 65.0, 4, 50, 20, 180, '🚛', 'Finders keepers, losers weepers.'),
('Underground Fighting', 'Organize illegal boxing matches and betting', 'racket', 'Soldier', 25, 150, 400, 75.0, 2, 35, 12, 150, '🥊', 'Blood, sweat, and cold hard cash.'),
('Drug Distribution', 'Move product through established networks', 'racket', 'Soldier', 40, 400, 1000, 60.0, 5, 60, 25, 240, '💊', 'Supply and demand, emphasis on demand.'),

-- Capo Level Jobs (Heists & Political)
('Bank Heist', 'Execute a precision bank robbery', 'heist', 'Capo', 60, 2000, 5000, 50.0, 5, 100, 50, 480, '🏦', 'Where the money lives, we take it.'),
('Political Bribery', 'Secure favorable legislation through strategic donations', 'political', 'Capo', 45, 1000, 3000, 65.0, 4, 80, 40, 360, '🏛️', 'Democracy is for sale, we just name the price.'),
('Construction Bid Rigging', 'Fix government contracts in our favor', 'political', 'Capo', 50, 1500, 4000, 60.0, 3, 90, 45, 300, '🏗️', 'We built this city, literally.'),
('Money Laundering', 'Clean dirty money through legitimate businesses', 'racket', 'Capo', 40, 800, 2000, 75.0, 2, 70, 30, 200, '🧼', 'Making dirty money squeaky clean.'),

-- Don Level Jobs (Territory & High Stakes)
('Territory War', 'Expand family influence by taking rival territory', 'territory', 'Don', 80, 5000, 12000, 40.0, 5, 200, 100, 720, '⚔️', 'This town ain''t big enough for all of us.'),
('Federal Judge Corruption', 'Ensure favorable rulings in high-profile cases', 'political', 'Don', 70, 8000, 15000, 45.0, 5, 180, 120, 600, '⚖️', 'Justice is blind, but she can still be bought.'),
('International Arms Deal', 'Broker weapons sales to foreign contacts', 'heist', 'Don', 90, 10000, 25000, 35.0, 5, 250, 150, 900, '🔫', 'War is business, and business is good.'),
('Family Alliance', 'Negotiate strategic partnerships with other crime families', 'political', 'Don', 60, 3000, 8000, 70.0, 3, 150, 80, 480, '🤝', 'Keep your friends close, your enemies closer.');

-- Clear existing data and insert item templates
TRUNCATE public.item_templates CASCADE;
INSERT INTO public.item_templates (name, description, item_type, rarity, attack_power, defense_power, special_bonus, base_value, icon_name, flavor_text) VALUES

-- Weapons
('Brass Knuckles', 'Street-level intimidation tool', 'weapon', 'common', 5, 0, '{}', 50, '👊', 'Sometimes your fists need a little help.'),
('.38 Snub Nose', 'Compact and concealable revolver', 'weapon', 'common', 15, 0, '{}', 200, '🔫', 'Small gun, big problems.'),
('Thompson Submachine Gun', 'The classic tommy gun of prohibition era', 'weapon', 'rare', 25, 0, '{"intimidation_bonus": 10}', 800, '🔫', 'Say hello to my little friend.'),
('Lupara', 'Traditional Sicilian sawed-off shotgun', 'weapon', 'uncommon', 20, 0, '{"close_combat_bonus": 15}', 400, '🔫', 'Respect is earned at the barrel of a gun.'),
('Molotov Cocktail', 'Improvised incendiary device', 'weapon', 'common', 10, 0, '{"area_damage": true}', 25, '🍶', 'Sometimes you need to send a burning message.'),

-- Protection
('Bulletproof Vest', 'Kevlar protection against small arms fire', 'protection', 'uncommon', 0, 15, '{}', 300, '🦺', 'Better safe than sorry.'),
('Armored Sedan', 'Reinforced luxury vehicle', 'protection', 'rare', 0, 25, '{"escape_bonus": 20}', 2000, '🚗', 'Ride in style, ride in safety.'),
('Bodyguard Detail', 'Professional protection services', 'protection', 'epic', 0, 35, '{"intimidation_bonus": 15}', 5000, '🕴️', 'Your safety is their business.'),
('Safe House', 'Secure location for laying low', 'protection', 'rare', 0, 20, '{"heat_reduction": 5}', 1500, '🏠', 'Home is where the safety is.'),

-- Tools
('Lock Picks', 'Professional burglary tools', 'tool', 'common', 0, 0, '{"heist_bonus": 10}', 100, '🔓', 'Every door has a key, you just need to find it.'),
('Fake Documents', 'High-quality forged identification', 'tool', 'uncommon', 0, 0, '{"heat_reduction": 3}', 500, '📄', 'You are whoever you say you are.'),
('Wire Taps', 'Electronic surveillance equipment', 'tool', 'rare', 0, 0, '{"intel_bonus": 20}', 800, '📻', 'Knowledge is power, secrets are leverage.'),
('Explosives', 'Military-grade demolition charges', 'tool', 'epic', 5, 0, '{"heist_bonus": 25}', 2000, '💣', 'When you absolutely need a door opened.'),
('Police Scanner', 'Monitor law enforcement communications', 'tool', 'uncommon', 0, 5, '{"heat_reduction": 2}', 300, '📡', 'Know what they know before they know you know.');

-- Try to add tables to realtime publication (ignore errors if already exist)
DO $$
BEGIN
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.job_templates;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- ignore error
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.item_templates;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- ignore error
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.player_economics;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- ignore error
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.job_executions;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- ignore error
    END;
END $$;
-- Fix for ambiguous column reference "quantity" in job execution functions
-- This addresses PostgreSQL error 42702: column reference "quantity" is ambiguous

-- Fix the execute_job_with_loot function in loot-functions.sql
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
  item_quantity INTEGER;
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
  
  IF NOT FOUND THEN
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
  success_rate := success_rate - (player_econ.heat_level * 0.5); -- Heat reduces success
  success_rate := GREATEST(success_rate, 10); -- Minimum 10% success rate
  
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
        -- Calculate quantity
        item_quantity := loot_record.min_quantity;
        IF loot_record.max_quantity > loot_record.min_quantity THEN
          item_quantity := item_quantity + (RANDOM() * (loot_record.max_quantity - loot_record.min_quantity))::INTEGER;
        END IF;
        
        -- Check if player already has this item
        SELECT id INTO existing_item_id
        FROM public.player_inventory 
        WHERE player_id = player_uuid AND item_template_id = loot_record.item_template_id;
        
        IF existing_item_id IS NOT NULL THEN
          -- FIXED: Update existing item quantity using renamed variable to avoid ambiguity
          UPDATE public.player_inventory 
          SET quantity = quantity + item_quantity
          WHERE id = existing_item_id;
        ELSE
          -- Add new item to inventory
          INSERT INTO public.player_inventory (player_id, item_template_id, quantity)
          VALUES (player_uuid, loot_record.item_template_id, item_quantity);
        END IF;
        
        -- Add to loot drops list for response
        loot_drops := loot_drops || jsonb_build_object(
          'item_template_id', loot_record.item_template_id,
          'quantity', item_quantity
        );
      END IF;
    END LOOP;
  ELSE
    payout := 0;
    exp_gain := job_template.experience_reward / 4; -- Reduced XP for failure
    rep_gain := 0;
    heat_gain := job_template.risk_level * 2; -- More heat for failed jobs
    -- No loot for failed jobs
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
    heat_level = LEAST(100, heat_level + heat_gain),
    experience_points = experience_points + exp_gain,
    last_job_at = NOW()
  WHERE player_id = player_uuid;
  
  -- Record job execution
  INSERT INTO public.job_executions (
    player_id, 
    job_template_id, 
    success, 
    payout, 
    energy_spent, 
    experience_gained, 
    reputation_gained,
    heat_gained,
    loot_gained,
    execution_details
  ) VALUES (
    player_uuid,
    job_template_uuid,
    is_success,
    payout,
    energy_cost,
    exp_gain,
    rep_gain,
    heat_gain,
    loot_drops,
    jsonb_build_object(
      'success_rate', success_rate,
      'attack_power', player_attack,
      'defense_power', player_defense
    )
  );
  
  -- Build response
  result := jsonb_build_object(
    'success', true,
    'job_success', is_success,
    'message', CASE WHEN is_success THEN 'Job completed successfully!' ELSE 'Job failed, but you gained some experience.' END,
    'payout', payout,
    'energy_spent', energy_cost,
    'experience_gained', exp_gain,
    'reputation_gained', rep_gain,
    'heat_gained', heat_gain,
    'loot_gained', loot_drops
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
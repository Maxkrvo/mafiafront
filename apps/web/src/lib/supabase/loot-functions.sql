-- Enhanced loot drop system for jobs
-- This extends the job execution function with sophisticated loot mechanics

-- Function to get possible loot for a job
CREATE OR REPLACE FUNCTION public.get_job_loot_pool(job_category VARCHAR, job_rank VARCHAR)
RETURNS TABLE (
  item_template_id UUID,
  drop_chance DECIMAL,
  min_quantity INTEGER,
  max_quantity INTEGER
) AS $$
BEGIN
  -- Return loot pool based on job category and rank
  -- Higher rank jobs have better loot chances and rarer items
  
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
  AND drop_chance > 0
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
  
  IF NOT FOUND THEN
    -- Initialize player economics if not exists
    INSERT INTO public.player_economics (player_id) VALUES (player_uuid);
    SELECT * INTO player_econ FROM public.player_economics WHERE player_id = player_uuid;
  END IF;
  
  -- Validation checks (same as before)
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
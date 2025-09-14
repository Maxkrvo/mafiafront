-- Fix for family creation permissions issue
-- The create_family function was not setting boss permissions correctly

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
  member_id UUID;
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

  -- Add creator as boss with proper permissions
  INSERT INTO family_members (
    family_id,
    player_id,
    family_rank,
    joined_at,
    permissions
  )
  VALUES (
    family_id,
    p_creator_id,
    'boss',
    NOW(),
    '{
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
    }'::JSONB
  )
  RETURNING id INTO member_id;

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

-- Also create a function to fix existing boss permissions for families that were created before this fix
CREATE OR REPLACE FUNCTION fix_existing_boss_permissions()
RETURNS INTEGER AS $$
DECLARE
  fixed_count INTEGER := 0;
  boss_member RECORD;
BEGIN
  -- Find all family members with boss rank who don't have full permissions
  FOR boss_member IN
    SELECT fm.id, fm.family_id, fm.player_id
    FROM family_members fm
    WHERE fm.family_rank = 'boss'
      AND (
        fm.permissions->>'can_approve_requests' != 'true' OR
        fm.permissions->>'can_kick_members' != 'true' OR
        fm.permissions->>'can_promote_demote' != 'true' OR
        fm.permissions->>'can_manage_treasury' != 'true'
      )
  LOOP
    -- Update their permissions to boss level
    UPDATE family_members
    SET permissions = '{
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
    }'::JSONB,
    updated_at = NOW()
    WHERE id = boss_member.id;

    fixed_count := fixed_count + 1;
  END LOOP;

  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the fix for existing families
SELECT fix_existing_boss_permissions() as fixed_boss_count;
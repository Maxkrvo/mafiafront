-- =====================================================================
-- Reusable Query: Assign All Territories to AI Family
-- =====================================================================
-- This script creates an AI family (if it doesn't exist) and assigns
-- all territories to that family. It's designed to be reusable and safe.
-- =====================================================================

BEGIN;

-- Step 1: Create AI family if it doesn't exist
DO $$
DECLARE
    ai_family_id UUID;
    ai_player_id UUID;
BEGIN
    -- Check if AI family already exists
    SELECT id INTO ai_family_id
    FROM families
    WHERE name = 'GAMBINO_FAMILY' OR display_name = 'Gambino Family';

    IF ai_family_id IS NULL THEN
        -- First check if AI player already exists
        SELECT id INTO ai_player_id FROM players WHERE username = 'don_gambino';

        -- If AI player doesn't exist, we need to use an existing auth user or create one
        IF ai_player_id IS NULL THEN
            -- Try to find an existing admin/system user to use
            -- You can replace this with a specific user ID if you have one
            SELECT id INTO ai_player_id
            FROM players
            WHERE nickname ILIKE '%admin%' OR nickname ILIKE '%system%'
            LIMIT 1;

            -- If no suitable user found, you'll need to manually create an auth user first
            -- or use an existing user ID. For now, let's use the first available user.
            IF ai_player_id IS NULL THEN
                SELECT id INTO ai_player_id FROM players LIMIT 1;
            END IF;

            -- If still no user found, we cannot proceed
            IF ai_player_id IS NULL THEN
                RAISE EXCEPTION 'No existing user found. Please create a user first or specify an existing user ID to use for the Gambino Family boss.';
            END IF;

            -- Update the existing player to be Don Gambino
            UPDATE players SET
                nickname = 'Don Gambino',
                username = 'don_gambino',
                famiglia_name = 'Gambino Family',
                rank = 'Don',
                bio = 'The most powerful crime boss in the city',
                reputation_score = GREATEST(reputation_score, 100000),
                updated_at = NOW()
            WHERE id = ai_player_id;
        END IF;


        -- Create AI family
        INSERT INTO families (
            id,
            name,
            display_name,
            description,
            motto,
            color_hex,
            boss_id,
            treasury_balance,
            reputation_score,
            respect_points,
            creation_fee_paid,
            created_by,
            is_active,
            is_recruiting,
            max_members,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'GAMBINO_FAMILY',
            'Gambino Family',
            'The most powerful crime family in the city, controlling vast territories through fear and respect',
            'Honor Above All',
            '#8B0000',
            ai_player_id,
            999999999,
            100000,
            50000,
            0,
            ai_player_id,
            true,
            false,
            100,
            NOW(),
            NOW()
        )
        RETURNING id INTO ai_family_id;

        -- Add AI player as boss of the family
        INSERT INTO family_members (
            family_id,
            player_id,
            family_rank,
            title,
            permissions,
            joined_at,
            created_at,
            updated_at
        ) VALUES (
            ai_family_id,
            ai_player_id,
            'boss',
            'Don',
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
                "can_coordinate_operations": true
            }',
            NOW(),
            NOW(),
            NOW()
        );

        RAISE NOTICE 'Created Gambino Family with ID: %', ai_family_id;
    ELSE
        RAISE NOTICE 'Gambino Family already exists with ID: %', ai_family_id;
    END IF;

    -- Step 2: Assign all territories to AI family
    -- Check how many territories exist
    RAISE NOTICE 'Total territories in database: %', (SELECT COUNT(*) FROM territories);

    -- If no territories exist, create some basic ones
    IF (SELECT COUNT(*) FROM territories) = 0 THEN
        RAISE NOTICE 'No territories found. Creating basic territories...';

        -- Create basic territories
        INSERT INTO territories (name, display_name, description, map_x, map_y, territory_type, base_income_per_hour, maintenance_cost_per_hour, control_difficulty, is_contestable, min_defense_points, max_control_points)
        VALUES
        ('downtown_01', 'Financial District', 'High-value downtown area with banks and corporate offices', 3, 3, 'downtown', 5000, 500, 8, true, 100, 1000),
        ('docks_01', 'Main Harbor', 'Primary shipping and receiving dock', 0, 4, 'docks', 3000, 200, 5, true, 80, 800),
        ('industrial_01', 'Manufacturing Zone', 'Heavy manufacturing and factory district', 6, 0, 'industrial', 2500, 300, 4, true, 60, 600),
        ('casino_01', 'Golden Palace Casino', 'Luxury casino and entertainment venue', 2, 0, 'casino', 4000, 300, 5, true, 90, 900),
        ('neighborhood_01', 'Little Italy', 'Traditional Italian-American neighborhood', 1, 1, 'neighborhood', 1500, 100, 3, true, 50, 500),
        ('warehouse_01', 'Storage District', 'Large warehouse and distribution center', 5, 2, 'warehouse', 2000, 150, 3, true, 40, 400),
        ('smuggling_01', 'Black Market Hub', 'Underground trading and contraband operations', 7, 7, 'smuggling', 6000, 800, 9, true, 120, 1200),
        ('political_01', 'Government District', 'City hall and government buildings', 4, 5, 'political', 8000, 1000, 10, true, 150, 1500)
        ON CONFLICT (name) DO NOTHING;

        RAISE NOTICE 'Created % basic territories', (SELECT COUNT(*) FROM territories);
    END IF;

    -- First, clear any existing territory controls
    DELETE FROM territory_control;

    -- Insert territory control records for all territories
    INSERT INTO territory_control (
        territory_id,
        controlling_family_id,
        control_percentage,
        control_status,
        defense_points,
        guard_count,
        fortification_level,
        income_modifier,
        total_income_generated,
        last_income_at,
        controlled_since,
        times_contested,
        under_attack,
        created_at,
        updated_at
    )
    SELECT
        t.id as territory_id,
        ai_family_id as controlling_family_id,
        100 as control_percentage,
        'stable'::control_status as control_status,
        t.min_defense_points as defense_points,
        GREATEST(1, t.control_difficulty) as guard_count,
        1 as fortification_level,
        1.0 as income_modifier,
        0 as total_income_generated,
        NOW() as last_income_at,
        NOW() as controlled_since,
        0 as times_contested,
        false as under_attack,
        NOW() as created_at,
        NOW() as updated_at
    FROM territories t
    ON CONFLICT (territory_id) DO UPDATE SET
        controlling_family_id = ai_family_id,
        control_percentage = 100,
        control_status = 'stable'::control_status,
        under_attack = false,
        controlled_since = NOW(),
        updated_at = NOW();

    -- Step 3: Update family statistics
    UPDATE families
    SET
        total_territories = (SELECT COUNT(*) FROM territories),
        updated_at = NOW()
    WHERE id = ai_family_id;

    -- Step 4: Display results
    RAISE NOTICE 'Successfully assigned % territories to Gambino Family',
        (SELECT COUNT(*) FROM territories);
    RAISE NOTICE 'Gambino Family now controls % territories',
        (SELECT total_territories FROM families WHERE id = ai_family_id);
    RAISE NOTICE 'Territory control records created: %',
        (SELECT COUNT(*) FROM territory_control WHERE controlling_family_id = ai_family_id);

END $$;

COMMIT;

-- =====================================================================
-- Verification Query (run separately to check results)
-- =====================================================================
/*
SELECT
    f.name as family_name,
    f.display_name,
    COUNT(tc.territory_id) as territories_controlled,
    f.total_territories as family_total_count
FROM families f
LEFT JOIN territory_control tc ON tc.controlling_family_id = f.id
WHERE f.name = 'GAMBINO_FAMILY'
GROUP BY f.id, f.name, f.display_name, f.total_territories;

-- View all territory assignments
SELECT
    t.name as territory_name,
    t.display_name as territory_display_name,
    t.territory_type,
    f.display_name as controlling_family,
    tc.control_percentage,
    tc.control_status
FROM territory_control tc
JOIN territories t ON t.id = tc.territory_id
JOIN families f ON f.id = tc.controlling_family_id
ORDER BY t.territory_type, t.name;
*/
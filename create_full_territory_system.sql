-- =====================================================================
-- Territory System Foundation - Complete 64 Territory Map Generation
-- =====================================================================
-- This script creates a complete 8x8 territory grid (64 territories)
-- following the principles outlined in TerritorySystemFoundation.md
-- =====================================================================

BEGIN;

-- Clear existing territories if needed
DELETE FROM territory_control;
DELETE FROM territories;

-- =====================================================================
-- Step 1: Create Districts Following Foundation Layout
-- =====================================================================

-- Downtown Core (2x2 center - positions 3,3 to 4,4) - Highest value
INSERT INTO territories (
    name, display_name, description, map_x, map_y, territory_type,
    base_income_per_hour, maintenance_cost_per_hour, control_difficulty,
    resource_types, special_bonuses, min_defense_points, max_control_points,
    is_strategic, is_contestable, created_at, updated_at
) VALUES
-- Downtown District (High-value center)
('downtown_core', 'Financial District', 'The heart of the citys financial power - banks, corporate headquarters, and government contracts', 3, 3, 'downtown', 8000, 1000, 10,
 '{cash,influence}', '[{"type": "income_multiplier", "value": 1.5, "description": "Financial hub bonus", "applies_to": "territory"}]', 150, 1500, true, true, NOW(), NOW()),

('downtown_plaza', 'Central Plaza', 'Prestigious business center with high-end shopping and corporate offices', 4, 3, 'downtown', 7500, 900, 9,
 '{cash,influence,information}', '[{"type": "income_multiplier", "value": 1.3, "description": "Business center bonus", "applies_to": "territory"}]', 140, 1400, true, true, NOW(), NOW()),

('downtown_gov', 'Government Quarter', 'City hall, courts, and federal buildings - center of political influence', 3, 4, 'political', 9000, 1200, 10,
 '{influence,information}', '[{"type": "special_ability", "value": 25, "description": "Reduces heat generation by 25%", "applies_to": "family"}]', 160, 1600, true, true, NOW(), NOW()),

('downtown_exchange', 'Stock Exchange', 'Financial trading center with massive daily cash flow', 4, 4, 'downtown', 8500, 1100, 9,
 '{cash,information}', '[{"type": "income_multiplier", "value": 1.4, "description": "Trading floor bonus", "applies_to": "territory"}]', 145, 1450, true, true, NOW(), NOW()),

-- Casino Row (Top edge - positions 2,0 to 5,0) - Entertainment district
('casino_golden', 'Golden Palace Casino', 'The citys most luxurious casino and entertainment complex', 2, 0, 'casino', 6000, 500, 7,
 '{cash,information}', '[{"type": "income_multiplier", "value": 1.2, "description": "High roller bonus", "applies_to": "territory"}]', 120, 1200, false, true, NOW(), NOW()),

('casino_riverside', 'Riverside Gaming', 'Waterfront casino with river views and yacht access', 3, 0, 'casino', 5500, 450, 6,
 '{cash,contraband}', '[{"type": "defense_bonus", "value": 10, "description": "Water escape routes", "applies_to": "territory"}]', 110, 1100, false, true, NOW(), NOW()),

('casino_lucky', 'Lucky Star Resort', 'Full-service casino resort with hotel and conference facilities', 4, 0, 'casino', 5800, 480, 6,
 '{cash,influence}', '[{"type": "income_multiplier", "value": 1.15, "description": "Resort amenities bonus", "applies_to": "territory"}]', 115, 1150, false, true, NOW(), NOW()),

('casino_neon', 'Neon Nights', 'Smaller casino with underground connections', 5, 0, 'casino', 4500, 350, 5,
 '{cash,contraband}', '[{"type": "special_ability", "value": 15, "description": "Underground network access", "applies_to": "territory"}]', 100, 1000, false, true, NOW(), NOW()),

-- Industrial Zone (Right edge - positions 6,0 to 7,1) - Manufacturing
('industrial_steel', 'Steel Works', 'Heavy steel production and metalworking facility', 6, 0, 'industrial', 3500, 400, 5,
 '{weapons,contraband}', '[{"type": "special_ability", "value": 20, "description": "Weapon crafting facility", "applies_to": "family"}]', 90, 900, false, true, NOW(), NOW()),

('industrial_chemical', 'Chemical Plant', 'Chemical processing and pharmaceutical manufacturing', 7, 0, 'industrial', 4000, 500, 6,
 '{contraband,weapons}', '[{"type": "income_multiplier", "value": 1.25, "description": "Chemical processing bonus", "applies_to": "territory"}]', 100, 1000, false, true, NOW(), NOW()),

('industrial_power', 'Power Station', 'Main electrical power generation facility for the city', 6, 1, 'industrial', 4500, 600, 7,
 '{influence,information}', '[{"type": "special_ability", "value": 30, "description": "City infrastructure control", "applies_to": "family"}]', 130, 1300, true, true, NOW(), NOW()),

('industrial_refinery', 'Oil Refinery', 'Petroleum processing and fuel distribution center', 7, 1, 'industrial', 3800, 450, 5,
 '{contraband,cash}', '[{"type": "income_multiplier", "value": 1.1, "description": "Fuel distribution bonus", "applies_to": "territory"}]', 95, 950, false, true, NOW(), NOW()),

-- Docks District (Left edge - positions 0,4 to 1,5) - Import/Export
('docks_main', 'Main Harbor', 'Primary shipping port with international connections', 0, 4, 'docks', 4000, 300, 6,
 '{contraband,weapons,cash}', '[{"type": "special_ability", "value": 25, "description": "International smuggling routes", "applies_to": "family"}]', 110, 1100, true, true, NOW(), NOW()),

('docks_cargo', 'Cargo Terminal', 'Heavy freight and container operations', 1, 4, 'docks', 3500, 250, 5,
 '{contraband,weapons}', '[{"type": "income_multiplier", "value": 1.1, "description": "Cargo handling efficiency", "applies_to": "territory"}]', 100, 1000, false, true, NOW(), NOW()),

('docks_fishing', 'Fishing Wharf', 'Commercial fishing operations and seafood processing', 0, 5, 'docks', 2500, 180, 3,
 '{cash,information}', '[{"type": "defense_bonus", "value": 15, "description": "Local community support", "applies_to": "territory"}]', 70, 700, false, true, NOW(), NOW()),

('docks_marina', 'Private Marina', 'Luxury boats and private yacht services', 1, 5, 'docks', 3200, 220, 4,
 '{cash,contraband}', '[{"type": "special_ability", "value": 20, "description": "Discrete transport access", "applies_to": "territory"}]', 85, 850, false, true, NOW(), NOW());

-- =====================================================================
-- Step 2: Fill Remaining Grid with Neighborhoods, Warehouses, Smuggling
-- =====================================================================

-- Row 0 (remaining positions)
INSERT INTO territories (
    name, display_name, description, map_x, map_y, territory_type,
    base_income_per_hour, maintenance_cost_per_hour, control_difficulty,
    resource_types, min_defense_points, max_control_points,
    is_strategic, is_contestable, created_at, updated_at
) VALUES
('border_west_0', 'West Side Border', 'Western city limits with truck stops and motels', 0, 0, 'neighborhood', 1800, 120, 2, '{cash,information}', 60, 600, false, true, NOW(), NOW()),
('warehouse_north_1', 'North Storage', 'Large warehouse complex near the industrial zone', 1, 0, 'warehouse', 2200, 150, 3, '{contraband,weapons}', 70, 700, false, true, NOW(), NOW()),

-- Row 1 (remaining positions)
('neighborhood_west', 'Westside Community', 'Working-class residential area with local businesses', 0, 1, 'neighborhood', 2000, 130, 3, '{cash,information}', 65, 650, false, true, NOW(), NOW()),
('warehouse_depot', 'Central Depot', 'Major distribution center connecting industrial and downtown', 1, 1, 'warehouse', 2800, 200, 4, '{contraband,cash}', 80, 800, false, true, NOW(), NOW()),
('neighborhood_central', 'Central District', 'Mixed residential and small business area', 2, 1, 'neighborhood', 2300, 150, 3, '{cash,information}', 70, 700, false, true, NOW(), NOW()),
('warehouse_east_1', 'Eastern Warehouse', 'Storage facility serving downtown core', 3, 1, 'warehouse', 2500, 180, 4, '{contraband,weapons}', 75, 750, false, true, NOW(), NOW()),
('neighborhood_midtown', 'Midtown Residential', 'Middle-class housing with shopping centers', 4, 1, 'neighborhood', 2600, 170, 4, '{cash,influence}', 85, 850, false, true, NOW(), NOW()),
('warehouse_supply', 'Supply Chain Hub', 'Logistics center near industrial zone', 5, 1, 'warehouse', 2400, 160, 3, '{contraband,cash}', 75, 750, false, true, NOW(), NOW()),

-- Row 2
('smuggling_border', 'Border Crossing', 'Remote border area perfect for smuggling operations', 0, 2, 'smuggling', 5000, 800, 8, '{contraband,weapons,cash}', 120, 1200, false, true, NOW(), NOW()),
('neighborhood_little_italy', 'Little Italy', 'Traditional Italian-American neighborhood', 1, 2, 'neighborhood', 2400, 160, 4, '{cash,information,influence}', 90, 900, false, true, NOW(), NOW()),
('warehouse_central', 'Central Warehouse', 'Key storage facility in the citys heart', 2, 2, 'warehouse', 3000, 220, 5, '{contraband,weapons}', 95, 950, false, true, NOW(), NOW()),
('warehouse_downtown_south', 'Downtown South Storage', 'Strategic warehouse serving downtown district', 3, 2, 'warehouse', 3400, 260, 5, '{contraband,cash,weapons}', 105, 1050, false, true, NOW(), NOW()),
('neighborhood_business', 'Business Quarter', 'Professional district with office buildings and services', 4, 2, 'neighborhood', 3100, 240, 5, '{cash,influence,information}', 100, 1000, false, true, NOW(), NOW()),
('neighborhood_uptown', 'Uptown Heights', 'Affluent residential area with high-end shops', 5, 2, 'neighborhood', 3200, 250, 5, '{cash,influence}', 100, 1000, false, true, NOW(), NOW()),
('warehouse_eastern', 'Eastern Storage', 'Large warehouse complex serving multiple districts', 6, 2, 'warehouse', 2600, 190, 4, '{contraband,cash}', 80, 800, false, true, NOW(), NOW()),
('smuggling_hideout', 'Hidden Valley', 'Secluded area ideal for contraband operations', 7, 2, 'smuggling', 4500, 700, 7, '{contraband,weapons}', 110, 1100, false, true, NOW(), NOW()),

-- Row 3 (excluding downtown core)
('neighborhood_oldtown', 'Old Town', 'Historic district with established businesses', 0, 3, 'neighborhood', 2600, 180, 4, '{cash,information,influence}', 85, 850, false, true, NOW(), NOW()),
('warehouse_logistics', 'Logistics Center', 'Major distribution hub connecting all districts', 1, 3, 'warehouse', 3200, 240, 5, '{contraband,cash,weapons}', 100, 1000, true, true, NOW(), NOW()),
('neighborhood_artdistrict', 'Arts District', 'Creative community with galleries and cafes', 2, 3, 'neighborhood', 2800, 200, 4, '{cash,information,influence}', 90, 900, false, true, NOW(), NOW()),
('warehouse_metro', 'Metro Storage', 'Urban warehouse serving downtown businesses', 5, 3, 'warehouse', 2900, 210, 4, '{contraband,cash}', 85, 850, false, true, NOW(), NOW()),
('neighborhood_eastside', 'Eastside Commons', 'Diverse residential area with growing businesses', 6, 3, 'neighborhood', 2500, 170, 4, '{cash,information}', 80, 800, false, true, NOW(), NOW()),
('smuggling_backroads', 'Back Roads', 'Remote area with hidden smuggling routes', 7, 3, 'smuggling', 4800, 750, 8, '{contraband,weapons,cash}', 115, 1150, false, true, NOW(), NOW()),

-- Row 4 (excluding docks area)
('warehouse_southport', 'Southport Storage', 'Warehouse complex near the harbor', 2, 4, 'warehouse', 2700, 190, 4, '{contraband,weapons}', 85, 850, false, true, NOW(), NOW()),
('neighborhood_riverside', 'Riverside District', 'Scenic residential area along the water', 5, 4, 'neighborhood', 3000, 220, 4, '{cash,influence}', 95, 950, false, true, NOW(), NOW()),
('smuggling_industrial', 'Industrial Smuggling', 'Hidden operations within industrial complex', 6, 4, 'smuggling', 5200, 850, 9, '{contraband,weapons,cash}', 125, 1250, false, true, NOW(), NOW()),
('warehouse_border', 'Border Warehouse', 'Storage facility near city limits', 7, 4, 'warehouse', 2400, 170, 3, '{contraband,cash}', 75, 750, false, true, NOW(), NOW()),

-- Row 5 (excluding docks area)
('neighborhood_southtown', 'South Town', 'Traditional working-class neighborhood', 2, 5, 'neighborhood', 2200, 140, 3, '{cash,information}', 70, 700, false, true, NOW(), NOW()),
('warehouse_distribution', 'Distribution Hub', 'Major shipping and receiving facility', 3, 5, 'warehouse', 2800, 200, 4, '{contraband,weapons}', 85, 850, false, true, NOW(), NOW()),
('neighborhood_milltown', 'Mill Town', 'Former industrial town now residential area', 4, 5, 'neighborhood', 2100, 130, 3, '{cash,information}', 65, 650, false, true, NOW(), NOW()),
('warehouse_southern', 'Southern Storage', 'Large warehouse complex in southern district', 5, 5, 'warehouse', 2600, 180, 4, '{contraband,cash}', 80, 800, false, true, NOW(), NOW()),
('smuggling_southern', 'Southern Routes', 'Smuggling operation with southern connections', 6, 5, 'smuggling', 4600, 720, 7, '{contraband,weapons}', 110, 1100, false, true, NOW(), NOW()),
('neighborhood_suburbs', 'Southern Suburbs', 'Quiet suburban community on city outskirts', 7, 5, 'neighborhood', 1900, 120, 2, '{cash}', 60, 600, false, true, NOW(), NOW()),

-- Row 6
('smuggling_desert', 'Desert Routes', 'Remote desert smuggling operation', 0, 6, 'smuggling', 5500, 900, 9, '{contraband,weapons,cash}', 130, 1300, true, true, NOW(), NOW()),
('neighborhood_veterans', 'Veterans Quarter', 'Military veteran community with strong bonds', 1, 6, 'neighborhood', 2300, 150, 4, '{cash,information,weapons}', 95, 950, false, true, NOW(), NOW()),
('warehouse_regional', 'Regional Center', 'Major regional distribution facility', 2, 6, 'warehouse', 3000, 220, 5, '{contraband,cash,weapons}', 100, 1000, false, true, NOW(), NOW()),
('neighborhood_garden', 'Garden District', 'Upscale residential area with manicured grounds', 3, 6, 'neighborhood', 3500, 280, 5, '{cash,influence}', 110, 1100, false, true, NOW(), NOW()),
('warehouse_junction', 'Junction Point', 'Strategic warehouse at transportation crossroads', 4, 6, 'warehouse', 3200, 240, 5, '{contraband,cash}', 105, 1050, true, true, NOW(), NOW()),
('neighborhood_hillside', 'Hillside Estates', 'Affluent hillside residential community', 5, 6, 'neighborhood', 3300, 260, 5, '{cash,influence}', 105, 1050, false, true, NOW(), NOW()),
('warehouse_highland', 'Highland Storage', 'Elevated warehouse with strategic views', 6, 6, 'warehouse', 2800, 200, 4, '{contraband,weapons}', 90, 900, false, true, NOW(), NOW()),
('smuggling_mountain', 'Mountain Pass', 'Mountain smuggling route with hidden caves', 7, 6, 'smuggling', 5800, 950, 10, '{contraband,weapons,cash}', 140, 1400, true, true, NOW(), NOW()),

-- Row 7 (Bottom edge)
('political_courthouse', 'Courthouse District', 'Legal center with courts and law offices', 0, 7, 'political', 6500, 800, 8, '{influence,information}', 130, 1300, true, true, NOW(), NOW()),
('neighborhood_courthouse', 'Courthouse Square', 'Historic neighborhood around the courthouse', 1, 7, 'neighborhood', 2800, 190, 4, '{cash,information,influence}', 95, 950, false, true, NOW(), NOW()),
('warehouse_courthouse', 'Evidence Storage', 'Secure storage facility near courthouse', 2, 7, 'warehouse', 3500, 300, 6, '{information,contraband}', 120, 1200, false, true, NOW(), NOW()),
('political_civic', 'Civic Center', 'Municipal buildings and public services', 3, 7, 'political', 7000, 850, 8, '{influence,information}', 135, 1350, true, true, NOW(), NOW()),
('neighborhood_civic', 'Civic Heights', 'Residential area popular with city employees', 4, 7, 'neighborhood', 2900, 200, 4, '{cash,influence,information}', 90, 900, false, true, NOW(), NOW()),
('warehouse_municipal', 'Municipal Storage', 'City-owned storage and maintenance facility', 5, 7, 'warehouse', 2500, 170, 4, '{information,cash}', 85, 850, false, true, NOW(), NOW()),
('political_federal', 'Federal Building', 'Federal offices and agencies', 6, 7, 'political', 7500, 900, 9, '{influence,information}', 140, 1400, true, true, NOW(), NOW()),
('smuggling_underground', 'Underground Network', 'Hidden underground smuggling operation', 7, 7, 'smuggling', 6000, 1000, 10, '{contraband,weapons,cash,information}', 145, 1450, true, true, NOW(), NOW());

-- =====================================================================
-- Step 3: Calculate and Set Adjacency Relationships
-- =====================================================================

-- Update territories with their adjacent territories (8-directional adjacency)
-- This is complex, so we'll do it systematically for each territory

-- Helper function to calculate adjacent territories would be ideal, but we'll do it manually
-- For each territory, adjacent territories are those within 1 square (including diagonally)

-- Update adjacencies for downtown core first
UPDATE territories SET adjacent_territories = (
    SELECT ARRAY(
        SELECT id FROM territories t2
        WHERE t2.id != territories.id
        AND ABS(t2.map_x - territories.map_x) <= 1
        AND ABS(t2.map_y - territories.map_y) <= 1
    )
) WHERE territory_type IN ('downtown', 'political') AND map_x BETWEEN 3 AND 4 AND map_y BETWEEN 3 AND 4;

-- Update adjacencies for all other territories
UPDATE territories SET adjacent_territories = (
    SELECT ARRAY(
        SELECT id FROM territories t2
        WHERE t2.id != territories.id
        AND ABS(t2.map_x - territories.map_x) <= 1
        AND ABS(t2.map_y - territories.map_y) <= 1
    )
) WHERE adjacent_territories IS NULL OR array_length(adjacent_territories, 1) IS NULL;

-- =====================================================================
-- Step 4: Add Special Territory Bonuses Based on Type and Location
-- =====================================================================

-- Update special bonuses for strategic territories that don't already have them
UPDATE territories SET special_bonuses = '[
    {"type": "defense_bonus", "value": 20, "description": "Strategic position bonus", "applies_to": "territory"}
]'::jsonb
WHERE is_strategic = true AND (special_bonuses IS NULL OR special_bonuses = '[]'::jsonb);

-- Add synergy bonuses for adjacent territories of the same type
UPDATE territories SET special_bonuses = special_bonuses || '[
    {"type": "income_multiplier", "value": 1.1, "description": "District synergy bonus", "applies_to": "adjacent_territories"}
]'::jsonb
WHERE territory_type IN ('casino', 'industrial', 'docks');

-- Add resource flow bonuses for warehouse territories
UPDATE territories SET special_bonuses = COALESCE(special_bonuses, '[]'::jsonb) || '[
    {"type": "special_ability", "value": 10, "description": "Supply chain efficiency bonus", "applies_to": "family"}
]'::jsonb
WHERE territory_type = 'warehouse';

-- Add contraband bonuses for smuggling territories
UPDATE territories SET special_bonuses = COALESCE(special_bonuses, '[]'::jsonb) || '[
    {"type": "income_multiplier", "value": 1.5, "description": "High-risk high-reward operations", "applies_to": "territory"}
]'::jsonb
WHERE territory_type = 'smuggling' AND NOT (special_bonuses @> '[{"type": "income_multiplier"}]');

-- =====================================================================
-- Step 5: Validation and Statistics
-- =====================================================================

-- Display territory creation results
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TERRITORY SYSTEM CREATION COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total territories created: %', (SELECT COUNT(*) FROM territories);
    RAISE NOTICE 'Territory type breakdown:';
    RAISE NOTICE '  Downtown: %', (SELECT COUNT(*) FROM territories WHERE territory_type = 'downtown');
    RAISE NOTICE '  Political: %', (SELECT COUNT(*) FROM territories WHERE territory_type = 'political');
    RAISE NOTICE '  Casino: %', (SELECT COUNT(*) FROM territories WHERE territory_type = 'casino');
    RAISE NOTICE '  Industrial: %', (SELECT COUNT(*) FROM territories WHERE territory_type = 'industrial');
    RAISE NOTICE '  Docks: %', (SELECT COUNT(*) FROM territories WHERE territory_type = 'docks');
    RAISE NOTICE '  Neighborhood: %', (SELECT COUNT(*) FROM territories WHERE territory_type = 'neighborhood');
    RAISE NOTICE '  Warehouse: %', (SELECT COUNT(*) FROM territories WHERE territory_type = 'warehouse');
    RAISE NOTICE '  Smuggling: %', (SELECT COUNT(*) FROM territories WHERE territory_type = 'smuggling');
    RAISE NOTICE 'Strategic territories: %', (SELECT COUNT(*) FROM territories WHERE is_strategic = true);
    RAISE NOTICE 'Average income per hour: $%', (SELECT ROUND(AVG(base_income_per_hour)) FROM territories);
    RAISE NOTICE 'Total potential hourly income: $%', (SELECT SUM(base_income_per_hour) FROM territories);
    RAISE NOTICE '==========================================';
END $$;

COMMIT;

-- =====================================================================
-- Verification Queries (run separately to check the results)
-- =====================================================================

/*
-- Check territory distribution by type and position
SELECT
    territory_type,
    COUNT(*) as count,
    ROUND(AVG(base_income_per_hour)) as avg_income,
    ROUND(AVG(control_difficulty)) as avg_difficulty
FROM territories
GROUP BY territory_type
ORDER BY avg_income DESC;

-- Verify 8x8 grid coverage
SELECT
    map_y,
    COUNT(*) as territories_in_row,
    string_agg(territory_type, ', ' ORDER BY map_x) as types_by_position
FROM territories
GROUP BY map_y
ORDER BY map_y;

-- Check strategic territories
SELECT name, display_name, territory_type, base_income_per_hour, is_strategic
FROM territories
WHERE is_strategic = true
ORDER BY base_income_per_hour DESC;

-- Verify adjacency relationships are populated
SELECT name, array_length(adjacent_territories, 1) as adjacent_count
FROM territories
ORDER BY adjacent_count DESC LIMIT 10;

-- Check special bonuses distribution
SELECT
    territory_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE special_bonuses != '[]'::jsonb) as with_bonuses
FROM territories
GROUP BY territory_type;
*/
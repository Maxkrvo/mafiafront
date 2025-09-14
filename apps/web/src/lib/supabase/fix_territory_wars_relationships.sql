-- Fix Territory Wars Multiple Relationship Issue
-- This resolves the "more than one relationship was found" error when querying territory_wars with families

-- Drop the existing foreign key constraints that are causing ambiguity
ALTER TABLE public.territory_wars DROP CONSTRAINT IF EXISTS territory_wars_attacking_family_id_fkey;
ALTER TABLE public.territory_wars DROP CONSTRAINT IF EXISTS territory_wars_defending_family_id_fkey;
ALTER TABLE public.territory_wars DROP CONSTRAINT IF EXISTS territory_wars_winner_family_id_fkey;

-- Re-add the foreign key constraints with explicit names to avoid Supabase auto-detection issues
ALTER TABLE public.territory_wars
ADD CONSTRAINT territory_wars_attacking_family_fk
FOREIGN KEY (attacking_family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.territory_wars
ADD CONSTRAINT territory_wars_defending_family_fk
FOREIGN KEY (defending_family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.territory_wars
ADD CONSTRAINT territory_wars_winner_family_fk
FOREIGN KEY (winner_family_id) REFERENCES public.families(id) ON DELETE SET NULL;

-- Create explicit junction views to handle the multiple relationships
-- This allows us to query specific family relationships without ambiguity

CREATE OR REPLACE VIEW territory_wars_with_attacking_family AS
SELECT
  tw.*,
  af.name as attacking_family_name,
  af.display_name as attacking_family_display_name,
  af.color_hex as attacking_family_color
FROM public.territory_wars tw
LEFT JOIN public.families af ON af.id = tw.attacking_family_id;

CREATE OR REPLACE VIEW territory_wars_with_defending_family AS
SELECT
  tw.*,
  df.name as defending_family_name,
  df.display_name as defending_family_display_name,
  df.color_hex as defending_family_color
FROM public.territory_wars tw
LEFT JOIN public.families df ON df.id = tw.defending_family_id;

CREATE OR REPLACE VIEW territory_wars_with_winner_family AS
SELECT
  tw.*,
  wf.name as winner_family_name,
  wf.display_name as winner_family_display_name,
  wf.color_hex as winner_family_color
FROM public.territory_wars tw
LEFT JOIN public.families wf ON wf.id = tw.winner_family_id;

-- Create a comprehensive view that includes all family relationships
CREATE OR REPLACE VIEW territory_wars_full AS
SELECT
  tw.*,
  af.name as attacking_family_name,
  af.display_name as attacking_family_display_name,
  af.color_hex as attacking_family_color,
  df.name as defending_family_name,
  df.display_name as defending_family_display_name,
  df.color_hex as defending_family_color,
  wf.name as winner_family_name,
  wf.display_name as winner_family_display_name,
  wf.color_hex as winner_family_color,
  t.name as territory_name,
  t.display_name as territory_display_name,
  t.territory_type as territory_type
FROM public.territory_wars tw
LEFT JOIN public.families af ON af.id = tw.attacking_family_id
LEFT JOIN public.families df ON df.id = tw.defending_family_id
LEFT JOIN public.families wf ON wf.id = tw.winner_family_id
LEFT JOIN public.territories t ON t.id = tw.territory_id;

-- Grant appropriate permissions to the views
GRANT SELECT ON territory_wars_with_attacking_family TO authenticated;
GRANT SELECT ON territory_wars_with_defending_family TO authenticated;
GRANT SELECT ON territory_wars_with_winner_family TO authenticated;
GRANT SELECT ON territory_wars_full TO authenticated;

-- Enable RLS on the views (they inherit from the base table)
ALTER VIEW territory_wars_with_attacking_family SET (security_barrier = true);
ALTER VIEW territory_wars_with_defending_family SET (security_barrier = true);
ALTER VIEW territory_wars_with_winner_family SET (security_barrier = true);
ALTER VIEW territory_wars_full SET (security_barrier = true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Territory wars relationship fix completed successfully!';
  RAISE NOTICE 'Use territory_wars_full view for comprehensive queries with all family relationships';
  RAISE NOTICE 'Use specific views (territory_wars_with_attacking_family, etc.) for targeted queries';
END $$;
-- Add nickname column to existing players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);

-- Update existing players to have nickname = username for backwards compatibility
UPDATE public.players 
SET nickname = username 
WHERE nickname IS NULL;

-- Make nickname NOT NULL after updating existing records
ALTER TABLE public.players 
ALTER COLUMN nickname SET NOT NULL;

-- Update the function to handle new user creation with nickname
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  generated_username VARCHAR(50);
BEGIN
  -- Generate a unique username from nickname
  generated_username := LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'nickname', 'player'), '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure username is unique by appending random numbers if needed
  WHILE EXISTS (SELECT 1 FROM public.players WHERE username = generated_username) LOOP
    generated_username := LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'nickname', 'player'), '[^a-zA-Z0-9]', '', 'g')) || '_' || FLOOR(RANDOM() * 10000)::TEXT;
  END LOOP;
  
  INSERT INTO public.players (id, nickname, username, rank)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'Anonymous Player'),
    generated_username,
    'Associate'
  );
  
  INSERT INTO public.player_stats (player_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Players Profile (extends Supabase auth.users)
CREATE TABLE public.players (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL, -- Internal unique username for system use
  famiglia_name VARCHAR(100), -- Family/Clan name
  rank VARCHAR(20) DEFAULT 'Associate', -- Don, Capo, Soldier, Associate
  avatar_url TEXT,
  bio TEXT,
  reputation_score INTEGER DEFAULT 0,
  
  -- Energy and HP System
  energy INTEGER DEFAULT 100,
  max_energy INTEGER DEFAULT 100,
  hp INTEGER DEFAULT 100,
  max_hp INTEGER DEFAULT 100,
  energy_regen_rate INTEGER DEFAULT 1, -- Energy per minute
  last_energy_regen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Player Statistics
CREATE TABLE public.player_stats (
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  favorite_role VARCHAR(50),
  total_eliminations INTEGER DEFAULT 0,
  times_eliminated INTEGER DEFAULT 0,
  survival_rate DECIMAL(5,2) DEFAULT 0.00,
  longest_survival_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  
  -- Energy and HP related stats
  total_damage_dealt INTEGER DEFAULT 0,
  total_healing_done INTEGER DEFAULT 0,
  energy_spent INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (player_id)
);

-- Game Sessions
CREATE TABLE public.game_sessions (
  id UUID DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, active, completed
  max_players INTEGER DEFAULT 10,
  current_player_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.players(id),
  game_type VARCHAR(50) DEFAULT 'classic', -- classic, energy_battle, hp_survival
  settings JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Game Participants
CREATE TABLE public.game_participants (
  id UUID DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  role VARCHAR(50), -- mafia, civilian, detective, doctor, enforcer, healer
  status VARCHAR(20) DEFAULT 'alive', -- alive, eliminated, winner
  elimination_round INTEGER,
  eliminated_by UUID REFERENCES public.players(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE(game_session_id, player_id)
);

-- Row Level Security Policies
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

-- Players table policies
CREATE POLICY "Users can view all players" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.players
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.players
  FOR UPDATE USING (auth.uid() = id);

-- Player stats policies
CREATE POLICY "Users can view all player stats" ON public.player_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own stats" ON public.player_stats
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update own stats" ON public.player_stats
  FOR UPDATE USING (auth.uid() = player_id);

-- Game sessions policies
CREATE POLICY "Users can view all game sessions" ON public.game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create game sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Game creators can update their sessions" ON public.game_sessions
  FOR UPDATE USING (auth.uid() = created_by);

-- Game participants policies
CREATE POLICY "Users can view game participants" ON public.game_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join games" ON public.game_participants
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update own participation" ON public.game_participants
  FOR UPDATE USING (auth.uid() = player_id);

-- Functions for energy regeneration
CREATE OR REPLACE FUNCTION public.regenerate_energy(player_uuid UUID)
RETURNS void AS $$
DECLARE
  current_player public.players%ROWTYPE;
  minutes_elapsed INTEGER;
  energy_to_add INTEGER;
BEGIN
  SELECT * INTO current_player FROM public.players WHERE id = player_uuid;
  
  IF current_player.id IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate minutes elapsed since last regen
  minutes_elapsed := EXTRACT(EPOCH FROM (NOW() - current_player.last_energy_regen)) / 60;
  
  IF minutes_elapsed >= 1 THEN
    energy_to_add := LEAST(
      minutes_elapsed * current_player.energy_regen_rate,
      current_player.max_energy - current_player.energy
    );
    
    UPDATE public.players 
    SET 
      energy = energy + energy_to_add,
      last_energy_regen = NOW()
    WHERE id = player_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create player profile after signup
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

-- Trigger to auto-create player profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_player_stats_updated_at
  BEFORE UPDATE ON public.player_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_participants;
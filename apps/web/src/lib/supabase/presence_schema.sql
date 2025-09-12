-- Online Presence tracking table
CREATE TABLE public.user_presence (
  user_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  current_page VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Allow users to read all presence data (for seeing who's online)
CREATE POLICY "Users can view all presence" ON public.user_presence
  FOR SELECT USING (true);

-- Allow users to insert/update their own presence
CREATE POLICY "Users can manage own presence" ON public.user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence" ON public.user_presence
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence(
  current_page_param VARCHAR(100) DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, last_seen, is_online, current_page)
  VALUES (
    auth.uid(), 
    NOW(), 
    true,
    current_page_param
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_seen = NOW(),
    is_online = true,
    current_page = COALESCE(current_page_param, user_presence.current_page);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark user as offline
CREATE OR REPLACE FUNCTION public.mark_user_offline()
RETURNS void AS $$
BEGIN
  UPDATE public.user_presence 
  SET is_online = false, last_seen = NOW()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get online users count
CREATE OR REPLACE FUNCTION public.get_online_users_count()
RETURNS INTEGER AS $$
BEGIN
  -- Consider users online if they were active in the last 5 minutes
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.user_presence up
    JOIN public.players p ON up.user_id = p.id
    WHERE up.is_online = true 
    AND up.last_seen > NOW() - INTERVAL '5 minutes'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for getting online users with player info
CREATE OR REPLACE VIEW public.online_users AS
SELECT 
  p.id,
  p.nickname,
  p.username,
  p.rank,
  p.reputation_score,
  p.avatar_url,
  p.hp,
  p.max_hp,
  p.energy,
  p.max_energy,
  up.last_seen,
  up.current_page,
  up.is_online
FROM public.user_presence up
JOIN public.players p ON up.user_id = p.id
WHERE up.is_online = true 
AND up.last_seen > NOW() - INTERVAL '5 minutes'
ORDER BY up.last_seen DESC;

-- Enable realtime for presence updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_online_last_seen 
ON public.user_presence (is_online, last_seen) 
WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_user_presence_user_id 
ON public.user_presence (user_id);
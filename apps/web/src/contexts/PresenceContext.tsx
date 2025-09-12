'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

export interface OnlineUser {
  id: string;
  nickname: string;
  username: string;
  rank: string;
  reputation_score: number;
  avatar_url: string | null;
  hp: number;
  max_hp: number;
  energy: number;
  max_energy: number;
  last_seen: string;
  current_page: string | null;
  is_online: boolean;
}

interface PresenceContextType {
  onlineUsers: OnlineUser[];
  onlineCount: number;
  loading: boolean;
  updatePresence: (page?: string) => Promise<void>;
  markOffline: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}

interface PresenceProviderProps {
  children: React.ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Define callback functions first, before useEffect hooks that reference them
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('online_users')
        .select('*');

      if (error) {
        console.error('Error fetching online users:', error);
        return;
      }

      setOnlineUsers(data || []);
      setOnlineCount(data?.length || 0);
    } catch (error) {
      console.error('Unexpected error fetching online users:', error);
    }
  }, []);

  const updatePresence = useCallback(async (page?: string) => {
    if (!user) return;

    try {
      await supabase.rpc('update_user_presence', {
        current_page_param: page || pathname
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user, pathname]);

  const markOffline = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.rpc('mark_user_offline');
    } catch (error) {
      console.error('Error marking offline:', error);
    }
  }, [user]);

  // Update presence when page changes
  useEffect(() => {
    if (user) {
      updatePresence(pathname);
    }
  }, [pathname, user, updatePresence]);

  // Set up presence tracking and real-time updates
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let presenceInterval: NodeJS.Timeout;
    let channel: ReturnType<typeof supabase.channel> | null;

    const setupPresence = async () => {
      try {
        // Initial presence update
        await updatePresence(pathname);
        
        // Fetch initial online users
        await fetchOnlineUsers();
        
        // Set up periodic presence updates (every 30 seconds)
        presenceInterval = setInterval(() => {
          updatePresence();
        }, 30000);

        // Set up real-time subscription for presence changes
        channel = supabase
          .channel('online-users')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_presence',
            },
            () => {
              // Refetch online users when presence changes
              fetchOnlineUsers();
            }
          )
          .subscribe();

        setLoading(false);
      } catch (error) {
        console.error('Error setting up presence:', error);
        setLoading(false);
      }
    };

    setupPresence();

    // Cleanup function
    return () => {
      if (presenceInterval) {
        clearInterval(presenceInterval);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
      // Mark user as offline when component unmounts or user logs out
      if (user) {
        markOffline();
      }
    };
  }, [user, pathname, updatePresence, fetchOnlineUsers, markOffline]);

  // Handle page visibility change (mark offline when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        markOffline();
      } else if (user) {
        updatePresence(pathname);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, pathname, updatePresence, markOffline]);

  const value: PresenceContextType = {
    onlineUsers,
    onlineCount,
    loading,
    updatePresence,
    markOffline,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}
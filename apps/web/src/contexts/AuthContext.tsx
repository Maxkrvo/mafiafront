"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { authenticatedSupabase } from "@/lib/supabase/authenticated-client";
import { authRequestHandler } from "@/lib/supabase/auth-request-handler";
import { Player } from "@/lib/supabase/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  player: Player | null;
  loading: boolean;
  authRequestsLoading: boolean;
  signUp: (
    email: string,
    password: string,
    nickname: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<Player>) => Promise<{ error: Error | null }>;
  regenerateEnergy: () => Promise<void>;
  supabase: typeof authenticatedSupabase;
  executeQuery: <T>(
    operation: () => Promise<{ data: T; error: any }>
  ) => Promise<{ data: T; error: any }>;
  executeRpc: <T>(fn: string, args?: any) => Promise<{ data: T; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequestsLoading, setAuthRequestsLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlayerProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchPlayerProfile(session.user.id);
      } else {
        setPlayer(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPlayerProfile = async (userId: string) => {
    try {
      const { data, error } = await authenticatedSupabase
        .from("players")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching player profile:", error);
        return;
      }

      setPlayer(data);
    } catch (error) {
      console.error("Unexpected error fetching player profile:", error);
    }
  };

  async function executeQuery<T>(
    operation: () => Promise<{ data: T; error: any }>
  ): Promise<{ data: T; error: any }> {
    return authRequestHandler.executeQuery(operation);
  }

  async function executeRpc<T>(
    fn: string,
    args?: any
  ): Promise<{ data: T; error: any }> {
    return authRequestHandler.executeRpc<T>(fn, args);
  }

  const signUp = async (email: string, password: string, nickname: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname,
          },
        },
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setSession(null);
        setPlayer(null);
      }
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<Player>) => {
    if (!user || !player) {
      return { error: new Error("No user logged in") };
    }

    try {
      const { error } = await authenticatedSupabase
        .from("players")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        return { error };
      }

      // Update local state
      setPlayer({ ...player, ...updates });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const regenerateEnergy = useCallback(async () => {
    if (!user) return;

    try {
      await authenticatedSupabase.rpc("regenerate_energy", {
        player_uuid: user.id,
      });

      // Refresh player data to get updated energy
      await fetchPlayerProfile(user.id);
    } catch (error) {
      console.error("Error regenerating energy:", error);
    }
  }, [user]);

  // Auto-regenerate energy every minute
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      regenerateEnergy();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [user, regenerateEnergy]);

  // Track loading state from auth requests
  useEffect(() => {
    const interval = setInterval(() => {
      setAuthRequestsLoading(authRequestHandler.isLoading());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    player,
    loading,
    authRequestsLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    regenerateEnergy,
    supabase: authenticatedSupabase,
    executeQuery,
    executeRpc,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

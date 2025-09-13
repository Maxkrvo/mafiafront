'use client';

import { useCallback } from 'react';
import { authenticatedSupabase } from '@/lib/supabase/authenticated-client';
import { authRequestHandler } from '@/lib/supabase/auth-request-handler';

export function useAuthenticatedSupabase() {
  const executeQuery = useCallback(async <T>(
    operation: () => Promise<{ data: T; error: any }>
  ) => {
    return authRequestHandler.executeQuery(operation);
  }, []);

  const rpc = useCallback(async <T>(fn: string, args?: any) => {
    return authRequestHandler.executeRpc<T>(fn, args);
  }, []);

  return {
    client: authenticatedSupabase,
    rpc,
    executeQuery,
    isLoading: authRequestHandler.isLoading.bind(authRequestHandler),
    auth: authenticatedSupabase.auth,
    storage: authenticatedSupabase.storage,
    realtime: authenticatedSupabase.realtime,
    channel: authenticatedSupabase.channel.bind(authenticatedSupabase),
    removeChannel: authenticatedSupabase.removeChannel.bind(authenticatedSupabase),
    getChannels: authenticatedSupabase.getChannels.bind(authenticatedSupabase)
  };
}
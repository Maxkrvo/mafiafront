import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000,        // 5 minutes
    gcTime: 10 * 60 * 1000,          // 10 minutes (was cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Don't retry auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
        return false;
      }

      // Don't retry 4xx errors except 429 (rate limit)
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    retry: false,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Helper function to get query client instance
export const getQueryClient = () => queryClient;

// Query client error handler
queryClient.setDefaultOptions({
  ...queryConfig,
  queries: {
    ...queryConfig.queries,
    onError: (error: any) => {
      console.error('Query error:', error);

      // Handle auth errors globally
      if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
        // Could dispatch auth logout here if needed
        console.warn('Authentication error detected in query');
      }
    },
  },
  mutations: {
    ...queryConfig.mutations,
    onError: (error: any) => {
      console.error('Mutation error:', error);
    },
  },
});
'use client';

import { authenticatedSupabase } from './authenticated-client';

export interface AuthRequestOptions {
  retries?: number;
  showErrorToast?: boolean;
}

export class AuthRequestHandler {
  private static instance: AuthRequestHandler;
  private loadingRequests = new Set<string>();

  static getInstance(): AuthRequestHandler {
    if (!AuthRequestHandler.instance) {
      AuthRequestHandler.instance = new AuthRequestHandler();
    }
    return AuthRequestHandler.instance;
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(7);
  }

  async executeQuery<T>(
    operation: () => Promise<{ data: T; error: any }>,
    options: AuthRequestOptions = {}
  ): Promise<{ data: T; error: any }> {
    const requestId = this.generateRequestId();
    this.loadingRequests.add(requestId);

    try {
      const result = await operation();

      if (result.error && options.showErrorToast !== false) {
        console.error('Query error:', result.error);
      }

      return result;
    } catch (error: any) {
      console.error('Request failed:', error);
      return {
        data: null as T,
        error: {
          message: error.message || 'Request failed',
          code: error.code || 'UNKNOWN_ERROR'
        }
      };
    } finally {
      this.loadingRequests.delete(requestId);
    }
  }

  async executeRpc<T>(
    fn: string,
    args?: any,
    options: AuthRequestOptions = {}
  ): Promise<{ data: T; error: any }> {
    const requestId = this.generateRequestId();
    this.loadingRequests.add(requestId);

    try {
      const result = await authenticatedSupabase.rpc(fn, args);

      if (result && typeof result === 'object' && 'data' in result && 'error' in result) {
        const { data, error } = result as { data: T; error: any };

        if (error && options.showErrorToast !== false) {
          console.error(`RPC ${fn} error:`, error);
        }

        return { data, error };
      } else {
        return { data: result as T, error: null };
      }
    } catch (error: any) {
      console.error(`RPC ${fn} failed:`, error);
      return {
        data: null as T,
        error: {
          message: error.message || `RPC ${fn} failed`,
          code: error.code || 'RPC_ERROR'
        }
      };
    } finally {
      this.loadingRequests.delete(requestId);
    }
  }

  isLoading(): boolean {
    return this.loadingRequests.size > 0;
  }

  getLoadingCount(): number {
    return this.loadingRequests.size;
  }
}

export const authRequestHandler = AuthRequestHandler.getInstance();
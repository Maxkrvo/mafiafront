'use client';

import { supabase } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

interface RequestOperation {
  operation: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class AuthenticatedSupabaseClient {
  private client: SupabaseClient<Database>;
  private isRefreshing = false;
  private requestQueue: RequestOperation[] = [];

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private async executeWithAuth<T>(
    operation: () => Promise<T>,
    maxRetries = 1
  ): Promise<T> {
    if (this.isRefreshing) {
      return this.queueRequest(operation);
    }

    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      if (this.isAuthError(error) && maxRetries > 0) {
        console.log('Authentication error detected, attempting refresh...');
        return this.handleAuthError(operation, maxRetries - 1);
      }
      throw error;
    }
  }

  private async queueRequest<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({
        operation,
        resolve,
        reject,
      });
    });
  }

  private async handleAuthError<T>(
    operation: () => Promise<T>,
    retriesLeft: number
  ): Promise<T> {
    if (this.isRefreshing) {
      return this.queueRequest(operation);
    }

    this.isRefreshing = true;

    try {
      console.log('Attempting to refresh authentication...');

      const { data, error } = await this.client.auth.refreshSession();

      if (error) {
        console.error('Token refresh failed:', error);
        this.processQueue(new Error('Authentication refresh failed'));
        throw new Error('Authentication refresh failed');
      }

      if (!data.session) {
        console.error('No session after refresh');
        this.processQueue(new Error('No session available'));
        throw new Error('No session available');
      }

      console.log('Token refresh successful');

      this.isRefreshing = false;

      this.processQueue();

      if (retriesLeft > 0) {
        return await this.executeWithAuth(operation, retriesLeft);
      } else {
        throw new Error('Maximum retry attempts exceeded');
      }
    } catch (refreshError) {
      this.isRefreshing = false;
      this.processQueue(refreshError);
      throw refreshError;
    }
  }

  private processQueue(error?: any) {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    queue.forEach(({ operation, resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        this.executeWithAuth(operation, 0)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  private isAuthError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code;
    const status = error.status;

    const authErrorIndicators = [
      'jwt expired',
      'invalid jwt',
      'token expired',
      'unauthorized',
      'authentication required',
      'session expired',
      'invalid token',
      'access token expired'
    ];

    return (
      status === 401 ||
      errorCode === 'PGRST301' ||
      errorCode === 'PGRST302' ||
      authErrorIndicators.some(indicator => errorMessage.includes(indicator))
    );
  }

  from(table: string) {
    return this.client.from(table);
  }

  async rpc(fn: string, args?: any): Promise<any> {
    return this.executeWithAuth(async () => {
      const result = await this.client.rpc(fn, args);
      return result;
    });
  }

  get auth() {
    return this.client.auth;
  }

  get storage() {
    return this.client.storage;
  }

  get realtime() {
    return this.client.realtime;
  }

  channel(name: string, options?: any) {
    return this.client.channel(name, options);
  }

  removeChannel(channel: any) {
    return this.client.removeChannel(channel);
  }

  getChannels() {
    return this.client.getChannels();
  }
}

export const authenticatedSupabase = new AuthenticatedSupabaseClient(supabase);
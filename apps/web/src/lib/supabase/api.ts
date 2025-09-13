/**
 * Supabase REST API utility functions
 * Direct HTTP calls to Supabase without the client library
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const DEFAULT_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

interface SupabaseResponse<T = any> {
  data: T;
  error: Error | null;
}

/**
 * Make a GET request to a Supabase table
 */
export async function supabaseGet<T = any>(
  table: string, 
  params?: {
    select?: string;
    filter?: string;
    single?: boolean;
    accessToken?: string;
  }
): Promise<SupabaseResponse<T>> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const queryParams = [];
    
    if (params?.select) {
      queryParams.push(`select=${params.select}`);
    }
    
    if (params?.filter) {
      queryParams.push(params.filter);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    const headers = { ...DEFAULT_HEADERS };
    
    // Use access token if provided for authenticated requests
    if (params?.accessToken) {
      headers['Authorization'] = `Bearer ${params.accessToken}`;
    }

    const response = await fetch(url, {
      headers
    });

    // If 401 and we have an access token, try refreshing and retrying once
    if (response.status === 401 && params?.accessToken) {
      console.log('🔄 GET: Token expired, attempting refresh...');
      const refreshedToken = await refreshSessionIfNeeded();
      
      if (refreshedToken && refreshedToken !== params.accessToken) {
        console.log('✅ GET: Token refreshed, retrying request...');
        headers['Authorization'] = `Bearer ${refreshedToken}`;
        
        const retryResponse = await fetch(url, {
          headers
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          return {
            data: params?.single ? retryData[0] || null : retryData,
            error: null
          };
        }
      }
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return single item if requested, otherwise return array
    return {
      data: params?.single ? data[0] || null : data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error as Error
    };
  }
}

/**
 * Make a POST request to insert data
 */
/**
 * Refresh session token if expired
 */
async function refreshSessionIfNeeded() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session }, error } = await client.auth.refreshSession();
    
    if (error) {
      console.warn('Failed to refresh session:', error);
      return null;
    }
    
    return session?.access_token;
  } catch (error) {
    console.warn('Error refreshing session:', error);
    return null;
  }
}

export async function supabasePost<T = any>(
  table: string, 
  body: Record<string, any>,
  params?: {
    select?: string;
    accessToken?: string;
  }
): Promise<SupabaseResponse<T>> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const headers = { ...DEFAULT_HEADERS };
    
    // Use access token if provided for authenticated requests
    let accessToken = params?.accessToken;
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    if (params?.select) {
      headers['Prefer'] = 'return=representation';
      url += `?select=${params.select}`;
    }

    console.log('🌐 POST Request:', {
      url,
      headers: {
        ...headers,
        Authorization: headers.Authorization?.substring(0, 30) + "..." // Truncate for security
      },
      body
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    console.log('🌐 POST Response:', response.status, response.statusText);

    // If 401 and we have an access token, try refreshing and retrying once
    if (response.status === 401 && accessToken) {
      console.log('🔄 Token expired, attempting refresh...');
      const refreshedToken = await refreshSessionIfNeeded();
      
      if (refreshedToken && refreshedToken !== accessToken) {
        console.log('✅ Token refreshed, retrying request...');
        headers['Authorization'] = `Bearer ${refreshedToken}`;
        
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
        
        if (retryResponse.ok) {
          const retryData = retryResponse.status === 201 ? await retryResponse.json() : null;
          return {
            data: params?.select ? (retryData?.[0] || retryData) : retryData,
            error: null
          };
        }
      }
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = response.status === 201 ? await response.json() : null;
    
    return {
      data: params?.select ? (data?.[0] || data) : data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error as Error
    };
  }
}

/**
 * Make a PATCH request to update data
 */
export async function supabasePatch<T = any>(
  table: string,
  body: Record<string, any>,
  filter: string,
  params?: {
    select?: string;
  }
): Promise<SupabaseResponse<T>> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
    const headers = { ...DEFAULT_HEADERS };
    
    if (params?.select) {
      headers['Prefer'] = 'return=representation';
      url += `&select=${params.select}`;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = params?.select ? await response.json() : null;
    
    return {
      data: data?.[0] || data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error as Error
    };
  }
}

/**
 * Make an RPC call to a Supabase function
 */
export async function supabaseRpc<T = any>(
  functionName: string,
  params?: Record<string, any>
): Promise<SupabaseResponse<T>> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(params || {})
      }
    );

    if (!response.ok) {
      throw new Error(`RPC error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error as Error
    };
  }
}

/**
 * Helper function to build filter strings
 */
export const filters = {
  eq: (column: string, value: any) => `${column}=eq.${value}`,
  in: (column: string, values: any[]) => `${column}=in.(${values.join(',')})`,
  or: (conditions: string[]) => `or=(${conditions.join(',')})`,
  and: (conditions: string[]) => conditions.join('&'),
  select: (columns: string) => columns,
  single: () => ({ single: true })
};

// Convenience functions for common operations
export const supabaseApi = {
  get: supabaseGet,
  post: supabasePost,
  patch: supabasePatch,
  rpc: supabaseRpc,
  filters
};
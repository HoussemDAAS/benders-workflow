import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApiError } from '../services';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  execute: (promise: Promise<T>) => Promise<T | null>;
}

export function useApi<T>(
  apiCall?: () => Promise<T>,
  immediate = true
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (promise: Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await promise;
      console.log('useApi single fetch result:', result);
      setData(result);
      return result;
    } catch (err) {
      console.error('useApi single fetch error:', err);
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
          ? err.message 
          : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (apiCall) {
      await execute(apiCall());
    }
  }, [apiCall, execute]);

  useEffect(() => {
    if (immediate && apiCall) {
      refresh();
    }
  }, [immediate, apiCall, refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    execute
  };
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useMultipleApi<T extends Record<string, any>>(
  apiCalls: { [K in keyof T]: () => Promise<T[K]> },
  immediate = true
): ApiState<T> & { refresh: () => Promise<void> } {
  const [data, setData] = useState<T>({} as T);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  // Memoize the API calls to prevent infinite re-renders
  const memoizedApiCalls = useMemo(() => apiCalls, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading data from', Object.keys(memoizedApiCalls).length, 'endpoints...');
      
      const results = {} as T;
      
      // Execute API calls sequentially
      for (const [key, apiCall] of Object.entries(memoizedApiCalls)) {
        try {
          const result = await apiCall();
          (results as any)[key] = result;
        } catch (callError) {
          console.error(`❌ API ${key} failed:`, callError);
          // Set empty array for failed calls to prevent crashes
          (results as any)[key] = Array.isArray((results as any)[key]) ? [] : null;
        }
      }
      
      console.log('✅ Data loaded successfully');
      setData(results);
    } catch (err) {
      console.error('💥 useMultipleApi error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [memoizedApiCalls]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
} 
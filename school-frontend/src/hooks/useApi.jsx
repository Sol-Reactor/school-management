// src/hooks/useApi.jsx
import { useState, useEffect, useCallback } from 'react';

const STABLE_EMPTY_ARRAY = [];

export const useApi = (apiFunction, dependencies = []) => {
  const deps = dependencies.length === 0 ? STABLE_EMPTY_ARRAY : dependencies;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedApiFunction = useCallback(apiFunction, deps);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await memoizedApiFunction();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [memoizedApiFunction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
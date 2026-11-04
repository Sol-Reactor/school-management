// Fetch helper for pages. Keeps the previous data while refetching (no flash
// to empty), ignores responses from stale requests, and exposes a readable error.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api';

export const useApi = (fetcher, deps = [], { enabled = true } = {}) => {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      if (id === requestId.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (id === requestId.current) setState((s) => ({ ...s, loading: false, error: getErrorMessage(error) }));
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (enabled) run();
    else setState((s) => ({ ...s, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass explicit deps
  }, [enabled, run, ...deps]);

  return { ...state, refetch: run, setData: (data) => setState((s) => ({ ...s, data })) };
};

export default useApi;

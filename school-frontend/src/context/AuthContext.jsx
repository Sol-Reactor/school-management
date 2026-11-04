/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/authServices';
import { isNetworkError, setUnauthorizedHandler } from '../services/api';
import { waitForServer } from '../services/healthService';
import {
  serverStatusChanged,
  sessionEnded,
  sessionStarted,
  userUpdated,
} from '../store/slices/authSlice';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// If the first request hasn't answered in this long, tell the user the server is waking up.
const WAKING_HINT_DELAY_MS = 2500;

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, status, server } = useSelector((state) => state.auth);

  /** Restores the session from the httpOnly cookie, waiting out a cold start if needed. */
  const restoreSession = useCallback(async () => {
    const hint = setTimeout(() => dispatch(serverStatusChanged('waking')), WAKING_HINT_DELAY_MS);
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const profile = await authService.getSession();
          dispatch(serverStatusChanged('ready'));
          dispatch(profile ? sessionStarted(profile) : sessionEnded());
          return;
        } catch (error) {
          if (!isNetworkError(error)) {
            dispatch(serverStatusChanged('ready'));
            dispatch(sessionEnded());
            return;
          }
          dispatch(serverStatusChanged('waking'));
          const up = await waitForServer();
          if (!up) {
            dispatch(serverStatusChanged('offline'));
            dispatch(sessionEnded());
            return;
          }
        }
      }
      dispatch(sessionEnded());
    } finally {
      clearTimeout(hint);
    }
  }, [dispatch]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Any 401 from the API (expired session, deleted account) signs the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => dispatch(sessionEnded()));
    return () => setUnauthorizedHandler(null);
  }, [dispatch]);

  const value = useMemo(() => {
    const start = (profile) => {
      dispatch(sessionStarted(profile));
      return profile;
    };
    return {
      user,
      status,
      server,
      isAuthenticated: status === 'authenticated',
      login: async (credentials) => start(await authService.login(credentials)),
      register: async (data) => start(await authService.register(data)),
      demoLogin: async (role) => start(await authService.demoLogin(role)),
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          dispatch(sessionEnded());
        }
      },
      fetchUserProfile: async () => start(await authService.getProfile()),
      updateProfile: async (updates) => {
        const updated = await authService.updateProfile(updates);
        dispatch(userUpdated(updated));
        return updated;
      },
      retryConnection: restoreSession,
    };
  }, [user, status, server, dispatch, restoreSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

// Axios instance shared by every service.
//
// Auth uses an httpOnly session cookie set by the API, so there is no token in
// JavaScript at all. In production the frontend calls its own origin (/api),
// which Vercel rewrites to the Render backend — the cookie is first-party.
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Render's free tier can take 30–60s to wake up.
  timeout: 60_000,
});

let unauthorizedHandler = null;
/** Registered by AuthProvider: called when any request returns 401. */
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthHandler) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

/** True when the request never got a response (server asleep/offline, timeout). */
export const isNetworkError = (error) => {
  if (!error?.response || error.code === 'ECONNABORTED') return true;
  const { status, data } = error.response;
  // Gateway errors, or a 5xx that didn't come from our API (no JSON message) = proxy couldn't reach it.
  return [502, 503, 504].includes(status) || (status >= 500 && !data?.message);
};

/** Human-readable message for any API error. */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (isNetworkError(error)) return "Can't reach the server right now. Please try again in a moment.";
  return fallback;
};

/** Field-level validation errors from a 400 response, as { fieldName: message }. */
export const getFieldErrors = (error) => {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return Object.fromEntries(list.map((e) => [e.path, e.message]));
};

export default api;

// Session state. `status` drives route guards:
//   checking      → we don't know yet (initial load / server waking up)
//   authenticated → `user` is set
//   anonymous     → no valid session
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'checking',
  user: null,
  // 'unknown' | 'ready' | 'waking' | 'offline' — powers the "waking up the server" UI.
  server: 'unknown',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted: (state, action) => {
      state.status = 'authenticated';
      state.user = action.payload;
      state.server = 'ready';
    },
    userUpdated: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    sessionEnded: (state) => {
      state.status = 'anonymous';
      state.user = null;
    },
    serverStatusChanged: (state, action) => {
      state.server = action.payload;
    },
  },
});

export const { sessionStarted, userUpdated, sessionEnded, serverStatusChanged } = authSlice.actions;
export default authSlice.reducer;

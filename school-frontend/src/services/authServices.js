// Auth endpoints. The session lives in an httpOnly cookie, so nothing is stored client-side.
import api from './api';

export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials, { skipAuthHandler: true });
    return data.user;
  },

  async register(userData) {
    const { data } = await api.post('/auth/register', userData, { skipAuthHandler: true });
    return data.user;
  },

  async demoLogin(role) {
    const { data } = await api.post('/auth/demo', { role }, { skipAuthHandler: true });
    return data.user;
  },

  async logout() {
    await api.post('/auth/logout', null, { skipAuthHandler: true });
  },

  /** Returns the signed-in user, or throws (401 when there is no session). */
  async getProfile() {
    const { data } = await api.get('/auth/profile', { skipAuthHandler: true });
    return data.user;
  },

  async updateProfile(updates) {
    const { data } = await api.put('/auth/profile', updates);
    return data.user;
  },
};

export default authService;

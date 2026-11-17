import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      // Fetch teacher info
      const profile = await api.get('/auth/me');
      localStorage.setItem('teacher', JSON.stringify(profile.data));
      return profile.data;
    }
    return null;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('teacher');
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    localStorage.setItem('teacher', JSON.stringify(response.data));
    return response.data;
  },

  getCurrentUser() {
    const raw = localStorage.getItem('teacher');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};

// src/services/classService.js
import api from './api';

export const classService = {
  async getClasses() {
    const response = await api.get('/classes');
    return response.data;
  },

  async createClass(classData) {
    const response = await api.post('/classes', classData);
    return response.data;
  },

  async updateClass(id, updates) {
    const response = await api.put(`/classes/${id}`, updates);
    return response.data;
  },

  async deleteClass(id) {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },
};
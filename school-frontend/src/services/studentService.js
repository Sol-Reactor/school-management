// src/services/studentService.js
import api from './api';

export const studentService = {
  async getStudents(params = {}) {
    const response = await api.get('/students', { params });
    return response.data;
  },

  async getStudentById(id) {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  async assignToClass(studentId, classId) {
    const response = await api.patch(`/students/${studentId}/class`, { classId });
    return response.data;
  },

  async assignToParent(studentId, parentId) {
    const response = await api.patch(`/students/${studentId}/parent`, { parentId });
    return response.data;
  },
};
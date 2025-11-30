// src/services/attendanceService.js
import api from './api';

export const attendanceService = {
  async getClassAttendance(classId, params = {}) {
    const response = await api.get(`/attendance/class/${classId}`, { params });
    return response.data;
  },

  async getStudentAttendance(studentId, params = {}) {
    const response = await api.get(`/attendance/student/${studentId}`, { params });
    return response.data;
  },

  async markAttendance(attendanceData) {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  async updateAttendance(id, updates) {
    const response = await api.put(`/attendance/${id}`, updates);
    return response.data;
  },
};
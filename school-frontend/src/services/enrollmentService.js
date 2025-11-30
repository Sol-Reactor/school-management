import api from './api';

export const enrollmentService = {
    async getEnrollments(params = {}) {
        const response = await api.get('/enrollments', { params });
        return response.data;
    },

    async assignStudentToClass(studentEmail, classId) {
        const response = await api.post('/enrollments/assign', {
            studentEmail,
            classId,
        });
        return response.data;
    },

    async createEnrollment(studentId, classId) {
        const response = await api.post('/enrollments', {
            studentId,
            classId,
        });
        return response.data;
    },

    async deleteEnrollment(id) {
        const response = await api.delete(`/enrollments/${id}`);
        return response.data;
    },
};

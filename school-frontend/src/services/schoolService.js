// Typed-ish wrappers for every school resource the UI uses. Each returns the
// response body; errors propagate as axios errors (see getErrorMessage).
import api from './api';

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);
const put = (url, body) => api.put(url, body).then((r) => r.data);
const patch = (url, body) => api.patch(url, body).then((r) => r.data);
const del = (url) => api.delete(url).then((r) => r.data);

// Lists are small for a single school, so pages fetch up to 100 and filter/sort client-side.
const ALL = { limit: 100 };

export const dashboardApi = {
  get: () => get('/dashboard'),
};

export const studentsApi = {
  list: (params) => get('/students', { ...ALL, ...params }),
  get: (id) => get(`/students/${id}`),
  assignClass: (id, classId) => patch(`/students/${id}/class`, { classId }),
};

export const usersApi = {
  list: (params) => get('/users', { ...ALL, ...params }),
  create: (body) => post('/users', body),
  update: (id, body) => put(`/users/${id}`, body),
  remove: (id) => del(`/users/${id}`),
};

export const teachersApi = {
  list: () => get('/teachers'),
  get: (id) => get(`/teachers/${id}`),
};

export const classesApi = {
  list: () => get('/classes'),
  get: (id) => get(`/classes/${id}`),
  create: (body) => post('/classes', body),
  update: (id, body) => put(`/classes/${id}`, body),
  remove: (id) => del(`/classes/${id}`),
  students: (id) => get(`/classes/${id}/students`),
};

export const enrollmentsApi = {
  assignByEmail: (studentEmail, classId) => post('/enrollments/assign', { studentEmail, classId }),
};

export const attendanceApi = {
  forClass: (classId, params) => get(`/attendance/class/${classId}`, params),
  forStudent: (studentId, params) => get(`/attendance/student/${studentId}`, params),
  mark: (body) => post('/attendance', body),
  update: (id, status) => put(`/attendance/${id}`, { status }),
};

export const examsApi = {
  list: (params) => get('/exams', { ...ALL, ...params }),
  forClass: (classId) => get(`/exams/class/${classId}`),
  create: (body) => post('/exams', body),
  remove: (id) => del(`/exams/${id}`),
};

export const gradesApi = {
  list: (params) => get('/grades', { ...ALL, ...params }),
  forStudent: (studentId) => get(`/grades/student/${studentId}`),
  forExam: (examId) => get(`/grades/exam/${examId}`),
  create: (body) => post('/grades', body),
  update: (id, marks) => put(`/grades/${id}`, { marks }),
};

export const timetableApi = {
  list: (params) => get('/timetable', params),
  forClass: (classId) => get(`/timetable/class/${classId}`),
  forTeacher: (teacherId) => get(`/timetable/teacher/${teacherId}`),
  create: (body) => post('/timetable', body),
  remove: (id) => del(`/timetable/${id}`),
};

export const subjectsApi = {
  list: (params) => get('/subjects', params),
};

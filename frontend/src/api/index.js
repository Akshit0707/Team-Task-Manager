import axiosInstance from './axios.js';

export const authAPI = {
  login: (email, password) =>
    axiosInstance.post('/auth/login', { email, password }),
  signup: (name, email, password) =>
    axiosInstance.post('/auth/signup', { name, email, password }),
  getMe: () => axiosInstance.get('/auth/me'),
};

export const projectsAPI = {
  getAll: () => axiosInstance.get('/projects'),
  getById: (projectId) => axiosInstance.get(`/projects/${projectId}`),
  create: (name, description) =>
    axiosInstance.post('/projects', { name, description }),
  update: (projectId, data) =>
    axiosInstance.put(`/projects/${projectId}`, data),
  delete: (projectId) => axiosInstance.delete(`/projects/${projectId}`),
  getMembers: (projectId) =>
    axiosInstance.get(`/projects/${projectId}/members`),
  addMember: (projectId, email, role = 'member') =>
    axiosInstance.post(`/projects/${projectId}/members`, { email, role }),
  removeMember: (projectId, memberId) =>
    axiosInstance.delete(`/projects/${projectId}/members/${memberId}`),
};

export const tasksAPI = {
  getProjectTasks: (projectId, filters = {}) =>
    axiosInstance.get(`/projects/${projectId}/tasks`, { params: filters }),
  getMyTasks: (filters = {}) =>
    axiosInstance.get('/tasks/my', { params: filters }),
  getDashboardStats: () =>
    axiosInstance.get('/tasks/dashboard'),
  getById: (taskId) => axiosInstance.get(`/tasks/${taskId}`),
  create: (projectId, data) =>
    axiosInstance.post(`/projects/${projectId}/tasks`, data),
  update: (taskId, data) =>
    axiosInstance.put(`/tasks/${taskId}`, data),
  updateStatus: (taskId, status) =>
    axiosInstance.patch(`/tasks/${taskId}/status`, { status }),
  delete: (taskId) => axiosInstance.delete(`/tasks/${taskId}`),
};

export default {
  auth: authAPI,
  projects: projectsAPI,
  tasks: tasksAPI,
};
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8005/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('owner_access_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  // Don't set content-type for multipart
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('owner_access_token');
      localStorage.removeItem('owner_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: async (username, password) => {
    console.log('Login API called with:', { username });
    try {
      const response = await api.post('/schools/login/', { username, password });
      console.log('Login response:', response.data);
      return response;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },
  logout: () => api.post('/schools/logout/'),
  getCurrentUser: () => api.get('/schools/me/'),
};

// Schools API
export const schoolsApi = {
  list: (params) => api.get('/schools/', { params }),
  create: (data) => api.post('/schools/', data),
  get: (id) => api.get(`/schools/${id}/`),
  update: (id, data) => api.put(`/schools/${id}/`, data),
  delete: (id) => api.delete(`/schools/${id}/`),
  archive: (id, reason) => api.post(`/schools/${id}/archive/`, { reason }),
  restore: (id) => api.post(`/schools/${id}/restore/`),
  sync: (id) => api.post(`/schools/${id}/sync/`),
  getAllStats: () => api.get('/schools/stats/all/'),
};

// Analytics API
export const analyticsApi = {
  getGlobal: (days) => api.get('/analytics/global/', { params: { days } }),
  getSchool: (schoolId, days) => api.get(`/analytics/school/${schoolId}/`, { params: { days } }),
  getComprehensive: () => api.get('/analytics/comprehensive/'),
  getPortalFeeAnalytics: () => api.get('/analytics/portal-fee/'),
  getSchoolFeeAnalytics: () => api.get('/analytics/school-fee/'),
  getUserActivity: () => api.get('/analytics/user-activity/'),
  getAPIServerHealth: () => api.get('/analytics/api-server/'),
  logActivity: (data) => api.post('/analytics/log-activity/', data),
  manageUser: (data) => api.post('/analytics/manage-user/', data),
};

// Health API
export const healthApi = {
  check: () => api.get('/health/'),
};


// Owner API - Add getAllUsers method
export const ownerApi = {
  getComprehensiveDashboard: () => api.get('/owner/comprehensive-dashboard/'),
  getPerSchoolActivity: (schoolId) => api.get(`/owner/per-school-activity/${schoolId}/`),
  forceLogoutSchool: (schoolId) => api.post(`/owner/force-logout-school/${schoolId}/`),
  getSchools: () => api.get('/schools/'),
  getAllUsers: () => api.get('/owner/all-users/'),  // ← ADD THIS
  manageSchoolUser: (schoolId, registrationNumber, action, reason = '') => 
    api.post('/owner/manage-school-user/', { 
      school_id: schoolId, 
      registration_number: registrationNumber, 
      action, 
      reason 
    }),
  getAllFailedLogins: () => api.get('/owner/all-failed-logins/'),
  unlockUserInSchool: (registrationNumber, schoolId) => 
    api.post('/owner/unlock-user-in-school/', { 
      registration_number: registrationNumber, 
      school_id: schoolId 
    }),
  unlockUserAllSchools: (registrationNumber) => 
    api.post('/owner/unlock-user-all-schools/', { 
      registration_number: registrationNumber 
    }),
};



// Security API
export const securityApi = {
  getFailedLogins: (schoolId, days) => api.get(`/security/failed-logins/${schoolId || ''}`, { params: { days } }),
  getSuspiciousUsers: () => api.get('/security/suspicious-users/'),
  lockUser: (registrationNumber, schoolId) => api.post('/security/lock-user/', { registration_number: registrationNumber, school_id: schoolId }),
  unlockUser: (registrationNumber, schoolId) => api.post('/security/unlock-user/', { registration_number: registrationNumber, school_id: schoolId }),
  getSystemLogs: (params) => api.get('/security/system-logs/', { params }),
};
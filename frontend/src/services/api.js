import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle unauthorized responses (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  }
};

// Config Services
export const configService = {
  getConfig: async () => {
    const res = await api.get('/config');
    return res.data;
  },
  updateConfig: async (configData) => {
    const res = await api.put('/config', configData);
    return res.data;
  }
};

// Session Services
export const sessionService = {
  getSessions: async () => {
    const res = await api.get('/sessions');
    return res.data;
  },
  getActiveSession: async () => {
    const res = await api.get('/sessions/active');
    return res.data;
  },
  createSession: async (sessionData) => {
    const res = await api.post('/sessions', sessionData);
    return res.data;
  },
  updateSession: async (id, sessionData) => {
    const res = await api.put(`/sessions/${id}`, sessionData);
    return res.data;
  },
  extendSession: async (id, data) => {
    const res = await api.patch(`/sessions/${id}/extend`, data);
    return res.data;
  },
  activateAllSessions: async () => {
    const res = await api.patch('/sessions/bulk/activate-all');
    return res.data;
  },
  deactivateAllSessions: async () => {
    const res = await api.patch('/sessions/bulk/deactivate-all');
    return res.data;
  },
  deleteSession: async (id) => {
    const res = await api.delete(`/sessions/${id}`);
    return res.data;
  }
};

// Subject Services
export const subjectService = {
  getAllSubjects: async (params = {}) => {
    const res = await api.get('/subjects', { params });
    return res.data;
  },
  getEligibleBacklogs: async (sessionType) => {
    const res = await api.get('/subjects/eligible-backlogs', {
      params: sessionType ? { sessionType } : {}
    });
    return res.data;
  },
  createSubject: async (subjectData) => {
    const res = await api.post('/subjects', subjectData);
    return res.data;
  },
  updateSubject: async (id, subjectData) => {
    const res = await api.put(`/subjects/${id}`, subjectData);
    return res.data;
  },
  deleteSubject: async (id) => {
    const res = await api.delete(`/subjects/${id}`);
    return res.data;
  }
};

// Registration & Payment Services
export const registrationService = {
  createRegistration: async (formData) => {
    // Uses multipart/form-data for receipts or application/json
    const isFormData = formData instanceof FormData;
    const res = await api.post('/registrations', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return res.data;
  },
  getMyRegistrations: async () => {
    const res = await api.get('/registrations/my-registrations');
    return res.data;
  },
  getRegistrationById: async (id) => {
    const res = await api.get(`/registrations/${id}`);
    return res.data;
  },
  getAllRegistrations: async (params = {}) => {
    const res = await api.get('/registrations/all', { params });
    return res.data;
  },
  verifyManualPayment: async (id, data) => {
    const res = await api.patch(`/registrations/${id}/verify-payment`, data);
    return res.data;
  },
  createOnlineOrder: async (registrationId) => {
    const res = await api.post('/registrations/create-online-order', { registrationId });
    return res.data;
  },
  verifyOnlinePayment: async (data) => {
    const res = await api.post('/registrations/verify-online-payment', data);
    return res.data;
  },
  exportCSV: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.paymentMethod && filters.paymentMethod !== 'ALL') params.append('paymentMethod', filters.paymentMethod);
    if (filters.department && filters.department !== 'ALL') params.append('department', filters.department);
    if (filters.session && filters.session !== 'ALL') params.append('session', filters.session);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/registrations/export-csv${queryString}`, {
      responseType: 'blob'
    });

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backlog_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  }
};

// Admin Services
export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
  },
  getAllStudents: async (params = {}) => {
    const res = await api.get('/admin/students', { params });
    return res.data;
  },
  updateStudentBacklogs: async (studentId, data) => {
    const res = await api.put(`/admin/students/${studentId}/backlogs`, data);
    return res.data;
  },
  importExcelResults: async (formData) => {
    const res = await api.post('/admin/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export default api;

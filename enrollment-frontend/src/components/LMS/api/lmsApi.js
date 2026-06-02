import axios from 'axios';

const LMS_TOKEN_KEY = 'lms_auth_token';
const LMS_USER_KEY = 'lms_user_data';
const API_HOST =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

const lms = axios.create({
  baseURL: `${API_HOST}/api/lms`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

lms.interceptors.request.use((config) => {
  const token = localStorage.getItem(LMS_TOKEN_KEY) || localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

lms.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(LMS_TOKEN_KEY);
      localStorage.removeItem(LMS_USER_KEY);
    }
    return Promise.reject(error);
  }
);

const wrap = (p) => p.then((r) => r.data).catch((e) => {
  throw e.response?.data || { success: false, message: e.message || 'Request failed' };
});

export const lmsAuthAPI = {
  login: async (credentials) => {
    const data = await wrap(lms.post('/login', credentials));
    if (data?.success && data?.data) {
      localStorage.setItem(LMS_TOKEN_KEY, data.data.token);
      localStorage.setItem(LMS_USER_KEY, JSON.stringify(data.data.user));
    }
    return data;
  },
  me: () => wrap(lms.get('/me')),
  logout: async () => {
    try { await wrap(lms.post('/logout')); } catch (_) {}
    localStorage.removeItem(LMS_TOKEN_KEY);
    localStorage.removeItem(LMS_USER_KEY);
  },
  isAuthenticated: () =>
    !!localStorage.getItem(LMS_TOKEN_KEY) || !!localStorage.getItem('auth_token'),
  getUser: () => {
    try {
      const lms = JSON.parse(localStorage.getItem(LMS_USER_KEY) || 'null');
      if (lms) return lms;
      const main = JSON.parse(localStorage.getItem('user_data') || 'null');
      if (main) {
        return { ...main, lms_role: (main.role || '').toLowerCase() };
      }
      return null;
    } catch { return null; }
  },
};

export const lmsSubjectsAPI = {
  list: () => wrap(lms.get('/subjects')),
  get: (id) => wrap(lms.get(`/subjects/${id}`)),
  sections: (id) => wrap(lms.get(`/subjects/${id}/sections`)),
  availableInstructors: () => wrap(lms.get('/instructors/available')),
  assignInstructor: (subjectId, userId) => wrap(lms.post(`/subjects/${subjectId}/instructors`, { user_id: userId })),
  unassignInstructor: (subjectId, userId) => wrap(lms.delete(`/subjects/${subjectId}/instructors/${userId}`)),
};

export const lmsModulesAPI = {
  listBySubject: (subjectId, params = {}) =>
    wrap(lms.get(`/subjects/${subjectId}/modules`, { params })),
  get: (id) => wrap(lms.get(`/modules/${id}`)),
  create: (payload) => wrap(lms.post('/modules', payload)),
  update: (id, payload) => wrap(lms.put(`/modules/${id}`, payload)),
  remove: (id) => wrap(lms.delete(`/modules/${id}`)),
  uploadFile: (moduleId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return wrap(lms.post(`/modules/${moduleId}/files`, fd));
  },
  deleteFile: (fileId) => wrap(lms.delete(`/files/${fileId}`)),
  downloadFileUrl: (fileId) => `${lms.defaults.baseURL}/files/${fileId}/download`,
  downloadFile: async (fileId, originalName) => {
    const res = await lms.get(`/files/${fileId}/download`, { responseType: 'blob' });
    triggerBrowserDownload(res.data, originalName || `file-${fileId}`);
  },
};

export const lmsAssignmentsAPI = {
  listByModule: (moduleId) => wrap(lms.get(`/modules/${moduleId}/assignments`)),
  get: (id) => wrap(lms.get(`/assignments/${id}`)),
  create: (payload) => wrap(lms.post('/assignments', payload)),
  update: (id, payload) => wrap(lms.put(`/assignments/${id}`, payload)),
  remove: (id) => wrap(lms.delete(`/assignments/${id}`)),
};

export const lmsSubmissionsAPI = {
  submit: (assignmentId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return wrap(lms.post(`/assignments/${assignmentId}/submissions`, fd));
  },
  listByAssignment: (assignmentId) => wrap(lms.get(`/assignments/${assignmentId}/submissions`)),
  mine: (assignmentId) => wrap(lms.get(`/assignments/${assignmentId}/my-submissions`)),
  grade: (submissionId, payload) => wrap(lms.post(`/submissions/${submissionId}/grade`, payload)),
  download: async (submissionId, originalName) => {
    const res = await lms.get(`/submissions/${submissionId}/download`, { responseType: 'blob' });
    triggerBrowserDownload(res.data, originalName || `submission-${submissionId}`);
  },
  // Instructor / admin: full roster including students who haven't submitted yet
  roster: (assignmentId) => wrap(lms.get(`/assignments/${assignmentId}/roster`)),
};

export const lmsAnnouncementsAPI = {
  listBySubject: (subjectId) => wrap(lms.get(`/subjects/${subjectId}/announcements`)),
  create: (payload) => wrap(lms.post('/announcements', payload)),
  update: (id, payload) => wrap(lms.put(`/announcements/${id}`, payload)),
  remove: (id) => wrap(lms.delete(`/announcements/${id}`)),
};

export const lmsNotificationsAPI = {
  list: (params = {}) => wrap(lms.get('/me/notifications', { params })),
  unreadCount: () => wrap(lms.get('/me/notifications/unread-count')),
  markRead: (id) => wrap(lms.post(`/me/notifications/${id}/read`)),
  markAllRead: () => wrap(lms.post('/me/notifications/read-all')),
  remove: (id) => wrap(lms.delete(`/me/notifications/${id}`)),
};

export const lmsGradebookAPI = {
  mine: () => wrap(lms.get('/me/gradebook')),
};

export const lmsDashboardAPI = {
  me: () => wrap(lms.get('/me/dashboard')),
};

export const lmsCalendarAPI = {
  // params: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  events: (params = {}) => wrap(lms.get('/me/calendar', { params })),
};

function triggerBrowserDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default {
  lmsAuthAPI,
  lmsSubjectsAPI,
  lmsModulesAPI,
  lmsAssignmentsAPI,
  lmsSubmissionsAPI,
  lmsAnnouncementsAPI,
  lmsNotificationsAPI,
  lmsGradebookAPI,
  lmsDashboardAPI,
  lmsCalendarAPI,
};

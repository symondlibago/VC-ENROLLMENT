import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Login failed' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/register', {
        ...userData,
        password_confirmation: userData.confirmPassword
      });
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const response = await api.post('/reset-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Reset password failed' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  },

  // Get current user
  getUser: async () => {
    try {
      const response = await api.get('/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get user data' };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    return !!(token && userData);
  },

  // Get stored user data
  getUserData: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Health check failed' };
  }
};

// Program API methods
export const programAPI = {
  // Get all programs
  getAll: async () => {
    try {
      const response = await api.get('/programs');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch programs' };
    }
  },

  // Get single program
  getById: async (id) => {
    try {
      const response = await api.get(`/programs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch program' };
    }
  },

  // Create new program
  create: async (programData) => {
    try {
      const response = await api.post('/programs', programData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create program' };
    }
  },

  // Update program
  update: async (id, programData) => {
    try {
      const response = await api.put(`/programs/${id}`, programData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update program' };
    }
  },

  // Delete program
  delete: async (id) => {
    try {
      const response = await api.delete(`/programs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to delete program' };
    }
  }
};

// Course API methods
export const courseAPI = {
  // Get all courses
  getAll: async () => {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch courses' };
    }
  },

  // Get single course
  getById: async (id) => {
    try {
      const response = await api.get(`/courses/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch course' };
    }
  },

  // Create new course
  create: async (courseData) => {
    try {
      const response = await api.post('/courses', courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create course' };
    }
  },

  // Update course
  update: async (id, courseData) => {
    try {
      const response = await api.put(`/courses/${id}`, courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update course' };
    }
  },

  // Delete course
  delete: async (id) => {
    try {
      const response = await api.delete(`/courses/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to delete course' };
    }
  }
};

export default api;


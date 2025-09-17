import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If the request data is FormData, let the browser set the correct Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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

// Subject Api
export const subjectAPI = {
  // Get all subjects
  getAll: async () => {
    try {
      const response = await api.get('/subjects');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch subjects' };
    }
  },

  // Get subjects by course ID
  getByCourse: async (courseId, year, semester) => {
    try {
      const response = await api.get(`/courses/${courseId}/subjects`, {
        params: { year, semester } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch subjects for this course' };
    }
  },

  // Get single subject
  getById: async (id) => {
    try {
      const response = await api.get(`/subjects/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch subject' };
    }
  },

  // Create new subject
  create: async (subjectData) => {
    try {
      const response = await api.post('/subjects', subjectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create subject' };
    }
  },

  // Update subject
  update: async (id, subjectData) => {
    try {
      const response = await api.put(`/subjects/${id}`, subjectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update subject' };
    }
  },

  // Delete subject
  delete: async (id) => {
    try {
      const response = await api.delete(`/subjects/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to delete subject' };
    }
  }
};

// Enrollment API methods
export const enrollmentAPI = {
  // Submit enrollment
  submitEnrollment: async (enrollmentData) => {
    try {
      const response = await api.post('/enrollments', enrollmentData);
      return response.data;
    } catch (error) {
      // Extract validation errors if they exist
      if (error.response?.data?.errors) {
        throw {
          ...error.response.data,
          errors: error.response.data.errors
        };
      }
      throw error.response?.data || { success: false, message: 'Failed to submit enrollment' };
    }
  },
  
  // Check enrollment status
  checkStatus: async (code) => {
    try {
      const response = await api.get(`/enrollments/code/${code}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to check enrollment status' };
    }
  },

  // Get all pre-enrolled students
  getPreEnrolledStudents: async () => {
    try {
      const response = await api.get('/enrollments');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch pre-enrolled students' };
    }
  },

  // Get pre-enrolled student details
  getStudentDetails: async (id) => {
    try {
      const response = await api.get(`/enrollments/${id}/details`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch student details' };
    }
  }
};
// Schedule API methods
export const scheduleAPI = {
  // Get schedules by subject ID
  getBySubject: async (subjectId) => {
    try {
      const response = await api.get(`/subjects/${subjectId}/schedules`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch schedules for this subject' };
    }
  },

  // Get single schedule
  getById: async (id) => {
    try {
      const response = await api.get(`/schedules/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch schedule' };
    }
  },

  // Create new schedule
  create: async (scheduleData) => {
    try {
      const response = await api.post('/schedules', scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create schedule' };
    }
  },

  // Update schedule
  update: async (id, scheduleData) => {
    try {
      const response = await api.put(`/schedules/${id}`, scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update schedule' };
    }
  },

  // Delete schedule
  delete: async (id) => {
    try {
      const response = await api.delete(`/schedules/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to delete schedule' };
    }
  }
};

export default api;


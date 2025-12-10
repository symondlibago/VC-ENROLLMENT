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
    if (
      error.response?.status === 401 &&
      url !== '/login' &&
      url !== '/login/verify-pin'
    ) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.reload();
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
      if (response.data.success && response.data.data && response.data.data.user) {
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
      // ✅ FIX: Check that the user object exists before setting it
      if (response.data.success && response.data.data && response.data.data.user) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Reset password
  sendPasswordResetOtp: async (email) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to send OTP' };
    }
  },

  resetPasswordWithOtp: async (data) => {
    try {
      const response = await api.post('/reset-password-with-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to reset password' };
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

  // --- NEW: Verify Email Change with OTP ---
  verifyEmailChange: async (otpData) => {
    try {
      const response = await api.post('/user/profile/verify-email-change', otpData);
      if (response.data.success && response.data.data && response.data.data.user) {
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to verify OTP' };
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
    if (!userData) {
      return null;
    }
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      return null;
    }
  },

   // --- NEW: Update User Profile ---
   updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      if (response.data.success && response.data.data && response.data.data.user) {
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      return response.data; 
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update profile' };
    }
  },


  // --- NEW: Change User Password ---
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/user/password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to change password' };
    }
  },

  // --- NEW: Verify Secondary PIN ---
  verifyPin: async (pinData) => {
    try {
      const response = await api.post('/login/verify-pin', pinData);
      if (response.data.success && response.data.data && response.data.data.user) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'PIN verification failed' };
    }
  },

  // --- NEW: Update User PIN ---
  updatePin: async (pinData) => {
    try {
      // Endpoint requires auth, interceptor will add token
      const response = await api.post('/user/pin', pinData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update PIN' };
    }
  },

  sendPinResetOtp: async (email) => {
    try {
      const response = await api.post('/forgot-pin/send-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to send OTP.' };
    }
  },

  verifyPinResetOtp: async (email, otp) => {
    try {
      const response = await api.post('/forgot-pin/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'OTP verification failed.' };
    }
  },

  resetPinWithToken: async (data) => {
    try {
      const response = await api.post('/forgot-pin/reset-pin', data);
      if (response.data.success && response.data.data && response.data.data.user) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to reset PIN.' };
    }
  },
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

  // Search Subjects
  searchSubjects: async (searchTerm, courseId) => {
    try {
      const response = await api.get('/subjects/search', {
        params: { q: searchTerm, course_id: courseId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to search subjects' };
    }
  },

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

  checkEmail: async (email) => {
    try {
      const response = await api.post('/enrollments/check-email', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to check email' };
    }
  },

  submitApproval: async (studentId, { status, remarks, roleName }) => {
    const response = await api.post(`/enrollments/${studentId}/approval`, {
        status,
        remarks,
        role: roleName
    });
    return response.data;
  },
  
  checkStatus: async (code) => {
    try {
      const response = await api.get(`/enrollments/code/${code}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to check enrollment status' };
    }
  },

  getPreEnrolledStudents: async () => {
    try {
      const response = await api.get('/enrollments');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch pre-enrolled students' };
    }
  },

  getPendingCount: async () => {
    try {
      const response = await api.get('/enrollments/pending-count');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch enrollment count', error);
      return { count: 0 };
    }
  },

  getStudentDetails: async (id) => {
    try {
      const response = await api.get(`/enrollments/${id}/details`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch student details' };
    }
  },

  creditSubject: async (studentId, subjectId) => {
    try {
      const response = await api.post(`/enrollments/${studentId}/credit-subject`, { subject_id: subjectId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to credit subject' };
    }
  },

  getEnrolledStudents: async () => {
    try {
      const response = await api.get('/enrolled-students');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch enrolled students' };
    }
  },

  updateStudentDetails: async (id, studentData) => {
    try {
      const response = await api.put(`/enrollments/${id}/details`, studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update student details' };
    }
  },

  // ID Releasing
  getStudentsForIdReleasing: async () => {
    try {
        const response = await api.get('/id-releasing/students');
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Failed to fetch students for ID releasing' };
    }
  },

  updateIdStatus: async (studentId, status) => {
    try {
        const response = await api.put(`/id-releasing/students/${studentId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Failed to update ID status' };
    }
  },

  bulkUpdateIdStatus: async (studentIds, status) => {
    try {
        const response = await api.post(`/id-releasing/students/bulk-status`, { 
            student_ids: studentIds, 
            status 
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Failed to bulk update ID status' };
    }
  },
  
  resetIdStatus: async () => {
    try {
        const response = await api.post('/id-releasing/reset');
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Failed to reset ID status' };
    }
  },

  // NEW: Check if a continuing student can enroll in the next term
  checkEnrollmentEligibility: async (studentId) => {
    try {
        const response = await api.get(`/enrollments/continuing/${studentId}/eligibility`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Failed to check enrollment eligibility' };
    }
  },

  // NEW: Search for enrolled students
  searchEnrolledStudents: async (searchTerm) => {
    try {
      const response = await api.get('/enrolled-students/search', {
        params: { search: searchTerm }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to search students' };
    }
  },

  // NEW: Submit enrollment for a continuing student
  submitContinuingEnrollment: async (enrollmentData) => {
    try {
      const response = await api.post('/enrollments/continuing', enrollmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to submit continuing enrollment' };
    }
  },

};

// Section API methods
export const sectionAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/sections');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch sections' };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/sections/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch section details' };
    }
  },

  create: async (sectionData) => {
    try {
      const response = await api.post('/sections', sectionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create section' };
    }
  },

  addStudents: async (sectionId, studentIds) => {
    try {
      const response = await api.post(`/sections/${sectionId}/students`, { student_ids: studentIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to add students to section' };
    }
  },

  removeStudent: async (sectionId, studentId) => {
    try {
      const response = await api.delete(`/sections/${sectionId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to remove student from section' };
    }
  },

  update: async (id, sectionData) => {
    try {
      const response = await api.put(`/sections/${id}`, sectionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update section' };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/sections/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to delete section' };
    }
  },
};

// --- Upload Receipt API methods ---
export const uploadReceiptAPI = {

  getAll: async () => {
    try {
      const response = await api.get('/upload-receipts');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch receipts' };
    }
  },

  searchStudents: async (name) => {
    try {
      const response = await api.get('/upload-receipts/search-students', {
        params: { name }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to search students' };
    }
  },


  upload: async (formData) => {
    try {
      const response = await api.post('/upload-receipts', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to save receipt' };
    }
  }
};

// --- Add Payment API methods ---
export const paymentAPI = {
  create: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to save payment' };
    }
  },

  getByStudentId: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}/payment`);
      return response.data;
    } catch (error) {
      // A 404 error is expected if they haven't paid, so we throw it
      // to be caught by the modal
      throw error.response?.data || { success: false, message: 'Failed to fetch payment data' };
    }
  },

  getPaymentForAuthenticatedStudent: async () => {
    try {
      const response = await api.get('/student/payment-history');
      return response.data;
    } catch (error) {
       // Gracefully handle 404 (No record found)
      const message = error.response?.data?.message || 'Failed to fetch payment data';
      throw { success: false, message, status: error.response?.status };
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

// Subject Change
export const subjectChangeAPI = {
  searchStudents: async (searchTerm) => {
    try {
      const response = await api.get('/students/search', { params: { search: searchTerm } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to search students' };
    }
  },

  getStudentSubjectDetails: async (studentId, year, semester) => {
    try {
      const response = await api.get(`/students/${studentId}/subject-details`, { params: { year, semester } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch subject details' };
    }
  },

  createRequest: async (requestData) => {
    try {
      const response = await api.post('/subject-change-requests', requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create request' };
    }
  },

  getAllRequests: async () => {
    try {
      const response = await api.get('/subject-change-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch requests' };
    }
  },

  getRequestDetails: async (id) => {
    try {
      const response = await api.get(`/subject-change-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch request details' };
    }
  },

  processRequest: async (id, { status, remarks }) => {
    try {
      const response = await api.post(`/subject-change-requests/${id}/process`, { status, remarks });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to process request' };
    }
  },
};

// --- Shiftee API methods ---
export const shifteeAPI = {
  // Search for enrolled students who can shift
  searchStudents: async (searchTerm) => {
    try {
      // This can reuse the same student search endpoint if the criteria are the same
      const response = await api.get('/students/search', { params: { search: searchTerm } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to search students' };
    }
  },

  // Get all programs and courses available for shifting
  getShiftingData: async () => {
    try {
      // You'll need to create this endpoint on your backend
      const response = await api.get('/shifting/data'); 
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch shifting data' };
    }
  },

  // Create a new shiftee request
  createRequest: async (requestData) => {
    try {
      // Endpoint for submitting a new request
      const response = await api.post('/shiftee-requests', requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create shiftee request' };
    }
  },

  // Get all pending and past shiftee requests
  getAllRequests: async () => {
    try {
      const response = await api.get('/shiftee-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch shiftee requests' };
    }
  },

  // Get details for a single request (for the modal)
  getRequestDetails: async (id) => {
    try {
      const response = await api.get(`/shiftee-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch request details' };
    }
  },
  
  // Process a request (approve/reject)
  processRequest: async (id, { status, remarks }) => {
    try {
      const response = await api.post(`/shiftee-requests/${id}/process`, { status, remarks });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to process request' };
    }
  },
};

// User API methods
export const userAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch admin staff' };
    }
  },

  create: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create admin staff' };
    }
  },

  update: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update user' };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to delete user' };
    }
  },
};


// --- Instructor API methods ---
export const instructorAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/instructors');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch instructors' };
    }
  },

  getRoster: async () => {
    try {
      const response = await api.get('/instructor/roster');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch class roster' };
    }
  },

  getSchedule: async () => {
    try {
      const response = await api.get('/instructor/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch schedule' };
    }
  },

  getGradeableStudents: async () => {
    try {
      const response = await api.get('/instructor/gradeable-students');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch students for grading' };
    }
  },

  bulkUpdateGrades: async (gradesData) => {
    try {
      const response = await api.post('/instructor/grades/bulk-update', { grades: gradesData });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to submit grades' };
    }
  },

  create: async (instructorData) => {
    try {
      const response = await api.post('/instructors', instructorData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create instructor' };
    }
  },

  update: async (id, instructorData) => {
    try {
      const response = await api.put(`/instructors/${id}`, instructorData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update instructor' };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/instructors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to delete instructor' };
    }
  },
};

export const gradeAPI = {
  getStudentGrades: async (studentId, { year, semester }) => {
    try {
      // Create a params object to handle optional filters
      const params = {};
      if (year) params.year = year;
      if (semester) params.semester = semester;

      const response = await api.get(`/students/${studentId}/grades`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch student grades' };
    }
  },

  updateStudentGrades: async (gradesData) => {
    try {
      // This will send an array of grade objects to be updated.
      const response = await api.post('/grades/update-batch', { grades: gradesData });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update grades' };
    }
  },
};

// --- ADD THIS: Management API (for grading periods) ---
export const managementAPI = {
  getGradingPeriods: async () => {
    try {
      const response = await api.get('/management/grading-periods');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch grading periods' };
    }
  },

  updateGradingPeriods: async (periodsData) => {
    try {
      const response = await api.post('/management/grading-periods', periodsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update grading periods' };
    }
  },
};

// --- Student API methods ---
export const studentAPI = {
  getEnrolledSubjects: async () => {
    try {
      const response = await api.get('/student/enrolled-subjects');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch enrolled subjects' };
    }
  },

  getMyGrades: async ({ year, semester }) => {
    try {
      const params = {};
      if (year && year !== 'all') params.year = year;
      if (semester && semester !== 'all') params.semester = semester;

      const response = await api.get('/student/grades', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch grades' };
    }
  },

  getCurriculum: async () => {
    try {
      const response = await api.get('/student/curriculum');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch curriculum' };
    }
  },

  getSchedule: async () => {
    try {
      const response = await api.get('/student/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch schedule' };
    }
  },

  checkMyEnrollmentEligibility: async () => {
    try {
      const response = await api.get('/student/eligibility'); 
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to check enrollment eligibility' };
    }
  },

  getSubjectsForNextTerm: async (year, semester) => {
    try {
      const response = await api.get('/student/subjects-for-term', {
        params: { year, semester }
      }); 
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch subjects.' };
    }
  },

};



export default api;

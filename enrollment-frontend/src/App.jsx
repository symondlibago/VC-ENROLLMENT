import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/pages/Dashboard';
import Students from './components/pages/Students';
import Courses from './components/pages/Courses';
import Enrollment from './components/pages/Enrollment';
import AddingDroppingSubjects from './components/pages/AddingDroppingSubjects';
import Shiftee from './components/pages/Shiftee';
import FacultyAdminStaff from './components/pages/FacultyAdminStaff';
import Grades from './components/pages/Grades';
import IDReleasing from './components/pages/IDReleasing';
import Settings from './components/pages/Settings';
import LandingPage from './components/auth/LandingPage';
import LoginPage from './components/auth/LoginPage';
import FristProcessEnrollment from './components/Enrollment Process/FristProcessEnrollment';
import CheckStatus from './components/pages/CheckStatus';
import UploadReceipt from './components/pages/UploadReceipt';
import { authAPI } from './services/api';
import './App.css';
import ClassRoster from './components/instructorpage/ClassRoster';
import InstructorSchedule from './components/instructorpage/InstructorSchedule';
import StudentGrades from './components/instructorpage/StudentGrades';
import SubjectEnrolled from './components/studentpage/SubjectEnrolled';
import StudentGrade from './components/studentpage/StudentGrade';
import EvaluationRecords from './components/studentpage/EvaluationRecords';
import StudentSchedule from './components/studentpage/StudentSchedule';
import StudentEnrollmentEligibility from './components/studentpage/StudentEnrollmentEligibility';


function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      if (authAPI.isAuthenticated()) {
        const userData = authAPI.getUserData();
        setUser(userData);
        setIsAuthenticated(true);
        setCurrentView('dashboard');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleGetStarted = () => setCurrentView('login');
  const handleEnrollNow = () => setCurrentView('enrollment');
  const handleCheckStatus = () => setCurrentView('checkstatus');
  const handleUploadReceipt = () => setCurrentView('uploadreceipt');

  const handleLogin = () => {
    const userData = authAPI.getUserData();
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };
  const handleBack = () => setCurrentView('landing');
  const handleBackToEnrollment = () => setCurrentView('enrollment');
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setCurrentView('landing');
    }
  };

  const layoutVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } },
  };

  const mainContentVariants = {
    expanded: {
      marginLeft: isMobile ? 0 : '16rem',
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    },
    collapsed: {
      marginLeft: isMobile ? 0 : '4rem',
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    },
  };

  const pageTransitionVariants = {
    initial: { opacity: 0, x: 20, scale: 0.98 },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.98,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
    },
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-100 flex items-center justify-center">
        <motion.div
          className="flex items-center space-x-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <motion.div
              className="w-4 h-4 bg-white rounded"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold heading-bold text-gray-900">VIPC Enroll</h1>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- NEW: Function to render routes based on user role ---
  const renderRoutes = () => {
    const role = user?.role;

    if (role === 'instructor') {
      return (
        <>
          <Route path="/class-roster" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><ClassRoster /></motion.div>} />
          <Route path="/student-grades" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><StudentGrades /></motion.div>} />
          <Route path="/schedule" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><InstructorSchedule /></motion.div>} />
          <Route path="/settings" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Settings /></motion.div>} />
          <Route path="*" element={<Navigate to="/class-roster" replace />} />
        </>
      );
    }

    if (role === 'Student') {
      return (
        <>
          <Route path="/subject-enrolled" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><SubjectEnrolled /></motion.div>} />
          <Route path="/my-schedule" element={<motion.div variants={pageTransitionVariants}><StudentSchedule /></motion.div>} />
          <Route path="/my-grades" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><StudentGrade /></motion.div>} />
          <Route path="/evaluation-records" element={<motion.div variants={pageTransitionVariants}><EvaluationRecords /></motion.div>} />
          <Route path="/enrollment-eligibility" element={<motion.div variants={pageTransitionVariants}><StudentEnrollmentEligibility /></motion.div>} />
          <Route path="/settings" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Settings /></motion.div>} />
          <Route path="*" element={<Navigate to="/subject-enrolled" replace />} />
        </>
      );
    }
    
    // Default routes for Admin and other staff roles
    return (
      <>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Dashboard user={user} /></motion.div>} />
        <Route path="/students" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Students /></motion.div>} />
        <Route path="/courses" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Courses /></motion.div>} />
        <Route path="/enrollment" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Enrollment /></motion.div>} />
        <Route path="/addingdroppingsubjects" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><AddingDroppingSubjects /></motion.div>} />
        <Route path="/shiftee" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Shiftee /></motion.div>} />
        <Route path="/facultyadminstaff" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><FacultyAdminStaff /></motion.div>} />
        <Route path="/grades" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Grades /></motion.div>} />
        <Route path="/id-releasing" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><IDReleasing /></motion.div>} />
        <Route path="/settings" element={<motion.div variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit"><Settings /></motion.div>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </>
    );
  };

  return (
    <Router>
      {currentView === 'landing' && (
        <motion.div className="min-h-screen" variants={layoutVariants} initial="initial" animate="animate">
          <LandingPage onGetStarted={handleGetStarted} onEnrollNow={handleEnrollNow} />
        </motion.div>
      )}

      {currentView === 'login' && (
        <motion.div className="min-h-screen" variants={layoutVariants} initial="initial" animate="animate">
          <LoginPage onLogin={handleLogin} onBack={handleBack} />
        </motion.div>
      )}

      {currentView === 'enrollment' && (
        <motion.div className="min-h-screen" variants={layoutVariants} initial="initial" animate="animate">
          <FristProcessEnrollment 
            onBack={handleBack} 
            onCheckStatus={handleCheckStatus}
            onUploadReceipt={handleUploadReceipt}
          />
        </motion.div>
      )}

      {currentView === 'uploadreceipt' && (
        <motion.div className="min-h-screen" variants={layoutVariants} initial="initial" animate="animate">
          <UploadReceipt onBack={handleBackToEnrollment} /> 
        </motion.div>
      )}

      {currentView === 'checkstatus' && (
        <motion.div className="min-h-screen" variants={layoutVariants} initial="initial" animate="animate">
          <CheckStatus onBack={handleBackToEnrollment} />
        </motion.div>
      )}
        
        {currentView === 'dashboard' && (
            <motion.div
            className="min-h-screen bg-(--snowy-white) overflow-hidden"
            variants={layoutVariants}
            initial="initial"
            animate="animate"
            >
            <AnimatePresence>
                {isMobile && !isCollapsed && (
                <motion.div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsCollapsed(true)}
                />
                )}
            </AnimatePresence>

            <div
                className={`fixed top-0 left-0 z-50 ${
                isMobile ? (isCollapsed ? '-translate-x-full' : 'translate-x-0') : ''
                } transition-transform duration-300`}
            >
                <Sidebar
                isCollapsed={isCollapsed && !isMobile ? true : false}
                setIsCollapsed={setIsCollapsed}
                user={user}
                />
            </div>
            
            <motion.div
                className="flex flex-col min-h-screen"
                variants={mainContentVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                initial={false}
            >
                <Header
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                user={user}
                onLogout={handleLogout}
                />

                <motion.main
                className="flex-1 overflow-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] } }}
                >
                <AnimatePresence mode="wait">
                    <Routes>
                      {renderRoutes()}
                    </Routes>
                </AnimatePresence>
                </motion.main>
                 <motion.footer
                    className="bg-white border-t border-gray-200 px-6 py-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.4 } }}
                    >
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <p>© 2025 VIPC Enroll Management System. All rights reserved.</p>
                        <div className="flex items-center space-x-4">
                        <button onClick={handleLogout} className="hover:text-primary liquid-morph">
                            Logout
                        </button>
                        <a href="#" className="hover:text-primary liquid-morph">Privacy Policy</a>
                        <a href="#" className="hover:text-primary liquid-morph">Terms of Service</a>
                        <a href="#" className="hover:text-primary liquid-morph">Support</a>
                        </div>
                    </div>
                </motion.footer>
            </motion.div>
            </motion.div>
        )}
    </Router>
  );
}

export default App;


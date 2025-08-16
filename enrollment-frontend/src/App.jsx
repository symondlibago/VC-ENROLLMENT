import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import { authAPI } from './services/api';
import './App.css';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'login', 'dashboard'
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
    // Check if user is already authenticated on app load
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

  const handleGetStarted = () => {
    setCurrentView('login');
  };

  const handleLogin = () => {
    const userData = authAPI.getUserData();
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleBack = () => {
    setCurrentView('landing');
  };

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
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const mainContentVariants = {
    expanded: {
      marginLeft: isMobile ? 0 : '16rem',
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    collapsed: {
      marginLeft: isMobile ? 0 : '4rem',
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
        <motion.div
          className="flex items-center space-x-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-8 h-8 bg-[var(--dominant-red)] rounded-lg flex items-center justify-center">
            <motion.div
              className="w-4 h-4 bg-white rounded"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold heading-bold text-gray-900">EduEnroll</h1>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Landing Page View
  if (currentView === 'landing') {
    return (
      <motion.div
        className="min-h-screen"
        variants={layoutVariants}
        initial="initial"
        animate="animate"
      >
        <LandingPage onGetStarted={handleGetStarted} />
      </motion.div>
    );
  }

  // Login Page View
  if (currentView === 'login') {
    return (
      <motion.div
        className="min-h-screen"
        variants={layoutVariants}
        initial="initial"
        animate="animate"
      >
        <LoginPage onLogin={handleLogin} onBack={handleBack} />
      </motion.div>
    );
  }

  // Dashboard View (Authenticated)
  return (
    <motion.div
      className="min-h-screen bg-[var(--snowy-white)] overflow-hidden"
      variants={layoutVariants}
      initial="initial"
      animate="animate"
    >
      {/* Mobile Overlay */}
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

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-50 ${isMobile ? (isCollapsed ? '-translate-x-full' : 'translate-x-0') : ''} transition-transform duration-300`}>
        <Sidebar isCollapsed={isCollapsed && !isMobile ? true : false} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Main Content */}
      <motion.div
        className="flex flex-col min-h-screen"
        variants={mainContentVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        initial={false}
      >
        {/* Header */}
        <Header 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <motion.main
          className="flex-1 overflow-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              duration: 0.8,
              delay: 0.2,
              ease: [0.23, 1, 0.32, 1]
            }
          }}
        >
          <Dashboard user={user} />
        </motion.main>

        {/* Footer */}
        <motion.footer
          className="bg-white border-t border-gray-200 px-6 py-4"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: {
              duration: 0.6,
              delay: 0.4
            }
          }}
        >
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>© 2024 EduEnroll Management System. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogout}
                className="hover:text-[var(--dominant-red)] liquid-morph"
              >
                Logout
              </button>
              <a href="#" className="hover:text-[var(--dominant-red)] liquid-morph">Privacy Policy</a>
              <a href="#" className="hover:text-[var(--dominant-red)] liquid-morph">Terms of Service</a>
              <a href="#" className="hover:text-[var(--dominant-red)] liquid-morph">Support</a>
            </div>
          </div>
        </motion.footer>
      </motion.div>
    </motion.div>
  );
}

export default App;

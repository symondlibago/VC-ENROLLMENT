import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  FileText,
  BarChart3,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null, path: '/dashboard' },
    { id: 'students', icon: Users, label: 'Students', badge: '24', path: '/students' },
    { id: 'courses', icon: BookOpen, label: 'Courses', badge: null, path: '/courses' },
    { id: 'enrollment', icon: GraduationCap, label: 'Enrollment', badge: '5', path: '/enrollment' },
    { id: 'schedule', icon: Calendar, label: 'Add/Drop Subjects', badge: null, path: '/addingdroppingsubjects' },
    { id: 'shiftee', icon: BarChart3, label: 'Shiftee', badge: null, path: '/shiftee' },
    { id: 'facultyadminstaff', icon: User, label: 'Faculty & Admin Staff', badge: null, path: '/facultyadminstaff' },
    { id: 'grades', icon: FileText, label: 'Grades', badge: '12', path: '/grades' },
    { id: 'settings', icon: Settings, label: 'Settings', badge: null, path: '/settings' },
  ];

  // Update active item based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = menuItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [location.pathname]);

  const handleNavigation = (item) => {
    setActiveItem(item.id);
    navigate(item.path);
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  const sidebarVariants = {
    expanded: {
      width: '16rem',
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    collapsed: {
      width: '4rem',
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const itemVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: 0.1
      }
    },
    collapsed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const navigationVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  return (
    <motion.div
      className="h-screen bg-[var(--dominant-red)] text-white flex flex-col relative z-50"
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      initial={false}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                variants={itemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="flex items-center space-x-3"
              >
                <motion.div 
                  className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <GraduationCap className="w-5 h-5 text-[var(--dominant-red)]" />
                </motion.div>
                <div>
                  <h1 className="text-lg font-bold heading-bold">EduEnroll</h1>
                  <p className="text-xs text-white/70">Management System</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-white/10 liquid-button p-2"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 liquid-morph group relative ${
                isActive 
                  ? 'bg-white text-[var(--dominant-red)] shadow-lg' 
                  : 'text-white hover:bg-white/10'
              }`}
              variants={navigationVariants}
              whileHover="hover"
              whileTap="tap"
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: {
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.23, 1, 0.32, 1]
                }
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--dominant-red)] rounded-r-full"
                  layoutId="activeIndicator"
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                />
              )}
              
              <motion.div
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  rotate: isActive ? 5 : 0
                }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[var(--dominant-red)]' : 'text-white'}`} />
              </motion.div>
              
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    variants={itemVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="flex items-center justify-between flex-1"
                  >
                    <span className={`text-sm font-medium ${isActive ? 'text-[var(--dominant-red)]' : 'text-white'}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <motion.span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          isActive 
                            ? 'bg-[var(--dominant-red)] text-white' 
                            : 'bg-white/20 text-white'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <motion.div
                  className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50"
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 bg-[var(--dominant-red)] rounded text-xs">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              variants={itemVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="text-center"
            >
              <p className="text-xs text-white/70">Version 1.0</p>
              <p className="text-xs text-white/50">© 2025 EduEnroll</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Sidebar;


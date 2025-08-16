import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null },
    { id: 'students', icon: Users, label: 'Students', badge: '24' },
    { id: 'courses', icon: BookOpen, label: 'Courses', badge: null },
    { id: 'enrollment', icon: GraduationCap, label: 'Enrollment', badge: '5' },
    { id: 'schedule', icon: Calendar, label: 'Schedule', badge: null },
    { id: 'reports', icon: BarChart3, label: 'Reports', badge: null },
    { id: 'documents', icon: FileText, label: 'Documents', badge: null },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: '12' },
    { id: 'settings', icon: Settings, label: 'Settings', badge: null },
  ];

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
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-[var(--dominant-red)]" />
                </div>
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
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 liquid-morph group ${
                isActive 
                  ? 'bg-white text-[var(--dominant-red)] shadow-lg' 
                  : 'text-white hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[var(--dominant-red)]' : 'text-white'}`} />
              
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
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isActive 
                          ? 'bg-[var(--dominant-red)] text-white' 
                          : 'bg-white/20 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
              <p className="text-xs text-white/70">Version 2.1.0</p>
              <p className="text-xs text-white/50">© 2024 EduEnroll</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Sidebar;


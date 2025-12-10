import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, BookOpen, Calendar, Settings, ChevronLeft, ChevronRight,
  GraduationCap, FileText, BarChart3, User, CreditCard, BookUser,
  BookMarked, ClipboardList, CheckCircle, Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import VipcLogo from '/circlelogo.png';
// Import the API
import { enrollmentAPI } from '../../services/api';

const Sidebar = ({ isCollapsed, setIsCollapsed, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');
  
  // State for the dynamic badge
  const [enrollmentCount, setEnrollmentCount] = useState(0);

  // Fetch enrollment count on mount and interval
  useEffect(() => {
    const fetchCount = async () => {
      // Only fetch if user has a role that manages enrollment
      if (['Admin', 'Program Head', 'Registrar', 'Cashier'].includes(user?.role)) {
        try {
          const data = await enrollmentAPI.getPendingCount();
          if (data && typeof data.count !== 'undefined') {
            setEnrollmentCount(data.count);
          }
        } catch (error) {
          console.error("Error fetching badge count:", error);
        }
      }
    };

    fetchCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Admin and Staff Menu - REMOVED STATIC BADGES HERE
  const adminMenuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null, path: '/dashboard' },
    { id: 'students', icon: Users, label: 'Students', badge: null, path: '/students' }, 
    { id: 'courses', icon: BookOpen, label: 'Courses', badge: null, path: '/courses' },
    { id: 'enrollment', icon: GraduationCap, label: 'Enrollment', badge: null, path: '/enrollment' }, // Dynamic badge
    { id: 'termpayment', icon: Receipt, label: 'Term Payment', badge: null, path: '/term-payment' }, 
    { id: 'schedule', icon: Calendar, label: 'Add/Drop Subjects', badge: null, path: '/addingdroppingsubjects' },
    { id: 'shiftee', icon: FileText, label: 'Shiftee', badge: null, path: '/shiftee' },
    { id: 'facultyadminstaff', icon: User, label: 'Faculty & Admin Staff', badge: null, path: '/facultyadminstaff' },
    { id: 'grades', icon: BarChart3, label: 'Grades', badge: null, path: '/grades' }, 
    { id: 'id-releasing', icon: CreditCard, label: 'ID Releasing', badge: null, path: '/id-releasing' },
    { id: 'settings', icon: Settings, label: 'Settings', badge: null, path: '/settings' },
  ];

  const instructorMenuItems = [
    { id: 'class-roster', icon: BookUser, label: 'Class Roster', badge: null, path: '/class-roster' },
    { id: 'schedule', icon: Calendar, label: 'Schedule', badge: null, path: '/schedule' },
    { id: 'student-grades', icon: BarChart3, label: 'Student Grades', badge: null, path: '/student-grades' },
    { id: 'settings', icon: Settings, label: 'Settings', badge: null, path: '/settings' },
  ];

  const studentMenuItems = [
    { id: 'subject-enrolled', icon: BookMarked, label: 'Subject Enrolled', badge: null, path: '/subject-enrolled' },
    { id: 'my-schedule', icon: Calendar, label: 'My Schedule', path: '/my-schedule' },
    { id: 'my-grades', icon: BarChart3, label: 'My Grades', badge: null, path: '/my-grades' },
    { id: 'my-payments', icon: Receipt, label: 'My Payments', path: '/my-payments' },
    { id: 'evaluation-records', icon: ClipboardList, label: 'Evaluation Records', path: '/evaluation-records' },
    { id: 'enrollment-eligibility', icon: CheckCircle, label: 'Enrollment Eligibility', path: '/enrollment-eligibility' },
    { id: 'settings', icon: Settings, label: 'Settings', badge: null, path: '/settings' },
  ];

  const getMenuItems = () => {
    const role = user?.role;
    let items = [];

    switch (role) {
      case 'instructor':
        items = instructorMenuItems;
        break;
      case 'Student':
        items = studentMenuItems;
        break;
      case 'Admin':
        items = adminMenuItems;
        break;
      case 'Program Head':
      case 'Registrar': {
        const hiddenItems = ['grades', 'id-releasing', 'facultyadminstaff', 'courses', 'termpayment'];
        items = adminMenuItems.filter(item => !hiddenItems.includes(item.id));
        break;
      }
      case 'Cashier': {
        const allowedItems = ['dashboard', 'enrollment', 'termpayment', 'schedule', 'shiftee', 'id-releasing', 'settings'];
        items = adminMenuItems.filter(item => allowedItems.includes(item.id));
        break;
      }
      default:
        items = adminMenuItems;
    }

    // Inject dynamic badge for enrollment
    return items.map(item => {
      if (item.id === 'enrollment' && enrollmentCount > 0) {
        return { ...item, badge: enrollmentCount.toString() };
      }
      return item;
    });
  };

  const menuItems = getMenuItems();

  useEffect(() => {
    const currentPath = location.pathname;
    
    if (user?.role === 'instructor' && (currentPath === '/' || currentPath === '/dashboard')) {
        navigate('/class-roster', { replace: true });
    } else if (user?.role === 'Student' && (currentPath === '/' || currentPath === '/dashboard')) {
        navigate('/subject-enrolled', { replace: true });
    }

    const currentItem = menuItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [location.pathname, user, navigate]); 

  const handleNavigation = (item) => {
    setActiveItem(item.id);
    navigate(item.path);
    
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  const sidebarVariants = {
    expanded: { width: '16rem', transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
    collapsed: { width: '4rem', transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.1 } },
    collapsed: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  const navigationVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
    tap: { scale: 0.98, transition: { duration: 0.1, ease: [0.23, 1, 0.32, 1] } }
  };

  const getPortalName = () => {
      switch (user?.role) {
          case 'instructor': return 'Instructor Portal';
          case 'Student': return 'Student Portal';
          case 'Admin': return 'Admin Portal';
          case 'Program Head': return 'Program Head Portal';
          case 'Registrar': return 'Registrar Portal';
          case 'Cashier': return 'Cashier Portal';
          default: return 'Enrollment System';
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
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-0.5 overflow-hidden" 
                            whileHover={{ rotate: 5, scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                        >
                            <img 
                                src={VipcLogo} 
                                alt="VIPC Logo" 
                                className="w-full h-full object-contain"
                            />
                        </motion.div>
                        <div>
                            <h1 className="text-lg font-bold text-white">VIPC Enroll</h1>
                            <p className="text-xs text-white/70">
                                {getPortalName()}
                            </p>
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
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
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
              className={`w-full flex items-center cursor-pointer space-x-3 px-3 py-3 rounded-xl transition-all duration-300 liquid-morph group relative ${
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
                transition: { duration: 0.4, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }
              }}
            >
              {isActive && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--dominant-red)] rounded-r-full"
                  layoutId="activeIndicator"
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                />
              )}
              
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, rotate: isActive ? 5 : 0 }}
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
                        className={`px-2 py-1 text-xs font-bold rounded-full ${
                          isActive 
                            ? 'bg-[var(--dominant-red)] text-white' 
                            : 'bg-white text-[var(--dominant-red)]'
                        }`}
                        // Initial Scale
                        initial={{ scale: 0 }}
                        // Heartbeat Animation Loop
                        animate={{ 
                          scale: [1, 1.25, 1], // Scales up and back down
                        }}
                        transition={{ 
                          duration: 1.2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isCollapsed && (
                <motion.div
                  className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowDrap z-50"
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                >
                  {item.label}
                  {item.badge && (<span className="ml-2 px-1.5 py-0.5 bg-[var(--dominant-red)] rounded text-xs">{item.badge}</span>)}
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
              <p className="text-xs text-white/50">© 2025 VIPC Enroll</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Sidebar;
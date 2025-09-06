import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Header = ({ isCollapsed, setIsCollapsed, user, onLogout }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();

  // Page titles mapping
  const pageTitles = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back, Admin' },
    '/students': { title: 'Students', subtitle: 'Manage student information' },
    '/courses': { title: 'Courses', subtitle: 'Educational programs and curricula' },
    '/enrollment': { title: 'Enrollment', subtitle: 'Student registrations and applications' },
    '/schedule': { title: 'Schedule', subtitle: 'Class timetables and calendar' },
    '/reports': { title: 'Reports', subtitle: 'Analytics and performance insights' },
    '/documents': { title: 'Documents', subtitle: 'File management and storage' },
    '/notifications': { title: 'Notifications', subtitle: 'System alerts and messages' },
    '/settings': { title: 'Settings', subtitle: 'Account and system preferences' }
  };

  const currentPage = pageTitles[location.pathname] || pageTitles['/dashboard'];

  const headerVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const searchVariants = {
    focused: {
      scale: 1.02,
      boxShadow: '0 10px 30px rgba(156, 38, 44, 0.1)',
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    unfocused: {
      scale: 1,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const titleVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  return (
    <motion.header
      className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-l"
      variants={headerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden text-gray-600 hover:text-[var(--dominant-red)] liquid-button"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Page Title */}
        <div className="hidden lg:block">
          <motion.div
            key={location.pathname}
            variants={titleVariants}
            initial="initial"
            animate="animate"
          >
            <h2 className="text-xl font-bold heading-bold text-gray-900">
              {currentPage.title}
            </h2>
            <p className="text-sm text-gray-500">{currentPage.subtitle}</p>
          </motion.div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <motion.div
          className="relative"
          variants={searchVariants}
          animate={searchFocused ? 'focused' : 'unfocused'}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={`Search ${currentPage.title.toLowerCase()}...`}
            className="pl-10 pr-4 py-2 w-full border-gray-200 focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </motion.div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-[var(--dominant-red)] liquid-button"
          >
            <Sun className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Notifications */}
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-[var(--dominant-red)] liquid-button relative"
          >
            <Bell className="w-4 h-4" />
            <motion.span 
              className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--dominant-red)] rounded-full text-xs text-white flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              3
            </motion.span>
          </Button>
        </motion.div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-gray-50 liquid-button"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/api/placeholder/32/32" alt="Admin" />
                  <AvatarFallback className="bg-[var(--dominant-red)] text-white text-sm">
                    {user?.name?.charAt(0) || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'admin@eduenroll.com'}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 liquid-morph">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-red-50 text-red-600"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

export default Header;


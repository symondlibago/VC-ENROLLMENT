// src/components/layout/Header.jsx

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

  const pageTitles = {
    '/dashboard': { title: 'Dashboard', subtitle: `Welcome back, ${user?.name || 'Admin'}` },
    '/students': { title: 'Students', subtitle: 'Manage student information' },
    '/courses': { title: 'Courses', subtitle: 'Educational programs and curricula' },
    '/enrollment': { title: 'Enrollment', subtitle: 'Student registrations and applications' },
    '/addingdroppingsubjects': { title: 'Add/Drop Subjects', subtitle: 'Manage student subject enrollments' },
    '/shiftee': { title: 'Shiftee', subtitle: 'Manage shiftee information' },
    '/facultyadminstaff': { title: 'Faculty/Admin/Staff', subtitle: 'Manage faculty, admin, and staff information' },
    '/grades': { title: 'Grades', subtitle: 'Student grades and performance' },
    '/settings': { title: 'Settings', subtitle: 'Account and system preferences' },
    '/class-roster': { title: 'Class Roster', subtitle: 'View your students for this semester' },
    '/schedule': { title: 'My Schedule', subtitle: 'Your weekly teaching schedule' },
    '/subject-enrolled': { title: 'Enrolled Subjects', subtitle: 'Your class schedule for this semester' },
    '/my-grades': { title: 'My Grades', subtitle: 'Your student grades for this semester' },
    '/evaluation-records': { title: 'Evaluation Records', subtitle: 'Your evaluation records for this semester' },
    '/my-schedule': { title: 'My Schedule', subtitle: 'Your weekly schedule record for this semester' },
    '/enrollment-eligibility': { title: 'Enrollment Eligibility', subtitle: 'Check your status for the next academic term' },
    
  };

  const currentPage = pageTitles[location.pathname] || pageTitles['/dashboard'];

  const headerVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
  };

  const searchVariants = {
    focused: { scale: 1.02, boxShadow: '0 10px 30px rgba(156, 38, 44, 0.1)', transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
    unfocused: { scale: 1, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)', transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }
  };

  const titleVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
  };

  return (
    <motion.header
      className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-l"
      variants={headerVariants}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden text-gray-600 hover:text-[var(--dominant-red)] liquid-button"
        >
          <Menu className="w-5 h-5" />
        </Button>
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

      <div className="flex items-center space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="ghost" className="flex items-center space-x-2 liquid-button hover:bg-gray-100 hover:text-gray-900">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/api/placeholder/32/32" alt="Admin" />
                  <AvatarFallback className="bg-[var(--dominant-red)] text-white text-sm">
                    {user?.name?.charAt(0) || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@eduenroll.com'}</p>
                </div>
                <motion.div animate={{ rotate: 0 }} whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer transition-colors hover:bg-red-1800 focus:bg-red-800 hover:text-white">
              <User className="mr-2 h-4 w-4 hover:text-white" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer transition-colors hover:bg-red-1800 focus:bg-red-800 hover:text-white">
              <Settings className="mr-2 h-4 w-4 hover:text-white" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer transition-colors text-red-600 hover:bg-red-1800 focus:bg-red-800 hover:text-white"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4 hover:text-white" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

export default Header;

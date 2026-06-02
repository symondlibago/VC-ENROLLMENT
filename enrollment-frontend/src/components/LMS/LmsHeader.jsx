import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Menu, BookOpen, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const titleMap = {
  '/lms': { title: 'LMS Home', subtitle: 'Your learning dashboard' },
  '/lms/subjects': { title: 'Subjects', subtitle: 'Courses available in the LMS' },
  '/lms/submissions': { title: 'Submissions', subtitle: 'Review student assignment submissions' },
  '/lms/calendar': { title: 'Calendar', subtitle: 'Upcoming assignment deadlines' },
};

const LmsHeader = ({ isCollapsed, setIsCollapsed, user, onLogout }) => {
  const location = useLocation();
  let current = titleMap[location.pathname];
  if (!current) {
    if (location.pathname.startsWith('/lms/subjects/')) {
      current = { title: 'Subject Detail', subtitle: 'Modules and assignments' };
    } else if (location.pathname.startsWith('/lms')) {
      current = { title: 'LMS', subtitle: '' };
    } else {
      current = { title: 'LMS', subtitle: '' };
    }
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 0.5 } }}
      className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30"
    >
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden text-gray-600 hover:text-(--dominant-red)"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg bg-(--dominant-red) text-white flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{current.title}</h2>
            <p className="text-xs text-gray-500">{current.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-(--dominant-red) text-white text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-700 hover:bg-red-50 cursor-pointer"
          onClick={onLogout}
          title="Logout from LMS"
        >
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </Button>
      </div>
    </motion.header>
  );
};

export default LmsHeader;

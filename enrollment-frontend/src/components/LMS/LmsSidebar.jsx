import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Home, Layers, FileText, Inbox, Settings, ChevronLeft, ChevronRight, LogOut, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VipcLogo from '/circlelogo.png';

const LmsSidebar = ({ isCollapsed, setIsCollapsed, user, onExitLms }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (user?.lms_role || user?.role || '').toLowerCase();

  const baseItems = [
    { id: 'lms-home', icon: Home, label: 'LMS Home', path: '/lms' },
    { id: 'lms-subjects', icon: BookOpen, label: 'Subjects', path: '/lms/subjects' },
    { id: 'lms-calendar', icon: CalendarDays, label: 'Calendar', path: '/lms/calendar' },
  ];

  if (role === 'admin' || role === 'instructor') {
    baseItems.push({ id: 'lms-submissions', icon: Inbox, label: 'Submissions', path: '/lms/submissions' });
  }

  const items = baseItems;
  const isActive = (path) => location.pathname === path || (path !== '/lms' && location.pathname.startsWith(path));

  return (
    <motion.aside
      animate={{ width: isCollapsed ? '4rem' : '16rem' }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="h-screen bg-(--dominant-red) text-white flex flex-col shadow-xl"
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <img src={VipcLogo} alt="VIPC" className="w-8 h-8 rounded-full object-contain" />
          {!isCollapsed && (
            <div>
              <p className="text-sm font-bold leading-tight">VIPC LMS</p>
              <p className="text-[10px] uppercase tracking-wide opacity-80">Learning Hub</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 hover:text-white"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start space-x-3 px-4'} py-2.5 transition-all ${
                active ? 'bg-white text-(--dominant-red) font-semibold' : 'text-white/90 hover:bg-white/10'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-2">
        {!isCollapsed && (
          <div className="px-2">
            <p className="text-xs uppercase tracking-wider opacity-70">Signed in</p>
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[11px] opacity-80 truncate">{user?.email}</p>
            <p className="text-[10px] mt-1 inline-block bg-white/20 rounded px-1.5 py-0.5">{role}</p>
          </div>
        )}
        <button
          onClick={onExitLms}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start space-x-2 px-2'} py-2 text-white/90 hover:bg-white/10 rounded text-sm`}
          title="Exit LMS"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Exit LMS</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default LmsSidebar;

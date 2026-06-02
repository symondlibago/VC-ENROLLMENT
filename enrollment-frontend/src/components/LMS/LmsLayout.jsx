import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useNavigate } from 'react-router-dom';
import LmsSidebar from './LmsSidebar';
import LmsHeader from './LmsHeader';
import { lmsAuthAPI } from './api/lmsApi';

const LmsLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);
  const [user, setUser] = useState(lmsAuthAPI.getUser());
  const navigate = useNavigate();

  useEffect(() => {
    if (!lmsAuthAPI.isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }
    lmsAuthAPI.me().then((res) => {
      if (res?.success) setUser(res.data);
    }).catch(() => {
      lmsAuthAPI.logout().finally(() => navigate('/', { replace: true }));
    });
  }, [navigate]);

  const handleLogout = async () => {
    await lmsAuthAPI.logout();
    navigate('/', { replace: true });
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex bg-(--snowy-white)">
      <div className="hidden lg:block">
        <LmsSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          user={user}
          onExitLms={handleLogout}
        />
      </div>
      <div className="flex-1 flex flex-col min-h-screen">
        <LmsHeader
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          user={user}
          onLogout={handleLogout}
        />
        <motion.main
          className="flex-1 overflow-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
        >
          <Outlet context={{ user }} />
        </motion.main>
        <footer className="bg-white border-t border-gray-200 px-6 py-3 text-xs text-gray-500 flex justify-between">
          <span>© 2025 VIPC Enroll LMS</span>
          <span className="capitalize">{user?.lms_role || user?.role}</span>
        </footer>
      </div>
    </div>
  );
};

export default LmsLayout;

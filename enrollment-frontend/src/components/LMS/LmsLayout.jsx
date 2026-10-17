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

  /** Signs out of the LMS for good. */
  const handleLogout = async () => {
    await lmsAuthAPI.logout();
    navigate('/', { replace: true });
  };

  /**
   * "Exit LMS" goes back to the main portal — it is not a sign-out.
   *
   * Someone who entered the LMS from an existing session shares that session's
   * token, so logging out here revoked the token their portal was still using:
   * every request there then failed and the page reloaded on a loop. With a
   * main session we simply navigate; only an LMS-only session ends on the way
   * out, because there is nothing to go back to.
   */
  const handleExitLms = async () => {
    if (localStorage.getItem('auth_token')) {
      navigate('/dashboard', { replace: true });
      return;
    }

    await handleLogout();
  };

  return (
    <div className="min-h-screen flex bg-(--snowy-white)">
      <div className="hidden lg:block">
        <LmsSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          user={user}
          onExitLms={handleExitLms}
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

import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';


function Layout({ user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const navigate = useNavigate();

  
  const handleLogout = () => {
    onLogout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const checkSidebarState = () => {
      const sidebarElement = document.querySelector('.sidebar');
      setSidebarCollapsed(
        sidebarElement ? sidebarElement.classList.contains('collapsed') : true
      );
    };

    checkSidebarState();
    const observer = new MutationObserver(checkSidebarState);
    const sidebarElement = document.querySelector('.sidebar');
    if (sidebarElement) observer.observe(sidebarElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          collapsed={sidebarCollapsed}
          user={user}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-auto p-6 pt-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
import React, { useState } from 'react';
import { FaBell, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import Logo from "../assets/Logo_sin_fondo.png";


export default function Topbar({ collapsed, user, onLogout }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };

  return (
    <div className="bg-white text-black h-16 px-4 flex items-center justify-between shadow-md transition-all duration-300">
      <div className="flex items-center">
        <img src={Logo} alt="Logo" className="h-10" />
      </div>

      <div className="flex items-center space-x-6">
        {/* Notificaciones */}
        <div className="relative">
          <div className="cursor-pointer relative" onClick={toggleNotifications}>
            <FaBell className="text-gray-600 text-xl hover:text-blue-700" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              0
            </span>
          </div>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700">Notificaciones</h3>
              </div>
             
              <div className="p-2 text-center border-t border-gray-200">
                <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menú de usuario */}
        <div className="relative flex items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={toggleUserMenu}>
            <div className="flex flex-col items-end text-sm">
              <span className="font-medium text-blue-700">{user?.role?.name}</span>
              <span className="text-gray-500 text-xs">{user?.email}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center">
              <FaUserCircle className="text-gray-600 text-xl" />
            </div>
          </div>

          {showUserMenu && (
            <div className="absolute right-0 top-12 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={onLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <FaSignOutAlt className="mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarCheck, LogOut, X,
} from 'lucide-react';
import { SidebarBrand } from './AppLogo';
import { TEACHER_LOGIN } from '../utils/authRoutes';

const teacherNav = [
  { to: '/teacher', label: 'My Attendance', icon: CalendarCheck, end: true },
];

export default function TeacherSidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(TEACHER_LOGIN);
  }

  return (
    <div className="h-full bg-gradient-to-b from-green-600 to-emerald-700 text-white flex flex-col">
      {/* Logo */}
      <div className="min-h-16 flex items-center justify-between px-4 py-3 border-b border-green-500/30">
        <SidebarBrand panelLabel="Teacher Portal" />
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-green-500/30 rounded">
          <X size={18} />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-green-500/30 bg-green-500/20">
        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
        <p className="text-xs text-green-100 capitalize mt-1">Teacher</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {teacherNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
                  : 'text-green-100 hover:bg-green-500/30 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-green-500/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-100 hover:bg-red-600/30 hover:text-red-300 transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

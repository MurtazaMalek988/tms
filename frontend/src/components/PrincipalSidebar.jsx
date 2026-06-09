import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, BarChart2,
  Settings, LogOut, X, Umbrella,
} from 'lucide-react';
import { SidebarBrand } from './AppLogo';
import { ADMIN_LOGIN } from '../utils/authRoutes';

const adminNav = [
  { to: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/admin/teachers',   label: 'Teachers',   icon: Users },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/holidays',   label: 'Holidays',   icon: Umbrella },
  { to: '/admin/reports',    label: 'Reports',    icon: BarChart2 },
  { to: '/admin/settings',   label: 'Settings',   icon: Settings },
];

export default function PrincipalSidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(ADMIN_LOGIN);
  }

  return (
    <div className="h-full bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="min-h-16 flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <SidebarBrand panelLabel="Admin Panel" />
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-700 rounded">
          <X size={18} />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-700/50 bg-slate-700/30">
        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
        <p className="text-xs text-slate-300 capitalize mt-1">Administrator</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {adminNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

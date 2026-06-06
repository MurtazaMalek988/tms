import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, BarChart2,
  Settings, LogOut, X,
} from 'lucide-react';
import { SidebarBrand } from './AppLogo';
import { getLoginPath } from '../utils/authRoutes';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/teachers', label: 'Teachers', icon: Users },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const teacherNav = [
  { to: '/teacher', label: 'My Attendance', icon: CalendarCheck, end: true },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === 'principal' ? adminNav : teacherNav;

  function handleLogout() {
    logout();
    navigate(getLoginPath(user?.role));
  }

  return (
    <div className="h-full bg-slate-800 text-white flex flex-col">
      {/* Logo */}
      <div className="min-h-14 flex items-center justify-between px-4 py-2 border-b border-slate-700">
        <SidebarBrand />
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-700 rounded">
          <X size={18} />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-slate-700">
        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
        <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

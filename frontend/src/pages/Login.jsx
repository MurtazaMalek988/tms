import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { BrandHeader, SCHOOL_NAME } from '../components/AppLogo';
import { ADMIN_LOGIN, TEACHER_LOGIN, getLoginPath } from '../utils/authRoutes';

const portalConfig = {
  principal: {
    title: 'Admin Portal',
    subtitle: 'Sign in as administrator',
    gradient: 'from-slate-800 via-slate-700 to-blue-900',
    accent: 'blue',
    dashboard: '/admin',
    credentials: (
      <p className="text-xs text-blue-600 mt-1">Sign in with your administrator username and password.</p>
    ),
    otherLogin: { to: TEACHER_LOGIN, label: 'Teacher login' },
  },
  teacher: {
    title: 'Teacher Portal',
    subtitle: 'Sign in to your account',
    gradient: 'from-emerald-800 via-green-700 to-teal-900',
    accent: 'emerald',
    dashboard: '/teacher',
    credentials: (
      <p className="text-xs text-emerald-600 mt-1">Use the username and password provided by your administrator.</p>
    ),
    otherLogin: { to: ADMIN_LOGIN, label: 'Admin login' },
  },
};

export default function Login({ expectedRole = 'principal' }) {
  const config = portalConfig[expectedRole];
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password);
      if (user.role !== expectedRole) {
        logout();
        toast.error(
          expectedRole === 'principal'
            ? 'This account is not an administrator. Use the teacher login instead.'
            : 'This account is not a teacher. Use the admin login instead.'
        );
        navigate(getLoginPath(user.role));
        return;
      }
      toast.success(`Welcome, ${user.name}!`);
      navigate(config.dashboard);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const hintBg = expectedRole === 'principal' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100';
  const hintTitle = expectedRole === 'principal' ? 'text-blue-700' : 'text-emerald-700';
  const buttonClass = expectedRole === 'principal' ? 'btn-primary' : 'btn-primary bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <BrandHeader subtitle={config.title} className="mb-8" />

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{config.subtitle}</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={`${buttonClass} w-full py-2.5`} disabled={loading}>
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className={`mt-6 p-3 rounded-lg border ${hintBg}`}>
            <p className={`text-xs font-medium ${hintTitle}`}>
              {expectedRole === 'principal' ? 'Administrator access' : 'Need access?'}
            </p>
            {config.credentials}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
              <ArrowLeft size={14} />
              Home
            </Link>
            <Link to={config.otherLogin.to} className="text-gray-500 hover:text-gray-700">
              {config.otherLogin.label}
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          &copy; {new Date().getFullYear()} {SCHOOL_NAME}
        </p>
      </div>
    </div>
  );
}

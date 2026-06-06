import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, UserCircle } from 'lucide-react';
import { BrandHeader, SYSTEM_NAME } from '../components/AppLogo';
import { ADMIN_LOGIN, TEACHER_LOGIN } from '../utils/authRoutes';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <BrandHeader subtitle={SYSTEM_NAME} className="mb-10" size="xl" />

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to={ADMIN_LOGIN}
            className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-blue-500/20 transition-shadow group"
          >
            <Shield size={32} className="mx-auto text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-semibold text-gray-800">Admin Login</h2>
            <p className="text-sm text-gray-500 mt-1">Principal &amp; administrators</p>
          </Link>

          <Link
            to={TEACHER_LOGIN}
            className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-emerald-500/20 transition-shadow group"
          >
            <UserCircle size={32} className="mx-auto text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-semibold text-gray-800">Teacher Login</h2>
            <p className="text-sm text-gray-500 mt-1">Staff attendance portal</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

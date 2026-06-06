import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PrincipalLayout from './PrincipalLayout';
import TeacherLayout from './TeacherLayout';
import { getLoginPath } from '../utils/authRoutes';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to={getLoginPath(role)} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'principal' ? '/admin' : '/teacher'} replace />;
  }

  const Layout = user.role === 'principal' ? PrincipalLayout : TeacherLayout;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

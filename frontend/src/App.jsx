import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import { ADMIN_LOGIN, TEACHER_LOGIN } from './utils/authRoutes';
import TeacherDashboard from './pages/teacher/Dashboard';
import PrincipalDashboard from './pages/principal/Dashboard';
import Teachers from './pages/principal/Teachers';
import Attendance from './pages/principal/Attendance';
import Reports from './pages/principal/Reports';
import Settings from './pages/principal/Settings';

function AdminPathRedirect() {
  const { pathname, search } = useLocation();
  const target = pathname.replace(/^\/principal/, '/admin') || '/admin';
  return <Navigate to={`${target}${search}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path={ADMIN_LOGIN} element={<Login expectedRole="principal" />} />
          <Route path={TEACHER_LOGIN} element={<Login expectedRole="teacher" />} />
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Teacher routes */}
          <Route
            path="/teacher"
            element={<ProtectedRoute role="teacher" />}
          >
            <Route index element={<TeacherDashboard />} />
          </Route>

          {/* Admin routes (principal role) */}
          <Route
            path="/admin"
            element={<ProtectedRoute role="principal" />}
          >
            <Route index element={<PrincipalDashboard />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/principal/*" element={<AdminPathRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

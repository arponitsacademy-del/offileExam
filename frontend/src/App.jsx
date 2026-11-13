import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout & Protected Route
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import MobileScanner from './pages/scanner/MobileScanner';
import ScanHistory from './pages/scanner/ScanHistory';
import ManualReview from './pages/scanner/ManualReview';
import ExamList from './pages/exams/ExamList';
import ExamForm from './pages/exams/ExamForm';
import AnswerKeyEditor from './pages/exams/AnswerKeyEditor';
import OmrSheetGenerator from './pages/exams/OmrSheetGenerator';
import MeritList from './pages/results/MeritList';
import StudentList from './pages/students/StudentList';
import StudentForm from './pages/students/StudentForm';
import StudentDetail from './pages/students/StudentDetail';
import ClassManagement from './pages/academics/ClassManagement';
import TeacherManagement from './pages/teachers/TeacherManagement';
import StudentPortal from './pages/portal/StudentPortal';
import StudentResultDetail from './pages/portal/StudentResultDetail';
import UserProfile from './pages/profile/UserProfile';
import SystemSettings from './pages/settings/SystemSettings';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'student') return <Navigate to="/student-portal" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Routes (Wrapped in Layout Shell) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/scanner"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><MobileScanner /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/scanner/review/:id"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><ManualReview /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/scan-history"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><ScanHistory /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/exams"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><ExamList /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/exams/create"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><ExamForm /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/exams/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><ExamForm /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/exams/:id/answer-key"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><AnswerKeyEditor /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/exams/:id/sheets"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><OmrSheetGenerator /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/exams/sheets"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><OmrSheetGenerator /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/exams/:id/merit-list"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><MeritList /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><StudentList /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/students/create"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><StudentForm /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/students/:id"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><StudentDetail /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/students/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><StudentForm /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/academics/classes"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                  <Layout><ClassManagement /></Layout>
                </ProtectedRoute>
              }
            />

            {/* Super Admin Only Routes */}
            <Route
              path="/teachers"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <Layout><TeacherManagement /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <Layout><SystemSettings /></Layout>
                </ProtectedRoute>
              }
            />

            {/* Student Portal Routes */}
            <Route
              path="/student-portal"
              element={
                <ProtectedRoute allowedRoles={['student', 'super_admin', 'teacher']}>
                  <Layout><StudentPortal /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student-portal/results/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'super_admin', 'teacher']}>
                  <Layout><StudentResultDetail /></Layout>
                </ProtectedRoute>
              }
            />

            {/* Common User Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout><UserProfile /></Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

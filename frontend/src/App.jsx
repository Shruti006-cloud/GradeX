import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreateExamPage from './pages/CreateExamPage.jsx';
import ExamDetailPage from './pages/ExamDetailPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Teacher Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/new"
          element={
            <ProtectedRoute>
              <CreateExamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId"
          element={
            <ProtectedRoute>
              <ExamDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/students/:submissionId/review"
          element={
            <ProtectedRoute>
              <ReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/students/:submissionId/report"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

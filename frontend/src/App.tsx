import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { login, logout } from "./redux/slices/authSlice";
import { logoutUser, refreshSession } from "./services/authService";
import type {
  UserRole,
  AccountStatus,
} from "./redux/slices/authSlice";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentPreferences from "./pages/StudentPreferences";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminProfile from "./pages/AdminProfile";
import InstructorProfile from "./pages/InstructorProfile";
import ExamPage from "./pages/ExamPage";
import CreateExam from "./pages/CreateExam";
import EditExam from "./pages/EditExam";
import ForgotPassword from "./pages/ForgotPassword";
import QuestionBank from "./pages/QuestionBank";
import InstructorResults from "./pages/InstructorResults";
import InstructorResultsOverview from "./pages/InstructorResultsOverview";
import InstructorAttemptDetails from "./pages/InstructorAttemptDetails";
import InstructorStudents from "./pages/InstructorStudents";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: UserRole;
}

function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, sessionExpiresAt } = useAppSelector(
    (state) => state.auth
  );
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [restoring, setRestoring] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && user) {
      setRestoring(false);
      return;
    }

    let active = true;
    setRestoring(true);
    void refreshSession()
      .then((session) => {
        if (active) {
          dispatch(login({
            user: session.user,
            sessionExpiresAt: session.sessionExpiresAt,
          }));
        }
      })
      .catch(() => {
        if (active) dispatch(logout());
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;

    const remaining = sessionExpiresAt - Date.now();
    const expireSession = async () => {
      await logoutUser();
      dispatch(logout());
    };

    if (remaining <= 0) {
      void expireSession();
      return;
    }

    const timer = window.setTimeout(
      () => void expireSession(),
      remaining
    );
    return () => window.clearTimeout(timer);
  }, [dispatch, isAuthenticated, sessionExpiresAt]);

  if (restoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Restoring your secure session...</p>
      </div>
    );
  }

  // User is not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // User has the wrong role
  if (user.role !== allowedRole) {
    if (user.role === "student") {
      return <Navigate to="/student" replace />;
    }

    if (user.role === "instructor") {
      return <Navigate to="/instructor" replace />;
    }

    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/" replace />;
  }

  // Only approved accounts can access protected pages
  const accountStatus: AccountStatus = user.accountStatus;

  if (accountStatus !== "approved") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* Registration */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Forgot Password */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* =========================
            STUDENT ROUTES
           ========================= */}

        {/* Student Dashboard */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Profile */}
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        {/* Student Exam Attempt */}
        <Route
          path="/exam/:attemptId"
          element={
            <ProtectedRoute allowedRole="student">
              <ExamPage />
            </ProtectedRoute>
          }
        />

        {/* =========================
            INSTRUCTOR ROUTES
           ========================= */}

        {/* Instructor Dashboard */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Instructor Profile */}
        <Route
          path="/instructor/profile"
          element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/preferences"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentPreferences />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/students"
          element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorStudents />
            </ProtectedRoute>
          }
        />

        {/* Create New Exam */}
        <Route
          path="/instructor/exams/create"
          element={
            <ProtectedRoute allowedRole="instructor">
              <CreateExam />
            </ProtectedRoute>
          }
        />

        {/* Manage / Edit Exam */}
        <Route
          path="/instructor/exams/:examId/edit"
          element={
            <ProtectedRoute allowedRole="instructor">
              <EditExam />
            </ProtectedRoute>
          }
        />

        {/* Instructor Question Bank */}
        <Route
          path="/instructor/exams/:examId/questions"
          element={
            <ProtectedRoute allowedRole="instructor">
              <QuestionBank />
            </ProtectedRoute>
          }
        />

        {/* Instructor Results */}
        <Route
          path="/instructor/results"
          element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorResultsOverview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/exams/:examId/results"
          element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorResults />
            </ProtectedRoute>
          }
        />

        {/* Instructor Attempt Details */}
        <Route
          path="/instructor/attempts/:attemptId"
          element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorAttemptDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

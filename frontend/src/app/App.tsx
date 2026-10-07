import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { login, logout } from "../redux/slices/authSlice";
import { logoutUser, refreshSession } from "../services/authService";
import type {
  UserRole,
  AccountStatus,
} from "../redux/slices/authSlice";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import StudentDashboard from "../features/student/pages/StudentDashboard";
import StudentProfile from "../features/student/pages/StudentProfile";
import StudentPreferences from "../features/student/pages/StudentPreferences";
import InstructorDashboard from "../features/instructor/pages/InstructorDashboard";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AdminStudents from "../features/admin/pages/AdminStudents";
import AdminProfile from "../features/admin/pages/AdminProfile";
import InstructorProfile from "../features/instructor/pages/InstructorProfile";
import ExamPage from "../features/exam/pages/ExamPage";
import CreateExam from "../features/exam/pages/CreateExam";
import EditExam from "../features/exam/pages/EditExam";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import QuestionBank from "../features/exam/pages/QuestionBank";
import InstructorResults from "../features/instructor/pages/InstructorResults";
import InstructorResultsOverview from "../features/instructor/pages/InstructorResultsOverview";
import InstructorAttemptDetails from "../features/instructor/pages/InstructorAttemptDetails";
import InstructorStudents from "../features/instructor/pages/InstructorStudents";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: UserRole;
}

// ProtectedRoute component
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
  const [restoreError, setRestoreError] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      setRestoring(false);
      setRestoreError("");
      return;
    }

    let active = true;
    setRestoring(true);
    setRestoreError("");
    void refreshSession()
      .then((session) => {
        if (active) {
          dispatch(login({
            user: session.user,
            sessionExpiresAt: session.sessionExpiresAt,
          }));
        }
      })
      .catch((error: Error & { status?: number }) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          dispatch(logout());
        } else {
          setRestoreError("ExamForge could not verify your saved session. Check your connection and try again; your session has not been cleared.");
        }
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, isAuthenticated, user, restoreAttempt]);

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;

    const remaining = sessionExpiresAt - Date.now();
    const expireSession = async () => {
      dispatch(logout());
      await logoutUser();
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

  if (!isAuthenticated && restoreError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-extrabold text-slate-900">Session check paused</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{restoreError}</p>
          <button type="button" onClick={() => setRestoreAttempt((count) => count + 1)} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">Try again</button>
        </section>
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

// App component
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

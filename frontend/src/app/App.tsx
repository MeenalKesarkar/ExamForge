import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const Login = lazy(() => import("../features/auth/pages/Login"));
const Register = lazy(() => import("../features/auth/pages/Register"));
const ForgotPassword = lazy(() => import("../features/auth/pages/ForgotPassword"));
const StudentDashboard = lazy(() => import("../features/student/pages/StudentDashboard"));
const StudentProfile = lazy(() => import("../features/student/pages/StudentProfile"));
const StudentPreferences = lazy(() => import("../features/student/pages/StudentPreferences"));
const InstructorDashboard = lazy(() => import("../features/instructor/pages/InstructorDashboard"));
const InstructorProfile = lazy(() => import("../features/instructor/pages/InstructorProfile"));
const InstructorStudents = lazy(() => import("../features/instructor/pages/InstructorStudents"));
const InstructorResults = lazy(() => import("../features/instructor/pages/InstructorResults"));
const InstructorResultsOverview = lazy(() => import("../features/instructor/pages/InstructorResultsOverview"));
const InstructorAttemptDetails = lazy(() => import("../features/instructor/pages/InstructorAttemptDetails"));
const AdminDashboard = lazy(() => import("../features/admin/pages/AdminDashboard"));
const AdminStudents = lazy(() => import("../features/admin/pages/AdminStudents"));
const AdminProfile = lazy(() => import("../features/admin/pages/AdminProfile"));
const ExamPage = lazy(() => import("../features/exam/pages/ExamPage"));
const CreateExam = lazy(() => import("../features/exam/pages/CreateExam"));
const EditExam = lazy(() => import("../features/exam/pages/EditExam"));
const QuestionBank = lazy(() => import("../features/exam/pages/QuestionBank"));

// App component
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div role="status" aria-live="polite">Loading…</div>}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

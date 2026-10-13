import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

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

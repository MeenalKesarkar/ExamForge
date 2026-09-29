import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import InstructorDashboard from "./pages/InstructorDashboard";
import ExamPage from "./pages/ExamPage";
import QuestionBank from "./pages/QuestionBank";
import ExamForm from "./pages/ExamForm";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute role="student">
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam/:attemptId"
          element={
            <ProtectedRoute role="student">
              <ExamPage />
            </ProtectedRoute>
          }
        />

        {/* Instructor */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/exams/create"
          element={
            <ProtectedRoute role="instructor">
              <ExamForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/exams/:examId/edit"
          element={
            <ProtectedRoute role="instructor">
              <ExamForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/exams/:examId/questions"
          element={
            <ProtectedRoute role="instructor">
              <QuestionBank />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
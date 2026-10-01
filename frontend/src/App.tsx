import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import InstructorDashboard from "./pages/InstructorDashboard";
import ExamPage from "./pages/ExamPage";
import CreateExam from "./pages/CreateExam";
import EditExam from "./pages/EditExam";
import ForgotPassword from "./pages/ForgotPassword";
import QuestionBank from "./pages/QuestionBank";
import InstructorResults from "./pages/InstructorResults";
import InstructorAttemptDetails from "./pages/InstructorAttemptDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Registration */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* Forgot Password */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Student Dashboard */}
        <Route
          path="/student"
          element={<StudentDashboard />}
        />

        {/* Student Profile */}
        <Route
          path="/student/profile"
          element={<StudentProfile />}
        />

        {/* Instructor Dashboard */}
        <Route
          path="/instructor"
          element={<InstructorDashboard />}
        />

        {/* Create New Exam */}
        <Route
          path="/instructor/exams/create"
          element={<CreateExam />}
        />

        {/* Manage / Edit Exam */}
        <Route
          path="/instructor/exams/:examId/edit"
          element={<EditExam />}
        />

        {/* Instructor Question Bank */}
        <Route
          path="/instructor/exams/:examId/questions"
          element={<QuestionBank />}
        />

        {/* Instructor Results */}
        <Route
          path="/instructor/exams/:examId/results"
          element={<InstructorResults />}
        />

        {/* Instructor Attempt Details */}
        <Route
          path="/instructor/attempts/:attemptId"
          element={<InstructorAttemptDetails />}
        />

        {/* Student Exam Attempt */}
        <Route
          path="/exam/:attemptId"
          element={<ExamPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

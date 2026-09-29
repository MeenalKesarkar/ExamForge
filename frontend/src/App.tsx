import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";

import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorResults from "./pages/InstructorResults";
import InstructorAttemptDetails from "./pages/InstructorAttemptDetails";

import ExamPage from "./pages/ExamPage";
import QuestionBank from "./pages/QuestionBank";

import CreateExam from "./pages/CreateExam";
 import EditExam from "./pages/EditExam"; 

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* =========================
            STUDENT ROUTES
        ========================== */}

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


        {/* =========================
            INSTRUCTOR DASHBOARD
        ========================== */}

        <Route
          path="/instructor"
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />


        {/* =========================
            CREATE EXAM
        ========================== */}

        <Route
          path="/instructor/exams/create"
          element={
            <ProtectedRoute role="instructor">
              <CreateExam />
            </ProtectedRoute>
          }
        />


        {/* =========================
            EDIT / MANAGE EXAM
        ========================== */}

         <Route
          path="/instructor/exams/:examId/edit"
          element={
            <ProtectedRoute role="instructor">
              <EditExam />
            </ProtectedRoute>
          }
        /> 


        {/* =========================
            QUESTION BANK
        ========================== */}

        <Route
          path="/instructor/exams/:examId/questions"
          element={
            <ProtectedRoute role="instructor">
              <QuestionBank />
            </ProtectedRoute>
          }
        />


        {/* =========================
            EXAM RESULTS
        ========================== */}

        <Route
          path="/instructor/exams/:examId/results"
          element={
            <ProtectedRoute role="instructor">
              <InstructorResults />
            </ProtectedRoute>
          }
        />


        {/* =========================
            INDIVIDUAL STUDENT
            ATTEMPT DETAILS
        ========================== */}

        <Route
          path="/instructor/attempts/:attemptId"
          element={
            <ProtectedRoute role="instructor">
              <InstructorAttemptDetails />
            </ProtectedRoute>
          }
        />


        {/* =========================
            FALLBACK
        ========================== */}

        <Route
          path="*"
          element={<Login />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
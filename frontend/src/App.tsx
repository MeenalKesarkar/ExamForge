import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";

import InstructorDashboard from "./pages/InstructorDashboard";
import QuestionBank from "./pages/QuestionBank";

import ExamPage from "./pages/ExamPage";

// ======================================================
// TEMPORARY INSTRUCTOR SECTION PAGE
// ======================================================

function InstructorSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <span className="text-2xl font-black">
              E
            </span>
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            {title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {description}
          </p>

          <button
            type="button"
            onClick={() =>
              window.history.back()
            }
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// APP
// ======================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            AUTH
        ================================================= */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* =================================================
            STUDENT
        ================================================= */}

        <Route
          path="/student"
          element={<StudentDashboard />}
        />

        <Route
          path="/student/profile"
          element={<StudentProfile />}
        />

        {/* =================================================
            STUDENT EXAM
        ================================================= */}

        <Route
          path="/exam/:attemptId"
          element={<ExamPage />}
        />

        {/* =================================================
            INSTRUCTOR DASHBOARD
        ================================================= */}

        <Route
          path="/instructor"
          element={<InstructorDashboard />}
        />

        {/* =================================================
            INSTRUCTOR EXAMS
        ================================================= */}

        <Route
          path="/instructor/exams"
          element={
            <InstructorSection
              title="Exam Management"
              description="The exam management workspace is coming next. This section will allow you to create, edit, publish, and manage your BCA examinations."
            />
          }
        />

        {/* =================================================
            CREATE EXAM
        ================================================= */}

        <Route
          path="/instructor/exams/create"
          element={
            <InstructorSection
              title="Create New Exam"
              description="The exam creation form is the next instructor module. It will contain exam details, BCA year, semester, subject, duration, question count, negative marking, and publishing controls."
            />
          }
        />

        {/* =================================================
            EDIT EXAM
        ================================================= */}

        <Route
          path="/instructor/exams/:examId/edit"
          element={
            <InstructorSection
              title="Manage Exam"
              description="The exam management page will allow you to edit exam settings, publish or unpublish the exam, and manage its configuration."
            />
          }
        />

        {/* =================================================
            QUESTION BANK
        ================================================= */}

        <Route
          path="/instructor/questions"
          element={
            <InstructorSection
              title="Question Bank"
              description="Use an exam-specific question bank to create and manage questions."
            />
          }
        />

        <Route
          path="/instructor/exams/:examId/questions"
          element={<QuestionBank />}
        />

        {/* =================================================
            STUDENTS
        ================================================= */}

        <Route
          path="/instructor/students"
          element={
            <InstructorSection
              title="Student Management"
              description="This section will allow instructors to view and manage approved BCA students, including their year and semester."
            />
          }
        />

        {/* =================================================
            INSTRUCTOR PROFILE
        ================================================= */}

        <Route
          path="/instructor/profile"
          element={
            <InstructorSection
              title="Instructor Profile"
              description="Instructor profile management will be added here."
            />
          }
        />

        {/* =================================================
            ASSIGNMENTS
        ================================================= */}

        <Route
          path="/instructor/assignments"
          element={
            <InstructorSection
              title="Assignments"
              description="Assignment management will be added here when the assignment module is implemented."
            />
          }
        />

        {/* =================================================
            RESULTS
        ================================================= */}

        <Route
          path="/instructor/results"
          element={
            <InstructorSection
              title="Exam Results"
              description="The results module will show student attempts, scores, percentages, pass or fail status, and detailed answers."
            />
          }
        />

        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
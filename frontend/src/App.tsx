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
import ExamPage from "./pages/ExamPage";

// ======================================================
// APP
// ======================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================================================
            PUBLIC
        ================================================== */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />

        {/* ==================================================
            STUDENT
        ================================================== */}

        <Route
          path="/student"
          element={
            <StudentDashboard />
          }
        />

        <Route
          path="/student/profile"
          element={
            <StudentProfile />
          }
        />

        {/* ==================================================
            EXAM
        ================================================== */}

        <Route
          path="/exam/:attemptId"
          element={<ExamPage />}
        />

        {/* ==================================================
            INSTRUCTOR
        ================================================== */}

        <Route
          path="/instructor"
          element={
            <InstructorDashboard />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
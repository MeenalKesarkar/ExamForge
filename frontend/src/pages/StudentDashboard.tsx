import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppDispatch,
  useAppSelector,
} from "../redux/hooks";
import { logout } from "../redux/slices/authSlice";
import { logoutUser } from "../services/authService";
import type { Exam, FilterType, StudentResult } from "../features/student/types";
import StudentDashboardHeader from "../features/student/components/StudentDashboardHeader";
import StudentDashboardSummary from "../features/student/components/StudentDashboardSummary";
import StudentExamFeed from "../features/student/components/StudentExamFeed";
import StudentResultsSection from "../features/student/components/StudentResultsSection";
import StudentDashboardGuide from "../features/student/components/StudentDashboardGuide";
import LogoutConfirmation from "../features/student/components/LogoutConfirmation";
import StudentDashboardFooter from "../features/student/components/StudentDashboardFooter";
import { formatDateTime } from "../features/student/formatDateTime";
import { API_URL } from "../apiConfig";



function StudentDashboard() {
  const user = useAppSelector(
    (state) => state.auth.user
  );

  const dispatch =
    useAppDispatch();

  const navigate =
    useNavigate();

  const [exams, setExams] =
    useState<Exam[]>([]);

  const [results, setResults] =
    useState<StudentResult[]>([]);

  const [resultsLoading, setResultsLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>(() => {
      const savedPreference = localStorage.getItem("examforge:student-exam-filter");
      return savedPreference === "negative" || savedPreference === "no-negative"
        ? savedPreference
        : "all";
    });

  const [
    startingExamId,
    setStartingExamId,
  ] =
    useState<string | null>(
      null
    );

  const [
    isProfileOpen,
    setIsProfileOpen,
  ] =
    useState(false);

  const [
    isNotificationsOpen,
    setIsNotificationsOpen,
  ] =
    useState(false);

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] =
    useState(false);

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] =
    useState(false);

  // ======================================================
  // Fetch published exams
  // ======================================================

  useEffect(() => {
    const fetchPublishedExams =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/exams/published`,
              {
                credentials:
                  "include",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to fetch exams"
            );
          }

          setExams(data);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Something went wrong";

          setError(message);
        } finally {
          setLoading(false);
        }
      };

    fetchPublishedExams();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchResults = async () => {
      try {
        const response = await fetch(
          `${API_URL}/attempts/student/results`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }

        const data = await response.json();
        if (isMounted && Array.isArray(data)) {
          setResults(data);
        }
      } catch (err) {
        console.error("Fetch student results error:", err);
      } finally {
        if (isMounted) setResultsLoading(false);
      }
    };

    void fetchResults();
    const refresh = window.setInterval(() => void fetchResults(), 60_000);

    return () => {
      isMounted = false;
      window.clearInterval(refresh);
    };
  }, []);

  // ======================================================
  // Filter exams
  // ======================================================

  const filteredExams =
    useMemo(() => {
      const searchText =
        search
          .toLowerCase()
          .trim();

      return exams.filter(
        (exam) => {
          const matchesSearch =
            exam.title
              .toLowerCase()
              .includes(
                searchText
              );

          const matchesFilter =
            filter === "all"
              ? true
              : filter ===
                  "negative"
                ? exam.negativeMarking
                : !exam.negativeMarking;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      exams,
      search,
      filter,
    ]);

  // ======================================================
  // Dashboard statistics
  // ======================================================

  const totalQuestions =
    exams.reduce(
      (total, exam) =>
        total +
        exam.questionCount,
      0
    );

  const timedExams =
    exams.filter(
      (exam) =>
        exam.duration > 0
    ).length;

  const totalAllowedAttempts =
    exams.reduce(
      (total, exam) =>
        total +
        (exam.allowedAttempts ||
          2),
      0
    );

  // ======================================================
  // Navigation helpers
  // ======================================================

  const scrollToSection = (
    id: string
  ) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });

    setIsMobileMenuOpen(
      false
    );

    setIsNotificationsOpen(
      false
    );

    setIsProfileOpen(false);
  };

  // ======================================================
  // Logout
  // ======================================================

  const handleConfirmLogout =
    () => {
      dispatch(logout());
      navigate("/", { replace: true });
      void logoutUser();
      setShowLogoutModal(false);
    };

  // ======================================================
  // Start exam
  // ======================================================

  const handleStartExam =
    async (
      examId: string
    ) => {
      if (!user?.id) {
        setError(
          "Student information not found. Please login again."
        );

        return;
      }

      try {
        setError("");
        setStartingExamId(
          examId
        );

        const response =
          await fetch(
            `${API_URL}/exams/${examId}/start`,
            {
              method: "POST",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                studentId:
                  user.id,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to start exam"
          );
        }

        navigate(
          `/exam/${data.attempt._id}`
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to start exam";

        setError(message);
      } finally {
        setStartingExamId(
          null
        );
      }
    };

  // ======================================================
  // Exam card accents
  // ======================================================

  const getExamAccent = (
    index: number
  ) => {
    const accents = [
      {
        background:
          "from-indigo-500 to-violet-600",
        light:
          "bg-indigo-50",
        text:
          "text-indigo-600",
      },
      {
        background:
          "from-blue-500 to-cyan-500",
        light:
          "bg-blue-50",
        text:
          "text-blue-600",
      },
      {
        background:
          "from-emerald-500 to-teal-500",
        light:
          "bg-emerald-50",
        text:
          "text-emerald-600",
      },
      {
        background:
          "from-orange-500 to-amber-500",
        light:
          "bg-orange-50",
        text:
          "text-orange-600",
      },
      {
        background:
          "from-pink-500 to-rose-500",
        light:
          "bg-pink-50",
        text:
          "text-pink-600",
      },
      {
        background:
          "from-purple-500 to-fuchsia-500",
        light:
          "bg-purple-50",
        text:
          "text-purple-600",
      },
    ];

    return accents[
      index % accents.length
    ];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentDashboardHeader
        user={user}
        exams={exams}
        isNotificationsOpen={isNotificationsOpen}
        setIsNotificationsOpen={setIsNotificationsOpen}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setShowLogoutModal={setShowLogoutModal}
        scrollToSection={scrollToSection}
        navigate={(path) => navigate(path)}
      />

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Hero */}

        <StudentDashboardSummary
          user={user}
          exams={exams}
          totalQuestions={totalQuestions}
          timedExams={timedExams}
          totalAllowedAttempts={totalAllowedAttempts}
          loading={loading}
          error={error}
          onExplore={() => scrollToSection("available-exams")}
        />

        {/* Available Exams */}


        <StudentExamFeed
          loading={loading}
          error={error}
          exams={exams}
          filteredExams={filteredExams}
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          startingExamId={startingExamId}
          getExamAccent={getExamAccent}
          onStartExam={(examId) => void handleStartExam(examId)}
          formatDateTime={formatDateTime}
        />



        <StudentResultsSection
          results={results}
          loading={resultsLoading}
          formatDateTime={formatDateTime}
        />

        {/* Exam guide */}

        <StudentDashboardGuide loading={loading} examCount={exams.length} />
      </main>

      {/* ==================================================
          LOGOUT CONFIRMATION MODAL
      ================================================== */}

      <LogoutConfirmation
        open={showLogoutModal}
        setOpen={setShowLogoutModal}
        onConfirm={handleConfirmLogout}
      />

      {/* Footer */}

      <StudentDashboardFooter />
    </div>
  );
}

export default StudentDashboard;

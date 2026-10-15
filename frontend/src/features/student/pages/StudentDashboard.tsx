import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import { logoutAndReload } from "../../../services/authService";
import type { Exam, FilterType, StudentResult } from "../types";
import StudentDashboardHeader from "../components/StudentDashboardHeader";
import StudentDashboardSummary from "../components/StudentDashboardSummary";
import StudentExamFeed from "../components/StudentExamFeed";
import StudentResultsSection from "../components/StudentResultsSection";
import StudentDashboardGuide from "../components/StudentDashboardGuide";
import LogoutConfirmation from "../components/LogoutConfirmation";
import StudentDashboardFooter from "../components/StudentDashboardFooter";
import { formatDateTime } from "../formatDateTime";
import { API_URL } from "../../../config/apiConfig";



// StudentDashboard component
function StudentDashboard() {
  const user = useAppSelector(
    (state) => state.auth.user
  );

  const navigate =
    useNavigate();

  const [exams, setExams] =
    useState<Exam[]>([]);

  const [results, setResults] =
    useState<StudentResult[]>([]);

  const [resultsLoading, setResultsLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [hasExploredDashboard, setHasExploredDashboard] = useState(false);

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
    const onScroll = () => {
      if (window.scrollY > 0) setHasExploredDashboard(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!hasExploredDashboard) return;
    const section = document.getElementById("available-exams");
    if (!section) return;
    const controller = new AbortController();
    let requested = false;
    const observer = new IntersectionObserver((entries) => {
      if (requested || !entries.some((entry) => entry.isIntersecting)) return;
      requested = true;
      void (async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/exams/published`,
              {
                credentials:
                  "include",
                signal: controller.signal,
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

          if (!controller.signal.aborted) setExams(data);
        } catch (err) {
          if (controller.signal.aborted) return;
          const message =
            err instanceof Error
              ? err.message
              : "Something went wrong";

          setError(message);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
      observer.disconnect();
    }, { threshold: 0.1 });
    observer.observe(section);
    return () => { observer.disconnect(); controller.abort(); };
  }, [hasExploredDashboard]);

  useEffect(() => {
    if (!hasExploredDashboard) return;
    const section = document.getElementById("student-results");
    if (!section) return;
    const controller = new AbortController();
    let requested = false;
    const observer = new IntersectionObserver((entries) => {
      if (requested || !entries.some((entry) => entry.isIntersecting)) return;
      requested = true;
      void (async () => {
        try {
          setResultsLoading(true);
          const response = await fetch(`${API_URL}/attempts/student/results`, {
            credentials: "include",
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Failed to fetch results");
          const data = await response.json();
          if (!controller.signal.aborted && Array.isArray(data)) setResults(data);
        } catch (err) {
          if (!controller.signal.aborted) console.error("Fetch student results error:", err);
        } finally {
          if (!controller.signal.aborted) setResultsLoading(false);
        }
      })();
      observer.disconnect();
    }, { threshold: 0.1 });
    observer.observe(section);
    return () => { observer.disconnect(); controller.abort(); };
  }, [hasExploredDashboard]);

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
    exams.length;

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
      setShowLogoutModal(false);
      void logoutAndReload();
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

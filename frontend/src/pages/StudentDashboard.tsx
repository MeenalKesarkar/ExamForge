import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  ChevronDown,
  CircleCheck,
  Clock3,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MinusCircle,
  Play,
  Search,
  Settings,
  Sparkles,
  Timer,
  Trophy,
  User,
  X,
} from "lucide-react";

import {
  useAppDispatch,
  useAppSelector,
} from "../redux/hooks";
import { logout } from "../redux/slices/authSlice";
import { logoutUser } from "../services/authService";

interface Exam {
  _id: string;
  title: string;
  duration: number;
  questionCount: number;
  negativeMarking: boolean;
  negativePenalty: number;
  allowedAttempts: number;

  startDate?: string | null;
  endDate?: string | null;

  availabilityStatus?:
    | "UPCOMING"
    | "ACTIVE"
    | "EXPIRED";
}

type FilterType =
  | "all"
  | "negative"
  | "no-negative";

const API_URL =
  "http://localhost:5000/api";

const formatDateTime = (
  value?: string | null
) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};

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

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("all");

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
    async () => {
      try {
        await logoutUser();
      } catch (logoutError) {
        console.error(
          "Logout error:",
          logoutError
        );
      } finally {
        dispatch(logout());
        navigate("/");
      }
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
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[76px] items-center justify-between">
            {/* Logo */}

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "dashboard-overview"
                )
              }
              className="group flex items-center gap-3"
            >
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 shadow-lg shadow-indigo-200 transition duration-300 group-hover:scale-105">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>

                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                </span>
              </div>

              <div className="hidden text-left sm:block">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  Exam
                  <span className="text-indigo-600">
                    Forge
                  </span>
                </h1>

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Online Examination
                  Platform
                </p>
              </div>
            </button>

            {/* Desktop navigation */}

            <nav className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "dashboard-overview"
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-100"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "available-exams"
                  )
                }
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <BookOpen className="h-4 w-4" />
                Available Exams
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "exam-guide"
                  )
                }
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Trophy className="h-4 w-4" />
                Exam Guide
              </button>
            </nav>

            {/* Right side */}

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Search */}

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "available-exams"
                  )
                }
                className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 sm:flex"
                title="Search exams"
              >
                <Search className="h-[19px] w-[19px]" />
              </button>

              {/* Notifications */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(
                      (value) =>
                        !value
                    );

                    setIsProfileOpen(
                      false
                    );
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
                  title="Notifications"
                >
                  <Bell className="h-[19px] w-[19px]" />

                  {exams.length >
                    0 && (
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-12 w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Notifications
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Your latest
                          ExamForge
                          updates
                        </p>
                      </div>

                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-indigo-600">
                        {exams.length >
                        0
                          ? "New"
                          : "Clear"}
                      </span>
                    </div>

                    <div className="p-3">
                      {exams.length >
                      0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              scrollToSection(
                                "available-exams"
                              )
                            }
                            className="flex w-full gap-3 rounded-xl bg-indigo-50/80 p-3 text-left transition hover:bg-indigo-100"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                              <BookOpen className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {
                                  exams.length
                                }{" "}
                                exam
                                {exams.length !==
                                1
                                  ? "s"
                                  : ""}{" "}
                                available
                              </p>

                              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                Open the
                                exam list
                                to explore
                                your
                                assessments.
                              </p>
                            </div>
                          </button>

                          <div className="mt-2 flex gap-3 rounded-xl p-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                              <Clock3 className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                Server-controlled
                                timer
                              </p>

                              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                Exam time
                                is managed
                                by the
                                ExamForge
                                server.
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-5 text-center">
                          <Bell className="mx-auto h-7 w-7 text-slate-300" />

                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            No new
                            notifications
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              {/* Profile */}

              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(
                      (value) =>
                        !value
                    );

                    setIsNotificationsOpen(
                      false
                    );
                  }}
                  className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-extrabold text-white shadow-md shadow-indigo-100">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user?.name || "Student"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user?.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                      "S"
                    )}
                  </div>

                  <div className="hidden text-left xl:block">
                    <p className="max-w-[130px] truncate text-sm font-bold text-slate-800">
                      {user?.name ||
                        "Student"}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      <span className="text-[11px] font-medium text-slate-400">
                        Student
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    className={`hidden h-4 w-4 text-slate-400 transition xl:block ${
                      isProfileOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/20 text-lg font-bold backdrop-blur">
                          {user?.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user?.name || "Student"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            user?.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                            "S"
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {user?.name ||
                              "Student"}
                          </p>

                          <p className="truncate text-xs text-indigo-100">
                            {user?.email ||
                              "Student account"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate("/student/profile");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
                      >
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          Student Account
                        </span>
                      </button>

                      <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600">
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">
                          Exam preferences
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowLogoutModal(
                            true
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu */}

              <button
                type="button"
                onClick={() =>
                  setIsMobileMenuOpen(
                    (value) =>
                      !value
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile navigation */}

          {isMobileMenuOpen && (
            <div className="border-t border-slate-100 py-3 lg:hidden">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "dashboard-overview"
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-indigo-600 hover:bg-indigo-50"
                >
                  <LayoutDashboard className="h-[18px] w-[18px]" />
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "available-exams"
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <BookOpen className="h-[18px] w-[18px]" />
                  Available Exams
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "exam-guide"
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Trophy className="h-[18px] w-[18px]" />
                  Exam Guide
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowLogoutModal(
                      true
                    )
                  }
                  className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-4 py-3 pt-4 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Hero */}

        <section
          id="dashboard-overview"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-7 py-9 text-white shadow-xl shadow-indigo-100 md:px-10 md:py-11"
        >
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-20 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Ready to learn?
            </div>

            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Welcome back,{" "}
              {user?.name?.split(
                " "
              )[0] ||
                "Student"}{" "}
              👋
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 md:text-base">
              Challenge yourself,
              test your knowledge
              and track your progress
              with ExamForge.
            </p>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "available-exams"
                )
              }
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              Explore Exams
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Stats */}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Available Exams
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {exams.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Questions Available
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalQuestions}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <FileQuestion className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Timed Exams
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {timedExams}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <Timer className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Attempt Capacity
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalAllowedAttempts}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </section>

        {/* Error */}

        {!loading &&
          error && (
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Something went
                  wrong
                </p>

                <p className="mt-1 text-sm">
                  {error}
                </p>
              </div>
            </div>
          )}

        {/* Available Exams */}

        <section
          id="available-exams"
          className="mt-10"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CircleCheck className="h-5 w-5 text-indigo-600" />

                <p className="text-sm font-semibold text-indigo-600">
                  Assess your skills
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Available Exams
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose an assessment
                and put your
                knowledge to the
                test.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search exams..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Filters */}

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              {
                value:
                  "all" as FilterType,
                label:
                  "All Exams",
              },
              {
                value:
                  "negative" as FilterType,
                label:
                  "Negative Marking",
              },
              {
                value:
                  "no-negative" as FilterType,
                label:
                  "No Negative Marking",
              },
            ].map(
              (item) => (
                <button
                  key={
                    item.value
                  }
                  type="button"
                  onClick={() =>
                    setFilter(
                      item.value
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter ===
                    item.value
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {
                    item.label
                  }
                </button>
              )
            )}
          </div>

          {/* Loading */}

          {loading && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[
                1,
                2,
                3,
                4,
                5,
                6,
              ].map(
                (item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="h-12 w-12 rounded-xl bg-slate-200" />

                    <div className="mt-5 h-6 w-3/4 rounded bg-slate-200" />

                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />

                    <div className="mt-7 space-y-3">
                      <div className="h-4 rounded bg-slate-100" />
                      <div className="h-4 rounded bg-slate-100" />
                      <div className="h-4 rounded bg-slate-100" />
                    </div>

                    <div className="mt-7 h-12 rounded-xl bg-slate-200" />
                  </div>
                )
              )}
            </div>
          )}

          {/* No exams */}

          {!loading &&
            !error &&
            exams.length ===
              0 && (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                  <BookOpen className="h-8 w-8 text-indigo-500" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  No exams
                  available
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  There are
                  currently no
                  published exams.
                  Check back
                  later for new
                  assessments.
                </p>
              </div>
            )}

          {/* No search results */}

          {!loading &&
            !error &&
            exams.length >
              0 &&
            filteredExams.length ===
              0 && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  No matching
                  exams
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try another
                  search term or
                  select a different
                  filter.
                </p>
              </div>
            )}

          {/* Exam cards */}

          {!loading &&
            !error &&
            filteredExams.length >
              0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredExams.map(
                  (
                    exam,
                    index
                  ) => {
                    const accent =
                      getExamAccent(
                        index
                      );

                    const isStarting =
                      startingExamId ===
                      exam._id;

                    const maxAttempts =
                      exam.allowedAttempts ||
                      2;

                    /*
                     * Server returns availabilityStatus.
                     *
                     * The fallback below is only used if
                     * the backend response does not contain
                     * the status.
                     */

                    const now =
                      Date.now();

                    const availabilityStatus =
                      exam.availabilityStatus ??
                      (
                        exam.startDate &&
                        now <
                          new Date(
                            exam.startDate
                          ).getTime()
                          ? "UPCOMING"
                          : exam.endDate &&
                              now >=
                                new Date(
                                  exam.endDate
                                ).getTime()
                            ? "EXPIRED"
                            : "ACTIVE"
                      );

                    const canStart =
                      availabilityStatus ===
                      "ACTIVE";

                    return (
                      <article
                        key={
                          exam._id
                        }
                        className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                      >
                        <div
                          className={`h-1.5 bg-gradient-to-r ${accent.background}`}
                        />

                        <div className="p-6">
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className={`flex h-13 w-13 items-center justify-center rounded-2xl ${accent.light}`}
                            >
                              <FileQuestion
                                className={`h-6 w-6 ${accent.text}`}
                              />
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  exam.negativeMarking
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {exam.negativeMarking
                                  ? "Negative Marking"
                                  : "No Penalty"}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  availabilityStatus ===
                                  "UPCOMING"
                                    ? "bg-blue-50 text-blue-700"
                                    : availabilityStatus ===
                                        "EXPIRED"
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {availabilityStatus ===
                                "UPCOMING"
                                  ? "Upcoming"
                                  : availabilityStatus ===
                                      "EXPIRED"
                                    ? "Expired"
                                    : "Active"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 min-h-[72px]">
                            <h3 className="text-xl font-bold leading-7 text-slate-900 transition group-hover:text-indigo-700">
                              {
                                exam.title
                              }
                            </h3>

                            <p className="mt-1 text-xs font-medium text-slate-400">
                              Online
                              Assessment
                            </p>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <div className="flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-indigo-500" />

                                <span className="text-xs font-medium text-slate-500">
                                  Duration
                                </span>
                              </div>

                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {
                                  exam.duration
                                }{" "}
                                min
                              </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                              <div className="flex items-center gap-2">
                                <FileQuestion className="h-4 w-4 text-blue-500" />

                                <span className="text-xs font-medium text-slate-500">
                                  Questions
                                </span>
                              </div>

                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {
                                  exam.questionCount
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <MinusCircle className="h-4 w-4 text-slate-400" />

                              <span className="text-xs font-medium text-slate-500">
                                Marking
                              </span>
                            </div>

                            <span className="text-right text-xs font-bold text-slate-700">
                              {exam.negativeMarking
                                ? `-${exam.negativePenalty} per wrong`
                                : "No negative marks"}
                            </span>
                          </div>

                          {/* =================================================
                              START DATE / DEADLINE
                          ================================================= */}

                          <div className="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                            {exam.startDate && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-medium text-slate-500">
                                  Starts
                                </span>

                                <span className="text-right text-xs font-bold text-slate-700">
                                  {formatDateTime(
                                    exam.startDate
                                  )}
                                </span>
                              </div>
                            )}

                            {exam.endDate && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-medium text-slate-500">
                                  Deadline
                                </span>

                                <span className="text-right text-xs font-bold text-slate-700">
                                  {formatDateTime(
                                    exam.endDate
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-indigo-500" />

                              <span className="text-xs font-medium text-slate-500">
                                Attempts
                                allowed
                              </span>
                            </div>

                            <span className="text-xs font-extrabold text-indigo-700">
                              {
                                maxAttempts
                              }{" "}
                              attempts
                            </span>
                          </div>

                          {/* =================================================
                              START BUTTON
                          ================================================= */}

                          <button
                            type="button"
                            disabled={
                              isStarting ||
                              !canStart
                            }
                            onClick={() =>
                              handleStartExam(
                                exam._id
                              )
                            }
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isStarting ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Starting...
                              </>
                            ) : availabilityStatus ===
                              "UPCOMING" ? (
                              <>
                                <Clock3 className="h-4 w-4" />
                                Starts Soon
                              </>
                            ) : availabilityStatus ===
                              "EXPIRED" ? (
                              <>
                                <CircleCheck className="h-4 w-4" />
                                Exam Expired
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 fill-current" />
                                Start Exam

                                <ArrowRight className="ml-auto h-4 w-4 transition group-hover:translate-x-1" />
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </section>

        {/* Exam guide */}

        {!loading &&
          exams.length > 0 && (
            <section
              id="exam-guide"
              className="mt-10 grid gap-5 md:grid-cols-2"
            >
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                    <Timer className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-indigo-950">
                      Keep an eye
                      on the timer
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-indigo-800/70">
                      Your exam time
                      is controlled
                      by the server.
                      Make sure you
                      submit your
                      answers before
                      the time
                      expires.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
                    <CircleCheck className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-emerald-950">
                      Your answers
                      are saved
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-emerald-800/70">
                      Answers are
                      progressively
                      saved while
                      you take an
                      exam, so you
                      can safely
                      continue if you
                      refresh the
                      page.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
      </main>

      {/* ==================================================
          LOGOUT CONFIRMATION MODAL
      ================================================== */}

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onClick={() =>
            setShowLogoutModal(
              false
            )
          }
          role="presentation"
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-7 text-white">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

              <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/5" />

              <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
                  <LogOut className="h-6 w-6" />
                </div>

                <div>
                  <h2
                    id="logout-title"
                    className="text-xl font-bold"
                  >
                    Ready to leave?
                  </h2>

                  <p className="mt-1 text-sm text-indigo-100">
                    You are about
                    to sign out of
                    ExamForge.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <p className="text-center text-sm leading-6 text-slate-500">
                Are you sure you
                want to logout?
                You will need to
                sign in again to
                access your exams
                and dashboard.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowLogoutModal(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                >
                  Stay Logged In
                </button>

                <button
                  type="button"
                  onClick={
                    handleConfirmLogout
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition-all hover:from-red-600 hover:to-rose-700 hover:shadow-xl active:scale-[0.98]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-sm text-slate-500 sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p>
            © 2026 ExamForge.
            Online Assessment
            Platform.
          </p>

          <p>
            Learn. Practice.
            Excel.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default StudentDashboard;
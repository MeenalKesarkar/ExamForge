import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";
import { useAppDispatch } from "../../../redux/hooks";
import { logout } from "../../../redux/slices/authSlice";
import { API_URL } from "../../../config/apiConfig";

// ======================================================
// CONFIG
// ======================================================

// ======================================================
// TYPES
// ======================================================

interface InstructorUser {
  id: string;
  _id?: string;

  name: string;
  email: string;

  role:
    | "student"
    | "instructor";

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  studentId?: string;

  phone?: string;
  city?: string;
  bio?: string;

  profilePicture?: string | null;
}

interface Exam {
  _id: string;

  title: string;

  subject?: string;

  degree?: string;

  yearOfStudy?: number;

  semester?: number;

  duration: number;

  questionCount: number;

  totalMarks?: number;

  passingMarks?: number;

  negativeMarking: boolean;

  negativePenalty: number;

  allowedAttempts?: number;

  published: boolean;

  startDate?: string;

  endDate?: string;

  createdAt?: string;
}

// ======================================================
// HELPERS
// ======================================================

const isExamExpired = (
  exam: Exam,
  currentTime: number
): boolean => Boolean(
  exam.published &&
  exam.endDate &&
  Date.parse(exam.endDate) <= currentTime
);

const getYearLabel = (
  year?: number
): string => {
  if (year === 1) {
    return "1st Year";
  }

  if (year === 2) {
    return "2nd Year";
  }

  if (year === 3) {
    return "3rd Year";
  }

  return "All Years";
};

const getSemesterLabel = (
  semester?: number
): string => {
  if (!semester) {
    return "All Semesters";
  }

  return `Semester ${semester}`;
};

// ======================================================
// COMPONENT
// ======================================================

// InstructorDashboard component
function InstructorDashboard() {
  const dispatch = useAppDispatch();
  const navigate =
    useNavigate();

  const [currentTime, setCurrentTime] =
    useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(
      () => setCurrentTime(Date.now()),
      30_000
    );

    return () => window.clearInterval(interval);
  }, []);

  // ====================================================
  // STATE
  // ====================================================

  const [user, setUser] =
    useState<InstructorUser | null>(
      null
    );

  const [exams, setExams] =
    useState<Exam[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | "published" | "draft"
  >("all");

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  // ====================================================
  // LOAD DASHBOARD
  // ====================================================

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          setLoading(true);

          setError("");

          // ------------------------------------------------
          // Load instructor profile
          // ------------------------------------------------

          const profileResponse =
            await fetch(
              `${API_URL}/profile/me`,
              {
                method: "GET",

                credentials:
                  "include",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          if (
            profileResponse.status ===
            401
          ) {
            navigate("/");

            return;
          }

          const profileData =
            await profileResponse.json();

          if (
            !profileResponse.ok
          ) {
            throw new Error(
              profileData?.message ||
                "Unable to load instructor profile"
            );
          }

          const profileUser =
            profileData?.user ||
            profileData;

          if (
            profileUser?.role &&
            profileUser.role !==
              "instructor"
          ) {
            navigate("/student");

            return;
          }

          setUser(
            profileUser as InstructorUser
          );

          // ------------------------------------------------
          // Load instructor exams
          // ------------------------------------------------

          const examResponse =
            await fetch(
              `${API_URL}/exams/instructor`,
              {
                method: "GET",

                credentials:
                  "include",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          if (
            examResponse.status ===
            401
          ) {
            navigate("/");

            return;
          }

          const examData =
            await examResponse.json();

          if (
            !examResponse.ok
          ) {
            throw new Error(
              examData?.message ||
                "Unable to load exams"
            );
          }

          const examList =
            Array.isArray(
              examData
            )
              ? examData
              : Array.isArray(
                    examData?.exams
                  )
                ? examData.exams
                : [];

          setExams(
            examList as Exam[]
          );
        } catch (err) {
          console.error(
            "Instructor dashboard error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load instructor dashboard."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadDashboard();
  }, [navigate]);

  // ====================================================
  // FILTER EXAMS
  // ====================================================

  const filteredExams =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return exams.filter(
        (exam) => {
          const matchesSearch =
            !query ||
            exam.title
              .toLowerCase()
              .includes(query) ||
            Boolean(
              exam.subject
                ?.toLowerCase()
                .includes(query)
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            (statusFilter ===
              "published" &&
              exam.published) ||
            (statusFilter ===
              "draft" &&
              !exam.published);

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      exams,
      search,
      statusFilter,
    ]);

  // ====================================================
  // STATS
  // ====================================================

  const publishedCount =
    exams.filter(
      (exam) =>
        exam.published
    ).length;

  const draftCount =
    exams.filter(
      (exam) =>
        !exam.published
    ).length;

  const totalQuestions =
    exams.reduce(
      (
        total,
        exam
      ) =>
        total +
        Number(
          exam.questionCount ||
            0
        ),
      0
    );

  // ====================================================
  // CREATE EXAM
  // ====================================================

  const handleCreateExam =
    () => {
      navigate(
        "/instructor/exams/create"
      );
    };

  // ====================================================
  // OPEN QUESTION BANK
  // ====================================================

  const handleQuestionBank =
    (
      examId: string
    ) => {
      navigate(
        `/instructor/exams/${examId}/questions`
      );
    };

  // ====================================================
  // MANAGE EXAM
  // ====================================================

  const handleManageExam =
    (
      examId: string
    ) => {
      navigate(
        `/instructor/exams/${examId}/edit`
      );
    };

  // ====================================================
  // VIEW RESULTS
  // ====================================================

  const handleViewResults =
    (
      examId: string
    ) => {
      navigate(
        `/instructor/exams/${examId}/results`
      );
    };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout =
    () => {
      setLoggingOut(true);
      dispatch(logout());
      navigate("/", { replace: true });
      void fetch(
          `${API_URL}/auth/logout`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              Accept:
                "application/json",
            },
          }
        ).catch((err) => console.error("Logout error:", err));
    };

  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-200">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>

          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading instructor
            workspace...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* BRAND */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/instructor"
              )
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-200">
              <BookOpen className="h-5 w-5 text-white" />
            </div>

            <div className="hidden text-left sm:block">
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Exam
                <span className="text-indigo-600">
                  Forge
                </span>
              </h1>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Instructor Portal
              </p>
            </div>
          </button>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-1 md:flex">

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600"
            >
              <LayoutDashboard className="h-4 w-4" />

              Dashboard
            </button>

            <button
              type="button"
              onClick={
                handleCreateExam
              }
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              <Plus className="h-4 w-4" />

              Create Exam
            </button>

            <button
              type="button"
              onClick={() => navigate("/instructor/students")}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              <Users className="h-4 w-4" />

              Students
            </button>
          </nav>

          {/* DESKTOP USER */}

          <div className="hidden items-center gap-3 md:flex">

            <button
              type="button"
              onClick={() =>
                navigate("/instructor/profile")
              }
              className="flex items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              title="Open instructor profile"
              aria-label="Open instructor profile"
            >

            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-black text-indigo-700">
              {user?.profilePicture ? (
                <img
                  src={
                    user.profilePicture
                  }
                  alt={
                    user.name
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name
                  ?.charAt(0)
                  .toUpperCase() ||
                "I"
              )}
            </div>

            <div className="hidden lg:block">
              <p className="text-sm font-bold text-slate-900">
                {user?.name ||
                  "Instructor"}
              </p>

              <p className="text-[11px] font-semibold text-slate-400">
                Instructor
              </p>
            </div>

            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              disabled={
                loggingOut
              }
              className="ml-2 rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              title="Logout"
            >
              {loggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (value) =>
                  !value
              )
            }
            className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* MOBILE NAV */}

        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
            <div className="space-y-2">

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-600"
              >
                <LayoutDashboard className="h-4 w-4" />

                Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(
                    false
                  );

                  handleCreateExam();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />

                Create Exam
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/instructor/students");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <Users className="h-4 w-4" />
                Students
              </button>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />

                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span className="leading-6">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Close error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 p-6 text-white shadow-xl shadow-indigo-200 sm:p-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

            <div className="max-w-2xl">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
                <Sparkles className="h-4 w-4" />

                Instructor Workspace
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Welcome back,{" "}
                {user?.name ||
                  "Instructor"}
                .
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                Create structured BCA
                assessments, manage question
                banks, assign exams to students,
                and review performance from one
                workspace.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    handleCreateExam
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />

                  Create New Exam
                </button>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "exam-list"
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <BookOpen className="h-4 w-4" />

                  Manage Exams
                </button>
              </div>
            </div>

            {/* SECURITY CARD */}

            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </div>

                <div>
                  <p className="text-sm font-extrabold">
                    Secure assessment
                    controls
                  </p>

                  <p className="mt-1 text-xs leading-5 text-indigo-100">
                    Server-side exam timing
                    and protected instructor
                    tools
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={
              <BookOpen className="h-5 w-5" />
            }
            label="Total Exams"
            value={
              exams.length
            }
            description="Created in your workspace"
          />

          <StatCard
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            label="Published"
            value={
              publishedCount
            }
            description="Available for students"
            positive
          />

          <StatCard
            icon={
              <FileQuestion className="h-5 w-5" />
            }
            label="Question Capacity"
            value={
              totalQuestions
            }
            description="Configured across exams"
          />

          <StatCard
            icon={
              <Users className="h-5 w-5" />
            }
            label="Draft Exams"
            value={
              draftCount
            }
            description="Still being prepared"
          />
        </section>

        {/* =================================================
            EXAM LIST
        ================================================= */}

        <section
          id="exam-list"
          className="mt-10"
        >

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">
                Assessment Manager
              </p>

              <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                Your Exams
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Manage exams and open their
                question banks.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleCreateExam
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />

              New Exam
            </button>
          </div>

          {/* SEARCH / FILTER */}

          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="grid gap-3 md:grid-cols-[1fr_180px]">

              <div className="relative">

                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search exams or subjects..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | "all"
                      | "published"
                      | "draft"
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="all">
                  All Exams
                </option>

                <option value="published">
                  Published
                </option>

                <option value="draft">
                  Drafts
                </option>
              </select>
            </div>
          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {filteredExams.length ===
          0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                <BookOpen className="h-7 w-7" />
              </div>

              <h4 className="mt-4 text-lg font-black text-slate-900">
                {exams.length ===
                0
                  ? "No exams yet"
                  : "No matching exams"}
              </h4>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {exams.length ===
                0
                  ? "Create your first BCA exam and then build its question bank."
                  : "Try changing your search or status filter."}
              </p>

              {exams.length ===
                0 && (
                <button
                  type="button"
                  onClick={
                    handleCreateExam
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />

                  Create First Exam
                </button>
              )}
            </div>
          ) : (
            /* =================================================
               EXAM CARDS
            ================================================= */

            <div className="grid gap-5 lg:grid-cols-2">

              {filteredExams.map(
                (
                  exam
                ) => (
                  <article
                    key={
                      exam._id
                    }
                    className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                  >

                    {/* CARD HEADER */}

                    <div className="border-b border-slate-100 p-5 sm:p-6">

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex min-w-0 items-start gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
                            <GraduationCap className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="truncate text-lg font-black text-slate-900">
                              {
                                exam.title
                              }
                            </h4>

                            <p className="mt-1 truncate text-sm font-medium text-slate-500">
                              {exam.subject ||
                                "BCA Assessment"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                            isExamExpired(exam, currentTime)
                              ? "bg-rose-50 text-rose-600"
                              : exam.published
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {isExamExpired(exam, currentTime)
                            ? "Expired"
                            : exam.published
                              ? "Published"
                              : "Draft"}
                        </span>
                      </div>

                      {/* ACADEMIC TAGS */}

                      <div className="mt-5 flex flex-wrap gap-2">

                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-600">
                          {exam.degree ||
                            "BCA"}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                          {getYearLabel(
                            exam.yearOfStudy
                          )}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                          {getSemesterLabel(
                            exam.semester
                          )}
                        </span>

                      </div>
                    </div>

                    {/* EXAM METRICS */}

                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">

                      <ExamMetric
                        icon={
                          <Clock3 className="h-4 w-4" />
                        }
                        value={`${exam.duration} min`}
                        label="Duration"
                      />

                      <ExamMetric
                        icon={
                          <FileQuestion className="h-4 w-4" />
                        }
                        value={
                          exam.questionCount
                        }
                        label="Questions"
                      />

                      <ExamMetric
                        icon={
                          <Users className="h-4 w-4" />
                        }
                        value={1}
                        label="Attempts"
                      />

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-col gap-2 p-5 sm:flex-row sm:p-6">

                      <button
                        type="button"
                        onClick={() =>
                          handleQuestionBank(
                            exam._id
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-100 transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <FileQuestion className="h-4 w-4" />

                        Question Bank

                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleViewResults(
                            exam._id
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                      >
                        <BarChart3 className="h-4 w-4" />

                        Results
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleManageExam(
                            exam._id
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Settings className="h-4 w-4" />

                        Manage
                      </button>

                    </div>
                  </article>
                )
              )}

            </div>
          )}
        </section>
      </main>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">

          <p>
            © 2026 ExamForge ·
            Instructor Portal
          </p>

          <p className="font-medium">
            Create. Assess. Understand.
          </p>

        </div>
      </footer>
    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

// StatCard component
function StatCard({
  icon,
  label,
  value,
  description,
  positive = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            positive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-indigo-50 text-indigo-600"
          }`}
        >
          {icon}
        </div>

        {positive && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-600">
            Active
          </span>
        )}

      </div>

      <p className="mt-5 text-2xl font-black tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ======================================================
// EXAM METRIC
// ======================================================

// ExamMetric component
function ExamMetric({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="px-3 py-4 text-center">

      <div className="flex items-center justify-center gap-1.5 text-indigo-500">
        {icon}

        <span className="text-sm font-black text-slate-800">
          {value}
        </span>
      </div>

      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

    </div>
  );
}

export default InstructorDashboard;

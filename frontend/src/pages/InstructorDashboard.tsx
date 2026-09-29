import { useEffect, useState } from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

// ======================================================
// CONFIG
// ======================================================

const API_URL = "http://localhost:5000/api";

// ======================================================
// TYPES
// ======================================================

interface InstructorUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor";

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  studentId?: string;

  phone?: string;
  city?: string;
  bio?: string;

  profilePicture?: string;
}

interface RootState {
  auth: {
    user: InstructorUser | null;
    isAuthenticated: boolean;
  };
}

interface DashboardExam {
  _id: string;
  title: string;
  duration: number;
  questionCount: number;

  totalMarks?: number;
  passingMarks?: number;

  negativeMarking: boolean;
  negativePenalty: number;

  allowedAttempts?: number;
  published?: boolean;

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  subject?: string;
}

// ======================================================
// HELPER - YEAR
// ======================================================

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

// ======================================================
// HELPER - SEMESTER
// ======================================================

const getSemesterLabel = (
  semester?: number
): string => {
  if (!semester) {
    return "All Semesters";
  }

  return `Semester ${semester}`;
};

// ======================================================
// HELPER - INITIALS
// ======================================================

const getInitials = (
  name?: string
): string => {
  if (!name?.trim()) {
    return "IN";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0)
    )
    .join("")
    .toUpperCase();
};

// ======================================================
// FALLBACK EXAMS
// ======================================================
//
// These are only used if the backend API does not
// return an exam list yet.
//
// No temporary file is created.
//

const demoExams: DashboardExam[] = [
  {
    _id: "demo-js",
    title: "JavaScript Fundamentals",
    duration: 40,
    questionCount: 25,
    totalMarks: 25,
    passingMarks: 13,
    negativeMarking: true,
    negativePenalty: 0.25,
    allowedAttempts: 2,
    published: true,
    degree: "BCA",
    yearOfStudy: 2,
    semester: 3,
    subject: "Web Development",
  },

  {
    _id: "demo-python",
    title: "Python Fundamentals",
    duration: 30,
    questionCount: 25,
    totalMarks: 25,
    passingMarks: 13,
    negativeMarking: false,
    negativePenalty: 0,
    allowedAttempts: 2,
    published: true,
    degree: "BCA",
    yearOfStudy: 1,
    semester: 2,
    subject: "Programming",
  },

  {
    _id: "demo-java",
    title: "Java Programming",
    duration: 30,
    questionCount: 25,
    totalMarks: 25,
    passingMarks: 13,
    negativeMarking: false,
    negativePenalty: 0,
    allowedAttempts: 2,
    published: true,
    degree: "BCA",
    yearOfStudy: 2,
    semester: 4,
    subject: "Object Oriented Programming",
  },

  {
    _id: "demo-sql",
    title: "SQL & Database Fundamentals",
    duration: 30,
    questionCount: 25,
    totalMarks: 25,
    passingMarks: 13,
    negativeMarking: false,
    negativePenalty: 0,
    allowedAttempts: 2,
    published: true,
    degree: "BCA",
    yearOfStudy: 3,
    semester: 5,
    subject: "Database Management",
  },
];

// ======================================================
// COMPONENT
// ======================================================

function InstructorDashboard() {
  const navigate = useNavigate();

  // ====================================================
  // REDUX
  // ====================================================
  //
  // We intentionally do NOT import:
  //
  // ../hooks
  // ../slices/authSlice
  //
  // This removes the two module errors shown in VS Code.
  //

  const dispatch = useDispatch();

  const user = useSelector(
    (state: RootState) =>
      state.auth.user
  );

  // ====================================================
  // STATE
  // ====================================================

  const [exams, setExams] =
    useState<DashboardExam[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  // ====================================================
  // LOAD PUBLISHED EXAMS
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const loadExams =
      async (): Promise<void> => {
        try {
          setLoading(true);

          const response =
            await fetch(
              `${API_URL}/exams/published`,
              {
                method: "GET",
                credentials: "include",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          if (!response.ok) {
            throw new Error(
              "Unable to load exams"
            );
          }

          const data =
            await response.json();

          if (cancelled) {
            return;
          }

          if (Array.isArray(data)) {
            setExams(data);
          } else {
            setExams([]);
          }
        } catch (error) {
          console.warn(
            "Instructor exam API unavailable:",
            error
          );

          if (!cancelled) {
            setExams(demoExams);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    void loadExams();

    return () => {
      cancelled = true;
    };
  }, []);

  // ====================================================
  // DISPLAY EXAMS
  // ====================================================

  const displayExams =
    exams.length > 0
      ? exams
      : demoExams;

  // ====================================================
  // SEARCH FILTER
  // ====================================================

  const filteredExams =
    displayExams.filter(
      (exam) => {
        const searchText =
          search
            .trim()
            .toLowerCase();

        if (!searchText) {
          return true;
        }

        return (
          exam.title
            .toLowerCase()
            .includes(searchText) ||
          exam.subject
            ?.toLowerCase()
            .includes(searchText) ||
          getYearLabel(
            exam.yearOfStudy
          )
            .toLowerCase()
            .includes(searchText)
        );
      }
    );

  // ====================================================
  // STATISTICS
  // ====================================================

  const publishedCount =
    displayExams.filter(
      (exam) =>
        exam.published !== false
    ).length;

  const draftCount =
    displayExams.filter(
      (exam) =>
        exam.published === false
    ).length;

  const totalQuestions =
    displayExams.reduce(
      (total, exam) =>
        total +
        exam.questionCount,
      0
    );

  const totalDuration =
    displayExams.reduce(
      (total, exam) =>
        total + exam.duration,
      0
    );

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout =
    async (): Promise<void> => {
      try {
        await fetch(
          `${API_URL}/auth/logout`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept:
                "application/json",
            },
          }
        );
      } catch {
        // Clear frontend state even if
        // backend logout request fails.
      }

      // We intentionally dispatch the action
      // directly instead of importing authSlice.
      dispatch({
        type: "auth/logout",
      });

      navigate("/");
    };

  // ====================================================
  // CREATE EXAM
  // ====================================================

  const handleCreateExam =
    (): void => {
      navigate(
        "/instructor/exams/new"
      );
    };

  // ====================================================
  // SIDEBAR
  // ====================================================

  const Sidebar = () => {
    return (
      <>
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="
              fixed
              inset-0
              z-40
              bg-slate-950/60
              backdrop-blur-sm
              lg:hidden
            "
          />
        )}

        <aside
          className={`
            fixed
            left-0
            top-0
            z-50
            flex
            h-screen
            w-[270px]
            flex-col
            border-r
            border-white/10
            bg-[#090d24]
            text-white
            shadow-2xl
            transition-transform
            duration-300
            lg:translate-x-0
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          {/* BRAND */}

          <div className="flex h-[84px] items-center border-b border-white/10 px-6">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  from-indigo-500
                  via-violet-600
                  to-fuchsia-600
                  shadow-lg
                  shadow-indigo-500/30
                "
              >
                <Sparkles
                  size={21}
                  strokeWidth={2.2}
                />
              </div>

              <div>
                <h1 className="text-[18px] font-extrabold tracking-tight">
                  ExamForge
                </h1>

                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-indigo-200/70">
                  Instructor Portal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(false)
              }
              className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={19} />
            </button>
          </div>

          {/* NAVIGATION */}

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>

            <nav className="space-y-1.5">
              {/* Dashboard */}

              <button
                type="button"
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  bg-gradient-to-r
                  from-indigo-600
                  to-violet-600
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-indigo-600/20
                "
              >
                <LayoutDashboard
                  size={18}
                />

                <span>
                  Dashboard
                </span>
              </button>

              {/* Exams */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/exams"
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:bg-white/8
                  hover:text-white
                "
              >
                <BookOpen size={18} />

                <span>Exams</span>
              </button>

              {/* Question Bank */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/questions"
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:bg-white/8
                  hover:text-white
                "
              >
                <FileQuestion
                  size={18}
                />

                <span>
                  Question Bank
                </span>
              </button>

              {/* Students */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/students"
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:bg-white/8
                  hover:text-white
                "
              >
                <Users size={18} />

                <span>
                  Students
                </span>
              </button>

              {/* Assignments */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/assignments"
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:bg-white/8
                  hover:text-white
                "
              >
                <Target size={18} />

                <span>
                  Assignments
                </span>
              </button>

              {/* Results */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/results"
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:bg-white/8
                  hover:text-white
                "
              >
                <BarChart3 size={18} />

                <span>
                  Results & Analytics
                </span>
              </button>
            </nav>

            <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Account
            </p>

            <nav className="space-y-1.5">
              {/* Profile */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/profile"
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:bg-white/8
                  hover:text-white
                "
              >
                <GraduationCap
                  size={18}
                />

                <span>
                  Instructor Profile
                </span>
              </button>

              {/* Settings */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/settings"
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:bg-white/8
                  hover:text-white
                "
              >
                <Settings size={18} />

                <span>
                  Settings
                </span>
              </button>
            </nav>
          </div>

          {/* SECURITY */}

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                  <ShieldCheck
                    size={17}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-white">
                    Secure workspace
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Instructor access is protected
                    by your authenticated session.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="
                mt-3
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-left
                text-sm
                font-medium
                text-slate-400
                transition
                hover:bg-red-500/10
                hover:text-red-300
              "
            >
              <LogOut size={18} />

              <span>
                Sign out
              </span>
            </button>
          </div>
        </aside>
      </>
    );
  };

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <Sidebar />

      <div className="min-h-screen lg:pl-[270px]">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {/* MOBILE MENU */}

              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-600
                  shadow-sm
                  lg:hidden
                "
              >
                <Menu size={20} />
              </button>

              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-400">
                  Instructor Workspace
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  Academic Assessment Center
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* SEARCH */}

              <div className="hidden w-[240px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex">
                <Search
                  size={16}
                  className="text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search exams..."
                  className="
                    h-10
                    w-full
                    bg-transparent
                    text-sm
                    text-slate-700
                    outline-none
                    placeholder:text-slate-400
                  "
                />
              </div>

              {/* NOTIFICATIONS */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setNotificationsOpen(
                      (current) =>
                        !current
                    )
                  }
                  className="
                    relative
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-500
                    shadow-sm
                    transition
                    hover:border-indigo-200
                    hover:bg-indigo-50
                    hover:text-indigo-600
                  "
                >
                  <Bell size={18} />

                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-500 ring-2 ring-white" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="border-b border-slate-100 p-4">
                      <p className="font-semibold text-slate-900">
                        Notifications
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Your latest workspace updates
                      </p>
                    </div>

                    <div className="p-4">
                      <div className="flex gap-3 rounded-xl bg-indigo-50 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <Activity
                            size={16}
                          />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Instructor portal ready
                          </p>

                          <p className="mt-1 text-[11px] leading-4 text-slate-500">
                            Create and manage your BCA
                            assessments from here.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PROFILE */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen(
                      (current) =>
                        !current
                    )
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-2
                    py-1.5
                    shadow-sm
                    transition
                    hover:border-indigo-200
                  "
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-[11px] font-bold text-white">
                    {getInitials(
                      user?.name
                    )}
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="max-w-[110px] truncate text-xs font-semibold text-slate-800">
                      {user?.name ||
                        "Instructor"}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Instructor
                    </p>
                  </div>

                  <ChevronDown
                    size={15}
                    className="hidden text-slate-400 sm:block"
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.name ||
                          "Instructor"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {user?.email ||
                          "Instructor account"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/instructor/profile"
                        )
                      }
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <GraduationCap
                        size={16}
                      />

                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut
                        size={16}
                      />

                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* HERO */}

          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#11163b] via-[#25206c] to-[#6514b8] p-6 text-white shadow-xl shadow-indigo-900/10 sm:p-8">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur">
                <Sparkles size={14} />

                BCA Assessment Portal
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Welcome back,
                {user?.name
                  ? ` ${
                      user.name.split(
                        " "
                      )[0]
                    }`
                  : " Instructor"}{" "}
                👋
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100/80 sm:text-base">
                Build engaging assessments,
                manage question banks, assign
                exams to BCA students, and
                understand performance from one
                workspace.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    handleCreateExam
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-indigo-700
                    shadow-lg
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-xl
                  "
                >
                  <Plus size={17} />

                  Create New Exam

                  <ArrowRight
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/instructor/results"
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-white/20
                    bg-white/10
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    backdrop-blur
                    transition
                    hover:bg-white/15
                  "
                >
                  <BarChart3
                    size={17}
                  />

                  View Analytics
                </button>
              </div>
            </div>
          </section>

          {/* STATS */}

          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* TOTAL EXAMS */}

            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Total Exams
                  </p>

                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    {
                      displayExams.length
                    }
                  </p>

                  <p className="mt-1 text-xs text-emerald-600">
                    {publishedCount}{" "}
                    published
                    {draftCount >
                      0 &&
                      ` · ${draftCount} draft`}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen
                    size={20}
                  />
                </div>
              </div>
            </div>

            {/* QUESTION BANK */}

            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Question Bank
                  </p>

                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    {
                      totalQuestions
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Across your exams
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <FileQuestion
                    size={20}
                  />
                </div>
              </div>
            </div>

            {/* STUDENT REACH */}

            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Student Reach
                  </p>

                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    —
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Assignment analytics coming
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600">
                  <Users size={20} />
                </div>
              </div>
            </div>

            {/* ASSESSMENT TIME */}

            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Assessment Time
                  </p>

                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    {totalDuration}

                    <span className="ml-1 text-sm font-semibold text-slate-400">
                      min
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Combined exam duration
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock3 size={20} />
                </div>
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Get to the most important instructor
                tasks quickly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* CREATE EXAM */}

              <button
                type="button"
                onClick={
                  handleCreateExam
                }
                className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 text-left transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                  <Plus size={20} />
                </div>

                <h3 className="mt-4 font-bold text-slate-900">
                  Create Exam
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Build a new BCA assessment
                  with duration and scoring
                  rules.
                </p>

                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600">
                  Start building

                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </button>

              {/* QUESTION BANK */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/questions"
                  )
                }
                className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 text-left transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                  <FileQuestion
                    size={20}
                  />
                </div>

                <h3 className="mt-4 font-bold text-slate-900">
                  Question Bank
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add MCQs and multi-select
                  questions to your assessments.
                </p>

                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-violet-600">
                  Manage questions

                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </button>

              {/* ASSIGN EXAM */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/assignments"
                  )
                }
                className="group rounded-2xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 to-white p-5 text-left transition hover:-translate-y-1 hover:border-fuchsia-200 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20">
                  <Target size={20} />
                </div>

                <h3 className="mt-4 font-bold text-slate-900">
                  Assign Exam
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Assign assessments to
                  selected BCA students or
                  academic groups.
                </p>

                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-fuchsia-600">
                  Manage assignments

                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </button>

              {/* RESULTS */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/results"
                  )
                }
                className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <BarChart3
                    size={20}
                  />
                </div>

                <h3 className="mt-4 font-bold text-slate-900">
                  View Results
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Review scores, submissions,
                  and detailed student performance.
                </p>

                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
                  Open analytics

                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </button>
            </div>
          </section>

          {/* RECENT ASSESSMENTS */}

          <section className="mt-8">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Assessments
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Your latest BCA exams and their
                  configuration.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/instructor/exams"
                  )
                }
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all exams

                <ArrowRight
                  size={15}
                />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* MOBILE SEARCH */}

              <div className="border-b border-slate-100 p-4 md:hidden">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <Search
                    size={16}
                    className="text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search exams..."
                    className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* LOADING */}

              {loading && (
                <div className="space-y-3 p-5">
                  {[1, 2, 3].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-20 animate-pulse rounded-xl bg-slate-100"
                      />
                    )
                  )}
                </div>
              )}

              {/* EMPTY */}

              {!loading &&
                filteredExams.length ===
                  0 && (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <BookOpen
                        size={24}
                      />
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900">
                      No assessments found
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-slate-400">
                      Create your first BCA assessment
                      to start building your question
                      bank.
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleCreateExam
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                    >
                      <Plus size={16} />

                      Create Exam
                    </button>
                  </div>
                )}

              {/* DESKTOP TABLE */}

              {!loading &&
                filteredExams.length >
                  0 && (
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Assessment
                          </th>

                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Academic
                          </th>

                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Questions
                          </th>

                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Duration
                          </th>

                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Status
                          </th>

                          <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredExams
                          .slice(0, 8)
                          .map(
                            (
                              exam
                            ) => (
                              <tr
                                key={
                                  exam._id
                                }
                                className="group transition hover:bg-slate-50/70"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                      <BookOpen
                                        size={
                                          18
                                        }
                                      />
                                    </div>

                                    <div>
                                      <p className="font-semibold text-slate-800">
                                        {
                                          exam.title
                                        }
                                      </p>

                                      <p className="mt-0.5 text-xs text-slate-400">
                                        {exam.subject ||
                                          "Academic Assessment"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">
                                      {exam.degree ||
                                        "BCA"}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {getYearLabel(
                                        exam.yearOfStudy
                                      )}{" "}
                                      ·{" "}
                                      {getSemesterLabel(
                                        exam.semester
                                      )}
                                    </p>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <span className="text-sm font-semibold text-slate-700">
                                    {
                                      exam.questionCount
                                    }
                                  </span>

                                  <span className="ml-1 text-xs text-slate-400">
                                    questions
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Clock3
                                      size={
                                        15
                                      }
                                      className="text-slate-400"
                                    />

                                    {
                                      exam.duration
                                    }{" "}
                                    min
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  {exam.published !==
                                  false ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                      Published
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                                      Draft
                                    </span>
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/instructor/exams/${exam._id}`
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                                  >
                                    Manage

                                    <ArrowRight
                                      size={
                                        13
                                      }
                                    />
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* MOBILE CARDS */}

              {!loading &&
                filteredExams.length >
                  0 && (
                  <div className="space-y-3 p-4 md:hidden">
                    {filteredExams
                      .slice(0, 8)
                      .map(
                        (
                          exam
                        ) => (
                          <div
                            key={
                              exam._id
                            }
                            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <BookOpen
                                  size={
                                    18
                                  }
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-800">
                                      {
                                        exam.title
                                      }
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-400">
                                      {exam.subject ||
                                        "Academic Assessment"}
                                    </p>
                                  </div>

                                  {exam.published !==
                                  false ? (
                                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                                      LIVE
                                    </span>
                                  ) : (
                                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">
                                      DRAFT
                                    </span>
                                  )}
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2">
                                  <div className="rounded-xl bg-white p-2.5">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                      Questions
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-700">
                                      {
                                        exam.questionCount
                                      }
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-white p-2.5">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                      Duration
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-700">
                                      {
                                        exam.duration
                                      }{" "}
                                      m
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-white p-2.5">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                      Year
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-700">
                                      {exam.yearOfStudy ||
                                        "All"}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/instructor/exams/${exam._id}`
                                    )
                                  }
                                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-xs font-bold text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                >
                                  Manage Assessment

                                  <ArrowRight
                                    size={
                                      13
                                    }
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                  </div>
                )}
            </div>
          </section>

          {/* INFORMATION */}

          <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2
                    size={21}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Server-controlled assessments
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    ExamForge keeps exam rules,
                    timing, answers, and scoring on
                    the backend so student-side
                    changes cannot determine the
                    final result.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <GraduationCap
                    size={21}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Built for BCA students
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Organize assessments by BCA year,
                    semester, subject, and student
                    assignments as your instructor
                    workspace grows.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}

          <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200 py-6 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              ExamForge. Academic Assessment
              Platform.
            </p>

            <div className="flex items-center gap-4">
              <span>
                Instructor Portal
              </span>

              <span className="h-1 w-1 rounded-full bg-slate-300" />

              <span>
                Secure Workspace
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default InstructorDashboard;
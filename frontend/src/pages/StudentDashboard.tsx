import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  ChevronDown,
  Clock3,
  GraduationCap,
  HelpCircle,
  Info,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  User,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../redux/hooks";

import { login, logout } from "../redux/slices/authSlice";

const API_URL = "http://localhost:5000/api";

// ======================================================
// TYPES
// ======================================================

interface Exam {
  _id: string;
  title: string;
  description?: string;
  category?: string;

  duration: number;
  questionCount: number;

  totalMarks?: number;
  passingMarks?: number;

  negativeMarking: boolean;
  negativePenalty: number;

  allowedAttempts?: number;
  attemptsUsed?: number; // shown only if your API sends it

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  subject?: string;

  startDate?: string;
  endDate?: string;
}

interface ProfileUser {
  id?: string;
  _id?: string;

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
  profilePicture?: string | null;

  isActive?: boolean;
}

type FilterType = "all" | "negative" | "no-negative";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All exams" },
  { key: "negative", label: "Negative marking" },
  { key: "no-negative", label: "No negative marking" },
];

const ACCENTS = [
  { gradient: "from-indigo-500 to-violet-600", soft: "bg-indigo-50 text-indigo-600" },
  { gradient: "from-sky-500 to-cyan-500", soft: "bg-sky-50 text-sky-600" },
  { gradient: "from-emerald-500 to-teal-500", soft: "bg-emerald-50 text-emerald-600" },
  { gradient: "from-amber-500 to-orange-500", soft: "bg-amber-50 text-amber-600" },
  { gradient: "from-rose-500 to-pink-500", soft: "bg-rose-50 text-rose-600" },
  { gradient: "from-fuchsia-500 to-purple-600", soft: "bg-fuchsia-50 text-fuchsia-600" },
];

// ======================================================
// HELPERS
// ======================================================

const getYearLabel = (year?: number) => {
  if (year === 1) return "1st Year";
  if (year === 2) return "2nd Year";
  if (year === 3) return "3rd Year";
  return "BCA";
};

const getSemesterLabel = (semester?: number) =>
  semester ? `Semester ${semester}` : "Semester not set";

const getInitials = (name?: string) => {
  if (!name) return "S";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "S";

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// ======================================================
// AVATAR
// ======================================================

function Avatar({
  name,
  picture,
  className,
}: {
  name?: string;
  picture?: string | null;
  className: string;
}) {
  if (picture) {
    return (
      <img
        src={picture}
        alt={name ? `${name} profile` : "Profile"}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white`}
    >
      {getInitials(name)}
    </div>
  );
}

// ======================================================
// HEADER
// ======================================================

function StudentHeader({
  active,
  examCount,
  onExamsClick,
}: {
  active: "dashboard" | "exams" | "profile";
  examCount: number;
  onExamsClick?: () => void;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => state.auth.user
  ) as ProfileUser | null;

  const [openMenu, setOpenMenu] = useState<"notifications" | "profile" | null>(
    null
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const notificationsRef = useState<{ current: HTMLDivElement | null }>({
    current: null,
  })[0];
  const profileRef = useState<{ current: HTMLDivElement | null }>({
    current: null,
  })[0];

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationsRef.current?.contains(target) ||
        profileRef.current?.contains(target)
      ) {
        return;
      }

      setOpenMenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
        setShowLogout(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsRef, profileRef]);

  const goTo = (path: string) => {
    setOpenMenu(null);
    setMobileOpen(false);
    navigate(path);
  };

  const goToExams = () => {
    setOpenMenu(null);
    setMobileOpen(false);

    if (onExamsClick) {
      onExamsClick();
    } else {
      navigate("/student");
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);

      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      dispatch(logout());
      navigate("/");
    }
  };

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      onClick: () => goTo("/student"),
    },
    {
      key: "exams",
      label: "Exams",
      icon: BookOpen,
      onClick: goToExams,
    },
    {
      key: "profile",
      label: "Profile",
      icon: User,
      onClick: () => goTo("/student/profile"),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500" />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* LOGO */}
          <button
            type="button"
            onClick={() => goTo("/student")}
            className="group flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200 transition group-hover:scale-105">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>

            <span className="text-left">
              <span className="block text-lg font-extrabold leading-none tracking-tight text-slate-900">
                Exam<span className="text-indigo-600">Forge</span>
              </span>

              <span className="mt-1 hidden text-[11px] font-medium leading-none text-slate-400 sm:block">
                BCA Assessment Platform
              </span>
            </span>
          </button>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-1 rounded-2xl bg-slate-100/80 p-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* NOTIFICATIONS */}
            <div
              ref={(node) => {
                notificationsRef.current = node;
              }}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenMenu((value) =>
                    value === "notifications" ? null : "notifications"
                  )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />

                {examCount > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {openMenu === "notifications" && (
                <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
                  <div className="border-b border-slate-100 px-4 py-3.5">
                    <h3 className="text-sm font-bold text-slate-900">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Updates from ExamForge
                    </p>
                  </div>

                  <div className="space-y-1 p-2">
                    {examCount > 0 && (
                      <button
                        type="button"
                        onClick={goToExams}
                        className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-indigo-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <BookOpen className="h-4 w-4" />
                        </span>

                        <span>
                          <span className="block text-sm font-bold text-slate-800">
                            {examCount} exam{examCount !== 1 ? "s" : ""}{" "}
                            available
                          </span>

                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                            Open the exam list to get started.
                          </span>
                        </span>
                      </button>
                    )}

                    <div className="flex gap-3 rounded-xl p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <Info className="h-4 w-4" />
                      </span>

                      <span>
                        <span className="block text-sm font-bold text-slate-800">
                          Exam rules
                        </span>

                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                          Do not switch tabs during an exam. Repeated tab
                          switches can end your attempt.
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE MENU */}
            <div
              ref={(node) => {
                profileRef.current = node;
              }}
              className="relative hidden sm:block"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenMenu((value) =>
                    value === "profile" ? null : "profile"
                  )
                }
                className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 transition hover:bg-slate-100"
              >
                <Avatar
                  name={user?.name}
                  picture={user?.profilePicture}
                  className="h-9 w-9 rounded-xl text-sm shadow-md"
                />

                <span className="hidden text-left lg:block">
                  <span className="block max-w-[140px] truncate text-sm font-bold leading-tight text-slate-800">
                    {user?.name || "Student"}
                  </span>

                  <span className="block text-[11px] leading-tight text-slate-400">
                    {getSemesterLabel(user?.semester)}
                  </span>
                </span>

                <ChevronDown
                  className={`hidden h-4 w-4 text-slate-400 transition lg:block ${
                    openMenu === "profile" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openMenu === "profile" && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
                    <Avatar
                      name={user?.name}
                      picture={user?.profilePicture}
                      className="h-11 w-11 rounded-xl"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user?.name || "Student"}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => goTo("/student/profile")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        setShowLogout(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MOBILE TOGGLE */}
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE PANEL */}
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 md:hidden">
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <Avatar
                name={user?.name}
                picture={user?.profilePicture}
                className="h-11 w-11 rounded-xl"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {user?.name || "Student"}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === active;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.onClick}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setShowLogout(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loggingOut) {
              setShowLogout(false);
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-8 text-white">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

              <div className="relative flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <LogOut className="h-6 w-6" />
                </span>

                <h2 className="mt-4 text-2xl font-extrabold">Ready to leave?</h2>

                <p className="mt-1 text-sm text-indigo-100">
                  You're about to sign out of ExamForge.
                </p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-center text-sm leading-6 text-slate-500">
                Are you sure you want to log out of your account?
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogout(false)}
                  disabled={loggingOut}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Stay Logged In
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  disabled={loggingOut}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:from-rose-600 hover:to-red-700 disabled:opacity-60"
                >
                  {loggingOut ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ======================================================
// DASHBOARD
// ======================================================

function StudentDashboard() {
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => state.auth.user
  ) as ProfileUser | null;

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [onlyMyLevel, setOnlyMyLevel] = useState(true);

  const [startingExamId, setStartingExamId] = useState<string | null>(null);

  // ====================================================
  // LOAD PROFILE + PUBLISHED EXAMS
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const profileResponse = await fetch(`${API_URL}/profile/me`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (profileResponse.status === 401) {
          dispatch(logout());
          navigate("/");
          return;
        }

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();

          if (profileData.user) {
            dispatch(
              login({
                user: {
                  id: profileData.user.id || profileData.user._id,
                  name: profileData.user.name,
                  email: profileData.user.email,
                  role: profileData.user.role,
                  degree: profileData.user.degree,
                  yearOfStudy: profileData.user.yearOfStudy,
                  semester: profileData.user.semester,
                  studentId: profileData.user.studentId,
                  phone: profileData.user.phone,
                  city: profileData.user.city,
                  bio: profileData.user.bio,
                  profilePicture: profileData.user.profilePicture || undefined,
                },
              })
            );
          }
        }

        const examResponse = await fetch(`${API_URL}/exams/published`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (examResponse.status === 401) {
          dispatch(logout());
          navigate("/");
          return;
        }

        const examData = await examResponse.json();

        if (!examResponse.ok) {
          throw new Error(examData.message || "Failed to load exams");
        }

        setExams(Array.isArray(examData) ? examData : examData.exams || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        console.error("Dashboard loading error:", err);

        setError(
          err instanceof Error ? err.message : "Unable to load dashboard"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => controller.abort();
  }, [dispatch, navigate, reloadKey]);

  // ====================================================
  // FILTER EXAMS
  // ====================================================

  const filteredExams = useMemo(() => {
    const text = search.toLowerCase().trim();

    return exams.filter((exam) => {
      const matchesSearch =
        !text ||
        exam.title.toLowerCase().includes(text) ||
        (exam.subject ?? "").toLowerCase().includes(text) ||
        (exam.category ?? "").toLowerCase().includes(text);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "negative"
          ? exam.negativeMarking
          : !exam.negativeMarking;

      // If the student has not set year / semester yet, nothing is hidden.
      const degreeMatches =
        !exam.degree ||
        !user?.degree ||
        exam.degree.toLowerCase() === user.degree.toLowerCase();

      const yearMatches =
        !onlyMyLevel ||
        !exam.yearOfStudy ||
        !user?.yearOfStudy ||
        exam.yearOfStudy === user.yearOfStudy;

      const semesterMatches =
        !onlyMyLevel ||
        !exam.semester ||
        !user?.semester ||
        exam.semester === user.semester;

      return (
        matchesSearch &&
        matchesFilter &&
        degreeMatches &&
        yearMatches &&
        semesterMatches
      );
    });
  }, [exams, search, filter, onlyMyLevel, user]);

  // Stats now describe the exams the student can actually see
  const totalQuestions = filteredExams.reduce(
    (total, exam) => total + exam.questionCount,
    0
  );

  const totalDuration = filteredExams.reduce(
    (total, exam) => total + exam.duration,
    0
  );

  const stats = [
    {
      label: "Available exams",
      value: String(filteredExams.length),
      unit: "",
      icon: BookOpen,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Total questions",
      value: String(totalQuestions),
      unit: "",
      icon: HelpCircle,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Total duration",
      value: String(totalDuration),
      unit: "min",
      icon: Clock3,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Current semester",
      value: user?.semester ? `Sem ${user.semester}` : "—",
      unit: "",
      icon: GraduationCap,
      tone: "bg-fuchsia-50 text-fuchsia-600",
    },
  ];

  // ====================================================
  // ACTIONS
  // ====================================================

  const scrollToExams = () => {
    document
      .getElementById("available-exams")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => {
    setSearch("");
    setFilter("all");
    setOnlyMyLevel(false);
  };

  const handleStartExam = async (examId: string) => {
    if (!user?.id) {
      setError("Student information not found. Please login again.");
      return;
    }

    try {
      setError("");
      setStartingExamId(examId);

      const response = await fetch(`${API_URL}/exams/${examId}/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id }),
      });

      const data = await response.json();

      if (response.status === 401) {
        dispatch(logout());
        navigate("/");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to start exam");
      }

      if (!data.attempt?._id) {
        throw new Error("Exam attempt was not created.");
      }

      navigate(`/exam/${data.attempt._id}`);
    } catch (err) {
      console.error("Start exam error:", err);

      setError(err instanceof Error ? err.message : "Failed to start exam");
    } finally {
      setStartingExamId(null);
    }
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Student";

  // ====================================================
  // LOADING SKELETON
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <StudentHeader active="dashboard" examCount={0} />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentHeader
        active="dashboard"
        examCount={filteredExams.length}
        onExamsClick={scrollToExams}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="flex-1 font-medium">{error}</p>

            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-200/60 sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-indigo-50 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                BCA Student Dashboard
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {getGreeting()}, {firstName} 👋
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                Pick an exam, stay focused and track how you're doing. Your
                available assessments are listed below.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
                  {user?.degree || "BCA"}
                </span>

                <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
                  {getYearLabel(user?.yearOfStudy)}
                </span>

                <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
                  {getSemesterLabel(user?.semester)}
                </span>

                {user?.studentId && (
                  <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
                    ID: {user.studentId}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur lg:w-72">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
                Ready to attempt
              </p>

              <p className="mt-2 text-4xl font-extrabold">
                {filteredExams.length}
                <span className="ml-2 text-sm font-semibold text-indigo-100">
                  exam{filteredExams.length !== 1 ? "s" : ""}
                </span>
              </p>

              <button
                type="button"
                onClick={scrollToExams}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
              >
                Browse exams
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {stat.value}
                  {stat.unit && (
                    <span className="ml-1 text-sm font-bold text-slate-400">
                      {stat.unit}
                    </span>
                  )}
                </p>

                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </section>

        {/* EXAMS */}
        <section id="available-exams" className="mt-12 scroll-mt-24">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Assessments
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Available Exams
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {onlyMyLevel && user?.semester
                  ? `Showing exams for ${getSemesterLabel(user.semester)}.`
                  : "Showing exams from all semesters."}
              </p>
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search exams or subjects..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    filter === item.key
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={onlyMyLevel}
              onClick={() => setOnlyMyLevel((value) => !value)}
              className="flex items-center gap-3 text-sm font-semibold text-slate-600"
            >
              <span
                className={`relative h-6 w-11 rounded-full transition ${
                  onlyMyLevel ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    onlyMyLevel ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </span>
              My semester only
            </button>
          </div>

          {filteredExams.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <BookOpen className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-800">
                No exams found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no exams matching your search or academic level right
                now.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Clear filters and show all
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filteredExams.map((exam, index) => {
                const accent = ACCENTS[index % ACCENTS.length];

                const attemptsLeft =
                  exam.allowedAttempts !== undefined &&
                  exam.attemptsUsed !== undefined
                    ? exam.allowedAttempts - exam.attemptsUsed
                    : undefined;

                const noAttemptsLeft =
                  attemptsLeft !== undefined && attemptsLeft <= 0;

                const attemptsLabel =
                  exam.allowedAttempts === undefined
                    ? "—"
                    : exam.attemptsUsed !== undefined
                    ? `${exam.attemptsUsed}/${exam.allowedAttempts}`
                    : String(exam.allowedAttempts);

                const isStarting = startingExamId === exam._id;

                return (
                  <article
                    key={exam._id}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    <div
                      className={`h-1.5 bg-gradient-to-r ${accent.gradient}`}
                    />

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent.soft}`}
                          >
                            <BookOpen className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-extrabold text-slate-900">
                              {exam.title}
                            </h3>

                            {(exam.subject || exam.category) && (
                              <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                                {exam.subject || exam.category}
                              </p>
                            )}
                          </div>
                        </div>

                        {exam.negativeMarking && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-600">
                            <AlertCircle className="h-3 w-3" />
                            Negative
                          </span>
                        )}
                      </div>

                      {exam.description && (
                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                          {exam.description}
                        </p>
                      )}

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          { label: "Duration", value: `${exam.duration} min` },
                          { label: "Questions", value: String(exam.questionCount) },
                          {
                            label: "Marks",
                            value: String(exam.totalMarks ?? exam.questionCount),
                          },
                          { label: "Attempts", value: attemptsLabel },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-xl bg-slate-50 p-3"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {item.label}
                            </p>

                            <p className="mt-1 font-extrabold text-slate-800">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {(exam.passingMarks !== undefined ||
                        exam.negativeMarking) && (
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                          {exam.passingMarks !== undefined && (
                            <span className="flex items-center gap-1.5">
                              <Trophy className="h-3.5 w-3.5 text-amber-500" />
                              Pass mark: {exam.passingMarks}
                              {exam.totalMarks ? `/${exam.totalMarks}` : ""}
                            </span>
                          )}

                          {exam.negativeMarking && (
                            <span className="flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                              −{exam.negativePenalty} per wrong answer
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                        <p className="text-xs font-semibold text-slate-400">
                          {getYearLabel(exam.yearOfStudy || user?.yearOfStudy)}
                          {" • "}
                          {getSemesterLabel(exam.semester || user?.semester)}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleStartExam(exam._id)}
                          disabled={isStarting || noAttemptsLeft}
                          className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${accent.gradient} px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {isStarting ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Starting...
                            </>
                          ) : noAttemptsLeft ? (
                            "No attempts left"
                          ) : (
                            <>
                              Start Exam
                              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
          <p>© 2026 ExamForge. Online Assessment Platform.</p>
          <p>Learn. Practice. Excel.</p>
        </div>
      </footer>
    </div>
  );
}

export default StudentDashboard;
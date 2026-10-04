import { useCallback, useEffect, useRef, useState } from "react";

import type { ChangeEvent, FormEvent, ReactNode } from "react";

import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  Circle,
  GraduationCap,
  Hash,
  Info,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  RotateCcw,
  Save,
  User,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../redux/hooks";

import { login, logout } from "../redux/slices/authSlice";
import { API_URL } from "../apiConfig";

// ======================================================
// TYPES
// ======================================================

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
}

interface FormSnapshot {
  name: string;
  phone: string;
  city: string;
  bio: string;
  yearOfStudy: number;
  semester: number;
  profilePicture: string | null;
}

// ======================================================
// HELPERS
// ======================================================

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

const yearLabelOf = (year: number) =>
  year === 1 ? "1st Year" : year === 2 ? "2nd Year" : "3rd Year";

// Year 1 -> [1, 2], Year 2 -> [3, 4], Year 3 -> [5, 6]
const semestersForYear = (year: number) => [year * 2 - 1, year * 2];

// Makes year and semester consistent (infers the year from the semester if needed)
const normalizeAcademic = (year?: number, semester?: number) => {
  const numericYear = Number(year);
  const numericSemester = Number(semester);

  const validSemester =
    Number.isInteger(numericSemester) &&
    numericSemester >= 1 &&
    numericSemester <= 6
      ? numericSemester
      : undefined;

  const validYear =
    numericYear === 1 || numericYear === 2 || numericYear === 3
      ? numericYear
      : validSemester
      ? Math.ceil(validSemester / 2)
      : 1;

  const options = semestersForYear(validYear);

  return {
    year: validYear,
    semester:
      validSemester && options.includes(validSemester)
        ? validSemester
        : options[0],
  };
};

// Crops to a square and keeps the profile picture sharp while keeping the
// encoded image small enough for the existing profile API.
const resizeImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const side = Math.min(
          image.naturalWidth,
          image.naturalHeight
        );
        const sx =
          (image.naturalWidth - side) / 2;
        const sy =
          (image.naturalHeight - side) / 2;

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Your browser cannot process images."
          );
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        // Start with a larger, high-quality image. If the encoded result
        // is too large, progressively reduce the quality/resolution.
        // This avoids the very small 256px/low-quality image that was
        // making the profile picture look blurry.
        const attempts = [
          { pixels: 768, quality: 0.94 },
          { pixels: 768, quality: 0.88 },
          { pixels: 640, quality: 0.94 },
          { pixels: 640, quality: 0.88 },
          { pixels: 512, quality: 0.94 },
          { pixels: 512, quality: 0.88 },
          { pixels: 448, quality: 0.90 },
          { pixels: 384, quality: 0.90 },
        ];

        // Keep the image comfortably below the existing Express JSON
        // body limit while allowing substantially more detail.
        const maxDataUrlLength = 180_000;
        let best = "";

        for (const attempt of attempts) {
          const pixels = Math.min(
            attempt.pixels,
            side
          );

          canvas.width = pixels;
          canvas.height = pixels;

          context.clearRect(
            0,
            0,
            pixels,
            pixels
          );

          context.drawImage(
            image,
            sx,
            sy,
            side,
            side,
            0,
            0,
            pixels,
            pixels
          );

          // WebP gives better quality at this payload size.
          // JPEG remains the fallback for browsers that do not support it.
          let encoded = canvas.toDataURL(
            "image/webp",
            attempt.quality
          );

          if (!encoded.startsWith("data:image/webp")) {
            encoded = canvas.toDataURL(
              "image/jpeg",
              attempt.quality
            );
          }

          if (encoded.length <= maxDataUrlLength) {
            best = encoded;
            break;
          }
        }

        URL.revokeObjectURL(url);

        if (!best) {
          throw new Error(
            "This image could not be compressed enough to save. Please choose another image."
          );
        }

        resolve(best);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(
          error instanceof Error
            ? error
            : new Error(
                "Unable to process the selected image."
              )
        );
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "Unable to read the selected image."
        )
      );
    };

    image.src = url;
  });

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10";

const iconInputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10";

// ======================================================
// SMALL COMPONENTS
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

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>

      {children}

      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function StudentHeader({
  active,
  examCount,
}: {
  active: "dashboard" | "exams" | "profile";
  examCount: number;
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

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

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
  }, []);

  const goTo = (path: string) => {
    setOpenMenu(null);
    setMobileOpen(false);
    navigate(path);
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
      onClick: () => goTo("/student"),
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
            <div ref={notificationsRef} className="relative">
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
                        onClick={() => goTo("/student")}
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
            <div ref={profileRef} className="relative hidden sm:block">
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
// PROFILE PAGE
// ======================================================

function StudentProfile() {
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const authUser = useAppSelector(
    (state) => state.auth.user
  ) as ProfileUser | null;

  const authUserRef = useRef<ProfileUser | null>(authUser);

  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);

  // FORM STATE
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [semester, setSemester] = useState<number>(1);
  const [studentId, setStudentId] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // The last saved values, used to detect unsaved changes
  const [initial, setInitial] = useState<FormSnapshot | null>(null);

  // UI STATE
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const snapshot = (): FormSnapshot => ({
    name: name.trim(),
    phone: phone.trim(),
    city: city.trim(),
    bio: bio.trim(),
    yearOfStudy,
    semester,
    profilePicture,
  });

  const isDirty =
    initial !== null && JSON.stringify(snapshot()) !== JSON.stringify(initial);

  // ====================================================
  // APPLY A USER OBJECT TO THE FORM
  // ====================================================

  const applyUser = useCallback((user: ProfileUser) => {
    const academic = normalizeAcademic(user.yearOfStudy, user.semester);

    setName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setCity(user.city || "");
    setBio(user.bio || "");
    setYearOfStudy(academic.year);
    setSemester(academic.semester);
    setStudentId(user.studentId || "");
    setProfilePicture(user.profilePicture || null);

    setInitial({
      name: (user.name || "").trim(),
      phone: (user.phone || "").trim(),
      city: (user.city || "").trim(),
      bio: (user.bio || "").trim(),
      yearOfStudy: academic.year,
      semester: academic.semester,
      profilePicture: user.profilePicture || null,
    });
  }, []);

  // ====================================================
  // LOAD PROFILE
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/profile/me`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (response.status === 401) {
          // Keep the student on the profile page when the profile
          // endpoint rejects the request but the logged-in student
          // is still available in Redux.
          if (authUserRef.current) {
            applyUser(authUserRef.current);
            setError("");
            return;
          }

          navigate("/");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile.");
        }

        const user: ProfileUser = data.user;

        applyUser(user);

        const academic = normalizeAcademic(user.yearOfStudy, user.semester);

        dispatch(
          login({
            user: {
              id: user.id || user._id || "",
              name: user.name,
              email: user.email,
              role: user.role,
              accountStatus: "approved",
              degree: "BCA",
              yearOfStudy: academic.year,
              semester: academic.semester,
              studentId: user.studentId,
              phone: user.phone,
              city: user.city,
              bio: user.bio,
              profilePicture: user.profilePicture || undefined,
            },
          })
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Unable to load profile."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => controller.abort();
  }, [applyUser, dispatch, navigate]);

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);

    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Auto-hide the success message
  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => setSuccess(""), 4000);

    return () => window.clearTimeout(timer);
  }, [success]);

  // ====================================================
  // PROFILE PICTURE
  // ====================================================

  const handleProfilePictureChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // allow choosing the same file again later
    event.target.value = "";

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5 MB.");
      return;
    }

    try {
      setProfilePicture(await resizeImage(file));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process the selected image."
      );
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setError("");
    setSuccess("");
  };

  // ====================================================
  // DISCARD / BACK
  // ====================================================

  const handleDiscard = () => {
    if (!initial) return;

    setName(initial.name);
    setPhone(initial.phone);
    setCity(initial.city);
    setBio(initial.bio);
    setYearOfStudy(initial.yearOfStudy);
    setSemester(initial.semester);
    setProfilePicture(initial.profilePicture);
    setError("");
    setSuccess("");
  };

  const handleBack = () => {
    if (
      isDirty &&
      !window.confirm("You have unsaved changes. Leave without saving?")
    ) {
      return;
    }

    navigate("/student");
  };

  // ====================================================
  // SAVE
  // ====================================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (phone.trim() && !/^[+]?[0-9\s-]{7,15}$/.test(phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!semestersForYear(yearOfStudy).includes(semester)) {
      setError("The selected semester does not match the selected year.");
      return;
    }

    try {
      setSaving(true);

      const updatePayload: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        bio: bio.trim(),
        degree: "BCA",
        yearOfStudy,
        semester,
        studentId: studentId.trim(),
      };

      // Do not resend an already-saved profile picture when it has not
      // changed. This prevents an old oversized stored value from
      // blocking unrelated profile changes such as year or semester.
      if (profilePicture !== (initial?.profilePicture ?? null)) {
        updatePayload.profilePicture = profilePicture || "";
      }

      const updateProfile = () =>
        fetch(`${API_URL}/profile/me`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updatePayload),
        });

      // The access-token cookie expires after a short period.
      // Refresh the session once and retry the save instead of
      // losing the changes or sending the student back to login.
      let response = await updateProfile();

      if (response.status === 401) {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (refreshResponse.ok) {
          response = await updateProfile();
        }
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again and save your changes."
        );
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to save profile.");
      }

      const updatedUser: ProfileUser = data.user;

      // Use the values returned by the backend, with the values that
      // were just saved as a fallback. This keeps the academic section
      // and the profile header synchronized immediately after saving.
      const savedYear = Number(
        updatedUser.yearOfStudy ?? yearOfStudy
      );
      const savedSemester = Number(
        updatedUser.semester ?? semester
      );

      const savedUser: ProfileUser = {
        ...updatedUser,
        yearOfStudy: savedYear,
        semester: savedSemester,
      };

      // Update the complete profile form and its saved snapshot.
      applyUser(savedUser);

      // Update Redux with the exact academic values that were saved.
      // The profile header reads its academic information from Redux.
      dispatch(
        login({
          user: {
            id: savedUser.id || savedUser._id || "",
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
            accountStatus: "approved",
            degree: "BCA",
            yearOfStudy: savedYear,
            semester: savedSemester,
            studentId: savedUser.studentId,
            phone: savedUser.phone,
            city: savedUser.city,
            bio: savedUser.bio,
            profilePicture: savedUser.profilePicture || undefined,
          },
        })
      );

      setSuccess("Your profile has been saved successfully.");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // DERIVED VALUES
  // ====================================================

  const completion = [
    { label: "Full name", done: Boolean(name.trim()) },
    { label: "Phone number", done: Boolean(phone.trim()) },
    { label: "City", done: Boolean(city.trim()) },
    { label: "About me", done: Boolean(bio.trim()) },
    { label: "Profile photo", done: Boolean(profilePicture) },
  ];

  const completionPercent = Math.round(
    (completion.filter((item) => item.done).length / completion.length) * 100
  );

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <StudentHeader active="profile" examCount={0} />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="h-96 animate-pulse rounded-3xl bg-slate-200 lg:col-span-2" />
            <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
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
      <StudentHeader active="profile" examCount={0} />

      <main
        className={`mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 ${
          isDirty ? "pb-32" : "pb-16"
        }`}
      >
        {/* TITLE */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Student Account
            </p>

            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              My Profile
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your personal information and BCA academic details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 text-rose-500 transition hover:bg-rose-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* HERO CARD */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-36 overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 sm:h-44">
              <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
              <div className="absolute bottom-[-4rem] left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />
            </div>

            <div className="relative px-6 pb-6 sm:px-8">
              <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-5">
                  <div className="relative">
                    <Avatar
                      name={name}
                      picture={profilePicture}
                      className="h-28 w-28 rounded-3xl border-4 border-white bg-indigo-50 text-3xl shadow-xl sm:h-32 sm:w-32"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700"
                      aria-label="Change profile picture"
                    >
                      <Camera className="h-[18px] w-[18px]" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </div>

                  <div className="pb-1">
                    <h3 className="text-2xl font-extrabold text-slate-900">
                      {name || "Student"}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                        BCA
                      </span>

                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">
                        {yearLabelOf(yearOfStudy)}
                      </span>

                      <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-bold text-fuchsia-600">
                        Semester {semester}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </button>

                  {profilePicture && (
                    <button
                      type="button"
                      onClick={removeProfilePicture}
                      className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-5 text-xs text-slate-400">
                Any image up to 5 MB. Photos are cropped to a square and
                optimised automatically.
              </p>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* LEFT COLUMN */}
            <div className="space-y-6 lg:col-span-2">
              {/* PERSONAL INFORMATION */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <User className="h-[22px] w-[22px]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Personal Information
                    </h3>

                    <p className="text-sm text-slate-500">
                      Your basic account details
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Full Name" htmlFor="name">
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      placeholder="Enter your full name"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Email Address"
                    htmlFor="email"
                    hint="Your email cannot be changed here."
                  >
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

                      <input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3 pl-11 pr-4 text-sm font-medium text-slate-600 outline-none"
                      />
                    </div>
                  </Field>

                  <Field label="Phone Number" htmlFor="phone">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="Enter phone number"
                        className={iconInputClass}
                      />
                    </div>
                  </Field>

                  <Field label="City" htmlFor="city">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="Enter your city"
                        className={iconInputClass}
                      />
                    </div>
                  </Field>

                  <div className="md:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="bio"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        About Me
                      </label>

                      <span className="text-xs text-slate-400">
                        {bio.length}/500
                      </span>
                    </div>

                    <textarea
                      id="bio"
                      value={bio}
                      maxLength={500}
                      rows={5}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Tell something about yourself..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </section>

              {/* ACADEMIC INFORMATION */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <BookOpen className="h-[22px] w-[22px]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Academic Information
                    </h3>

                    <p className="text-sm text-slate-500">
                      Used to show you the right exams
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <Field label="Degree">
                    <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-700">
                      <GraduationCap className="h-[18px] w-[18px] text-indigo-600" />
                      BCA
                    </div>
                  </Field>

                  <Field label="Year of Study">
                    <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-700">
                      {yearLabelOf(yearOfStudy)}
                    </div>
                  </Field>

                  <Field label="Semester">
                    <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-700">
                      Semester {semester}
                    </div>
                  </Field>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <aside className="space-y-6">
              {/* COMPLETION */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Profile completion
                  </h3>

                  <span className="text-2xl font-extrabold text-indigo-600">
                    {completionPercent}%
                  </span>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                <ul className="mt-5 space-y-3">
                  {completion.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-3 text-sm font-medium"
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                      ) : (
                        <Circle className="h-[18px] w-[18px] text-slate-300" />
                      )}

                      <span
                        className={
                          item.done ? "text-slate-700" : "text-slate-400"
                        }
                      >
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ACCOUNT DETAILS */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">
                  Account details
                </h3>

                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Hash className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Student ID
                      </dt>

                      <dd className="mt-0.5 truncate font-bold text-slate-800">
                        {studentId || "Not assigned"}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Email
                      </dt>

                      <dd className="mt-0.5 truncate font-bold text-slate-800">
                        {email}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Programme
                      </dt>

                      <dd className="mt-0.5 font-bold text-slate-800">
                        BCA • {yearLabelOf(yearOfStudy)}
                      </dd>
                    </div>
                  </div>
                </dl>
              </section>
            </aside>
          </div>

          {/* UNSAVED CHANGES BAR */}
          {isDirty && (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <p className="hidden items-center gap-2 text-sm font-semibold text-slate-600 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  You have unsaved changes
                </p>

                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:flex-none"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Discard
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

export default StudentProfile;

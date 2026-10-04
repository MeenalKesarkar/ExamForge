import type { Dispatch, SetStateAction } from "react";
import {
  Bell, BookOpen, ChevronDown, Clock3, GraduationCap, LayoutDashboard,
  LogOut, Menu, Search, Settings, Trophy, User, X,
} from "lucide-react";
import type { User as AuthUser } from "../../../redux/slices/authSlice";
import type { Exam } from "../types";

interface StudentDashboardHeaderProps {
  user: AuthUser | null;
  exams: Exam[];
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: Dispatch<SetStateAction<boolean>>;
  isProfileOpen: boolean;
  setIsProfileOpen: Dispatch<SetStateAction<boolean>>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  setShowLogoutModal: Dispatch<SetStateAction<boolean>>;
  scrollToSection: (id: string) => void;
  navigate: (path: string) => void;
}

export default function StudentDashboardHeader({
  user, exams, isNotificationsOpen, setIsNotificationsOpen,
  isProfileOpen, setIsProfileOpen, isMobileMenuOpen,
  setIsMobileMenuOpen, setShowLogoutModal, scrollToSection, navigate,
}: StudentDashboardHeaderProps) {
  return (
    <>
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
                        "student-results"
                      )
                    }
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Trophy className="h-4 w-4" />
                    Results
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
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              navigate("/student/preferences");
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
                          >
                            <Settings className="h-4 w-4" />
                            <span className="font-medium">
                              Exam preferences
                            </span>
                          </button>
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
                          "student-results"
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Trophy className="h-[18px] w-[18px]" />
                      Results
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
    </>
  );
}

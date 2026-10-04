import {
  AlertCircle, ArrowRight, BookOpen, FileQuestion, Sparkles, Timer, Trophy,
} from "lucide-react";
import type { User } from "../../../redux/slices/authSlice";
import type { Exam } from "../types";

interface StudentDashboardSummaryProps {
  user: User | null;
  exams: Exam[];
  totalQuestions: number;
  timedExams: number;
  totalAllowedAttempts: number;
  loading: boolean;
  error: string;
  onExplore: () => void;
}

export default function StudentDashboardSummary({
  user, exams, totalQuestions, timedExams, totalAllowedAttempts,
  loading, error, onExplore,
}: StudentDashboardSummaryProps) {
  return (
    <>
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
                    onExplore()
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
    </>
  );
}

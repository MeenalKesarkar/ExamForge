import {
  ArrowRight, BookOpen, CircleCheck, Clock3,
  FileQuestion, MinusCircle, Play, Search, Trophy,
} from "lucide-react";
import type { Exam, FilterType } from "../types";

export interface ExamAccent {
  background: string;
  light: string;
  text: string;
}

interface StudentExamFeedProps {
  loading: boolean;
  error: string;
  exams: Exam[];
  filteredExams: Exam[];
  search: string;
  onSearchChange: (value: string) => void;
  filter: FilterType;
  onFilterChange: (value: FilterType) => void;
  startingExamId: string | null;
  getExamAccent: (index: number) => ExamAccent;
  onStartExam: (examId: string) => void;
  formatDateTime: (value?: string | null) => string;
}

export default function StudentExamFeed({
  loading, error, exams, filteredExams, search, onSearchChange,
  filter, onFilterChange, startingExamId, getExamAccent, onStartExam,
  formatDateTime,
}: StudentExamFeedProps) {
  return (
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
                    onChange={(event) => onSearchChange(event.target.value)}
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
                        onFilterChange(item.value)
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
                        const hasActiveAttempt = Boolean(exam.activeAttemptId);
                        const attemptsRemaining = exam.attemptsRemaining ?? maxAttempts;
                        const attemptsExhausted = !hasActiveAttempt && attemptsRemaining <= 0;
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
                                  (!canStart && !hasActiveAttempt) ||
                                  attemptsExhausted
                                }
                                onClick={() =>
                                  onStartExam(exam._id)
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
                                    {attemptsExhausted ? (
                                      <>
                                        <CircleCheck className="h-4 w-4" />
                                        Attempts Complete
                                      </>
                                    ) : hasActiveAttempt ? (
                                      <>
                                        <Play className="h-4 w-4 fill-current" />
                                        Resume Exam
                                        <ArrowRight className="ml-auto h-4 w-4 transition group-hover:translate-x-1" />
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-4 w-4 fill-current" />
                                        Start Exam
                                        <ArrowRight className="ml-auto h-4 w-4 transition group-hover:translate-x-1" />
                                      </>
                                    )}
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
  );
}

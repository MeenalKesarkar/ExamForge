import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Search,
  Target,
  User,
  XCircle,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

interface Exam {
  _id: string;
  title: string;
  subject?: string;
  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  duration: number;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
}

interface Attempt {
  _id: string;

  student?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        studentId?: string;
        yearOfStudy?: number;
        semester?: number;
      };

  studentId?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        studentId?: string;
        yearOfStudy?: number;
        semester?: number;
      };

  examId: string;

  startTime: string;
  endTime: string;
  submittedAt?: string | null;

  status:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "EVALUATED"
    | "TIMED_OUT";

  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  tabSwitchCount?: number;
}

interface AttemptListResponse {
  attempts?: Attempt[];
  data?: Attempt[];
}

function getStudentName(attempt: Attempt): string {
  const student =
    attempt.student ??
    attempt.studentId;

  if (
    typeof student === "object" &&
    student
  ) {
    return student.name;
  }

  return "Student";
}

function getStudentEmail(attempt: Attempt): string {
  const student =
    attempt.student ??
    attempt.studentId;

  if (
    typeof student === "object" &&
    student
  ) {
    return student.email;
  }

  return "";
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(
  status: Attempt["status"]
): string {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";

    case "EVALUATED":
      return "Evaluated";

    case "TIMED_OUT":
      return "Timed Out";

    case "IN_PROGRESS":
      return "In Progress";

    default:
      return status;
  }
}

function InstructorResults() {
  const navigate = useNavigate();
  const { examId } = useParams();

  const [exam, setExam] =
    useState<Exam | null>(null);

  const [attempts, setAttempts] =
    useState<Attempt[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | Attempt["status"]>("ALL");

  useEffect(() => {
    if (!examId) {
      return;
    }

    const loadResults = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Load exam details.
         */
        const examResponse = await fetch(
          `${API_URL}/exams/${examId}`,
          {
            credentials: "include",
          }
        );

        if (examResponse.status === 401) {
          navigate("/", {
            replace: true,
          });
          return;
        }

        if (!examResponse.ok) {
          const data =
            await examResponse
              .json()
              .catch(() => null);

          throw new Error(
            data?.message ||
              "Unable to load exam."
          );
        }

        const examData =
          await examResponse.json();

        setExam(
          examData.exam || examData
        );

        /*
         * Load attempts for this exam.
         *
         * First try the results endpoint.
         * If it doesn't exist yet, fall back to
         * the general exam attempts endpoint.
         */
        let attemptsResponse =
          await fetch(
            `${API_URL}/attempts/exam/${examId}/results`,
            {
              credentials: "include",
            }
          );

        if (attemptsResponse.status === 404) {
          attemptsResponse =
            await fetch(
              `${API_URL}/attempts/exam/${examId}`,
              {
                credentials: "include",
              }
            );
        }

        if (attemptsResponse.status === 401) {
          navigate("/", {
            replace: true,
          });
          return;
        }

        if (!attemptsResponse.ok) {
          const data =
            await attemptsResponse
              .json()
              .catch(() => null);

          throw new Error(
            data?.message ||
              "Unable to load student attempts."
          );
        }

        const attemptsData:
          | AttemptListResponse
          | Attempt[] =
          await attemptsResponse.json();

        const normalizedAttempts =
          Array.isArray(attemptsData)
            ? attemptsData
            : attemptsData.attempts ||
              attemptsData.data ||
              [];

        setAttempts(
          normalizedAttempts
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading results."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadResults();
  }, [examId, navigate]);

  const filteredAttempts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return attempts.filter(
        (attempt) => {
          const name =
            getStudentName(
              attempt
            ).toLowerCase();

          const email =
            getStudentEmail(
              attempt
            ).toLowerCase();

          const matchesSearch =
            !query ||
            name.includes(query) ||
            email.includes(query);

          const matchesStatus =
            statusFilter === "ALL" ||
            attempt.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      attempts,
      search,
      statusFilter,
    ]);

  const stats = useMemo(() => {
    const completed =
      attempts.filter(
        (attempt) =>
          attempt.status ===
            "SUBMITTED" ||
          attempt.status ===
            "EVALUATED" ||
          attempt.status ===
            "TIMED_OUT"
      );

    const passed =
      completed.filter(
        (attempt) =>
          attempt.passed === true
      );

    const scores =
      completed
        .map(
          (attempt) =>
            attempt.percentage
        )
        .filter(
          (
            value
          ): value is number =>
            typeof value ===
            "number"
        );

    const average =
      scores.length > 0
        ? Math.round(
            scores.reduce(
              (
                sum,
                value
              ) => sum + value,
              0
            ) / scores.length
          )
        : 0;

    return {
      total: attempts.length,
      completed:
        completed.length,
      passed: passed.length,
      average,
    };
  }, [attempts]);

  if (!examId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold">Exam ID is missing</h1>
          <button
            type="button"
            onClick={() => navigate("/instructor")}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Loading examination results...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-600/5 blur-3xl" />

        <div className="absolute right-0 top-1/3 h-[25rem] w-[25rem] rounded-full bg-purple-600/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              navigate("/instructor")
            }
            className="flex items-center gap-3 text-slate-600 transition hover:text-indigo-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <ArrowLeft className="h-5 w-5" />
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold">
                Instructor Dashboard
              </p>

              <p className="text-xs text-slate-500">
                Back to exams
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <BarChart3 className="h-4 w-4 text-indigo-600" />

            <span className="text-sm font-semibold text-slate-600">
              Results
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 p-6 text-white shadow-xl shadow-indigo-100 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                <BarChart3 className="h-3.5 w-3.5" />

                Examination Results
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {exam?.title ||
                  "Exam Results"}
              </h1>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-indigo-100">
                {exam?.subject && (
                  <span>
                    {exam.subject}
                  </span>
                )}

                {exam?.degree && (
                  <span>
                    {exam.degree}
                  </span>
                )}

                {exam?.yearOfStudy && (
                  <span>
                    Year{" "}
                    {exam.yearOfStudy}
                  </span>
                )}

                {exam?.semester && (
                  <span>
                    Semester{" "}
                    {exam.semester}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
              <p className="text-xs text-indigo-100">
                Total Marks
              </p>

              <p className="mt-1 text-2xl font-bold">
                {exam?.totalMarks ??
                  0}
              </p>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={
              <User className="h-5 w-5" />
            }
            label="Total Attempts"
            value={stats.total}
          />

          <StatCard
            icon={
              <FileText className="h-5 w-5" />
            }
            label="Completed"
            value={stats.completed}
          />

          <StatCard
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            label="Passed"
            value={stats.passed}
          />

          <StatCard
            icon={
              <Target className="h-5 w-5" />
            }
            label="Average Score"
            value={`${stats.average}%`}
          />
        </div>

        {/* Controls */}
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search student name or email..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["ALL", "All"],
                  [
                    "SUBMITTED",
                    "Submitted",
                  ],
                  [
                    "EVALUATED",
                    "Evaluated",
                  ],
                  [
                    "TIMED_OUT",
                    "Timed Out",
                  ],
                  [
                    "IN_PROGRESS",
                    "In Progress",
                  ],
                ] as const
              ).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        value
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                      statusFilter ===
                      value
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Student Attempts
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {
                    filteredAttempts.length
                  }{" "}
                  result
                  {filteredAttempts.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  shown
                </p>
              </div>
            </div>
          </div>

          {filteredAttempts.length ===
          0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <FileText className="h-6 w-6 text-indigo-500" />
              </div>

              <h3 className="mt-5 font-semibold">
                No attempts found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no student attempts
                matching the current search
                or filter.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Student
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Score
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Percentage
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Submitted
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAttempts.map(
                      (attempt) => (
                        <tr
                          key={
                            attempt._id
                          }
                          className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/30"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                                {getStudentName(
                                  attempt
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {getStudentName(
                                    attempt
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {getStudentEmail(
                                    attempt
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-sm font-semibold">
                              {attempt.score ??
                                0}
                              /
                              {attempt.totalMarks ??
                                exam?.totalMarks ??
                                0}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-sm font-medium">
                              {attempt.percentage ??
                                0}
                              %
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <StatusBadge
                              status={
                                attempt.status
                              }
                              passed={
                                attempt.passed
                              }
                            />
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />

                              {formatDate(
                                attempt.submittedAt
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/instructor/attempts/${attempt._id}`
                                )
                              }
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredAttempts.map(
                  (attempt) => (
                    <div
                      key={
                        attempt._id
                      }
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                            {getStudentName(
                              attempt
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {getStudentName(
                                attempt
                              )}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {getStudentEmail(
                                attempt
                              )}
                            </p>
                          </div>
                        </div>

                        <StatusBadge
                          status={
                            attempt.status
                          }
                          passed={
                            attempt.passed
                          }
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <MobileMetric
                          label="Score"
                          value={`${attempt.score ?? 0}/${attempt.totalMarks ?? exam?.totalMarks ?? 0}`}
                        />

                        <MobileMetric
                          label="Percentage"
                          value={`${attempt.percentage ?? 0}%`}
                        />

                        <MobileMetric
                          label="Tabs"
                          value={String(
                            attempt.tabSwitchCount ??
                              0
                          )}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                          {formatDate(
                            attempt.submittedAt
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/instructor/attempts/${attempt._id}`
                            )
                          }
                          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>

        <BarChart3 className="h-4 w-4 text-slate-300" />
      </div>

      <p className="mt-5 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  passed,
}: {
  status: Attempt["status"];
  passed?: boolean;
}) {
  if (
    status === "SUBMITTED" ||
    status === "EVALUATED"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium ${
          passed
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
        }`}
      >
        {passed ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}

        {passed
          ? "Passed"
          : "Failed"}
      </span>
    );
  }

  if (status === "TIMED_OUT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700">
        <Clock3 className="h-3.5 w-3.5" />

        {statusLabel(status)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700">
      <Clock3 className="h-3.5 w-3.5" />

      {statusLabel(status)}
    </span>
  );
}

function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default InstructorResults;

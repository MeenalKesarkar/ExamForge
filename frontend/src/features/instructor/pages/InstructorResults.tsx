import { useEffect, useMemo, useState } from "react";
import type { Attempt, AttemptListResponse, Exam } from "../results";
import { getStudentEmail, getStudentName } from "../results";
import { StatCard } from "../components/InstructorResultWidgets";
import InstructorAttemptResultsList from "../components/InstructorAttemptResultsList";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileText,
  Loader2,
  Target,
  User,
} from "lucide-react";
import { API_URL } from "../../../config/apiConfig";

// InstructorResults component
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

  const bestAttempts = useMemo(() => {
    const grouped = new Map<string, Attempt[]>();
    for (const attempt of attempts) {
      const student = attempt.student ?? attempt.studentId;
      const key = typeof student === "object" && student
        ? student._id
        : typeof student === "string" ? student : getStudentEmail(attempt) || getStudentName(attempt);
      grouped.set(key, [...(grouped.get(key) || []), attempt]);
    }
    return Array.from(grouped.values()).map((studentAttempts) => {
      const completed = studentAttempts.filter((attempt) => attempt.status !== "IN_PROGRESS");
      const candidates = completed.length ? completed : studentAttempts;
      return candidates.sort((a, b) => {
        const scoreDifference = (b.score ?? 0) - (a.score ?? 0);
        if (scoreDifference) return scoreDifference;
        return new Date(b.submittedAt || b.startTime).getTime() - new Date(a.submittedAt || a.startTime).getTime();
      })[0];
    });
  }, [attempts]);

  const filteredAttempts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return bestAttempts.filter(
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
      bestAttempts,
      search,
      statusFilter,
    ]);

  const stats = useMemo(() => {
    const completed =
      bestAttempts.filter(
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
  }, [attempts.length, bestAttempts]);

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

          <button type="button" onClick={() => navigate("/instructor/results")} className="hidden items-center gap-2 text-slate-600 transition hover:text-indigo-700 sm:flex">
            <BarChart3 className="h-4 w-4 text-indigo-600" />

            <span className="text-sm font-semibold text-slate-600">
              All Results
            </span>
          </button>
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
                Total Questions
              </p>

              <p className="mt-1 text-2xl font-bold">
                {exam?.questionCount ??
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

        <InstructorAttemptResultsList
          attempts={filteredAttempts}
          exam={exam}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onViewDetails={(attemptId) => navigate("/instructor/attempts/" + attemptId)}
        />

      </main>
    </div>
  );
}

export default InstructorResults;

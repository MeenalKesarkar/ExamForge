import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileQuestion,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Target,
  User,
  XCircle,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EVALUATED"
  | "TIMED_OUT";

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  phone?: string;
  city?: string;
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
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
  negativePenalty: number;
}

interface QuestionResult {
  _id: string;
  questionText: string;
  type: "single" | "multi";
  options: string[];
  correctAnswers: string[];
  selectedAnswers: string[];
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
  isAnswered: boolean;
  isCorrect: boolean;
}

interface Attempt {
  _id: string;
  examId: string;
  studentId: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  startTime: string;
  endTime: string;
  submittedAt?: string | null;
  status: AttemptStatus;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  tabSwitchCount?: number;
}

interface Result {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

interface DetailResponse {
  attempt: Attempt;
  student?: Student | null;
  exam: Exam;
  result: Result;
  questions: QuestionResult[];
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

function formatDuration(
  start?: string,
  end?: string | null
): string {
  if (!start || !end) {
    return "—";
  }

  const startTime =
    new Date(start).getTime();

  const endTime =
    new Date(end).getTime();

  if (
    Number.isNaN(startTime) ||
    Number.isNaN(endTime)
  ) {
    return "—";
  }

  const seconds = Math.max(
    0,
    Math.round(
      (endTime - startTime) / 1000
    )
  );

  const minutes = Math.floor(
    seconds / 60
  );

  const remainingSeconds =
    seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function InstructorAttemptDetails() {
  const navigate = useNavigate();
  const { attemptId } = useParams();

  const [data, setData] =
    useState<DetailResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedQuestion,
    setSelectedQuestion,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setError(
        "Attempt ID is missing."
      );
      setLoading(false);
      return;
    }

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/attempts/instructor/${attemptId}`,
            {
              credentials: "include",
            }
          );

        if (response.status === 401) {
          navigate("/", {
            replace: true,
          });
          return;
        }

        if (!response.ok) {
          const responseData =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            responseData?.message ||
              "Unable to load attempt details."
          );
        }

        const resultData: DetailResponse =
          await response.json();

        setData(resultData);

        if (
          resultData.questions.length >
          0
        ) {
          setSelectedQuestion(
            resultData.questions[0]._id
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the result."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [attemptId, navigate]);

  const selectedQuestionData =
    useMemo(() => {
      if (
        !data ||
        !selectedQuestion
      ) {
        return null;
      }

      return (
        data.questions.find(
          (question) =>
            question._id ===
            selectedQuestion
        ) || null
      );
    }, [
      data,
      selectedQuestion,
    ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>

          <p className="mt-4 text-sm text-white/50">
            Loading attempt details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="mt-6 text-2xl font-bold">
            Unable to load result
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/40">
            {error ||
              "The requested attempt could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/instructor")
            }
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const {
    attempt,
    student,
    exam,
    result,
    questions,
  } = data;

  const studentInitial =
    student?.name
      ?.charAt(0)
      .toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="absolute right-0 top-1/3 h-[25rem] w-[25rem] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/instructor/exams/${exam._id}/results`
              )
            }
            className="flex items-center gap-3 text-white/70 transition hover:text-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold">
                Exam Results
              </p>

              <p className="text-xs text-white/35">
                Back to all attempts
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <BarChart3 className="h-4 w-4 text-indigo-400" />

            <span className="text-sm text-white/40">
              Attempt Details
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-purple-600/10 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
                <FileQuestion className="h-3.5 w-3.5" />
                Student Attempt
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {exam.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/45">
                {exam.subject && (
                  <span>
                    {exam.subject}
                  </span>
                )}

                {exam.degree && (
                  <span>
                    {exam.degree}
                  </span>
                )}

                {exam.yearOfStudy && (
                  <span>
                    Year{" "}
                    {exam.yearOfStudy}
                  </span>
                )}

                {exam.semester && (
                  <span>
                    Semester{" "}
                    {exam.semester}
                  </span>
                )}
              </div>
            </div>

            <StatusBadge
              status={attempt.status}
              passed={attempt.passed}
            />
          </div>
        </section>

        {/* Student + Score */}
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Student profile */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                <User className="h-5 w-5 text-indigo-400" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Student Information
                </h2>

                <p className="text-xs text-white/35">
                  Student details for this attempt
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-2xl font-bold text-indigo-300">
                {studentInitial}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold">
                  {student?.name ||
                    "Unknown Student"}
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    icon={
                      <Mail className="h-4 w-4" />
                    }
                    label="Email"
                    value={
                      student?.email ||
                      "—"
                    }
                  />

                  <InfoItem
                    icon={
                      <GraduationCap className="h-4 w-4" />
                    }
                    label="Student ID"
                    value={
                      student?.studentId ||
                      "—"
                    }
                  />

                  <InfoItem
                    icon={
                      <Target className="h-4 w-4" />
                    }
                    label="Academic Year"
                    value={
                      student?.yearOfStudy
                        ? `Year ${student.yearOfStudy}`
                        : "—"
                    }
                  />

                  <InfoItem
                    icon={
                      <BarChart3 className="h-4 w-4" />
                    }
                    label="Semester"
                    value={
                      student?.semester
                        ? `Semester ${student.semester}`
                        : "—"
                    }
                  />

                  {student?.phone && (
                    <InfoItem
                      icon={
                        <Phone className="h-4 w-4" />
                      }
                      label="Phone"
                      value={
                        student.phone
                      }
                    />
                  )}

                  {student?.city && (
                    <InfoItem
                      icon={
                        <User className="h-4 w-4" />
                      }
                      label="City"
                      value={
                        student.city
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Score card */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/30">
                  Final Score
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {result.score}
                  <span className="text-xl text-white/30">
                    {" "}
                    / {result.totalMarks}
                  </span>
                </p>
              </div>

              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                  result.passed
                    ? "bg-emerald-500/10"
                    : "bg-red-500/10"
                }`}
              >
                {result.passed ? (
                  <Award className="h-8 w-8 text-emerald-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-400" />
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-white/35">
                  Percentage
                </span>

                <span className="font-semibold">
                  {result.percentage}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full transition-all ${
                    result.passed
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        result.percentage
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <ResultMetric
                label="Correct"
                value={
                  result.correctCount
                }
                icon={
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                }
              />

              <ResultMetric
                label="Incorrect"
                value={
                  result.incorrectCount
                }
                icon={
                  <XCircle className="h-4 w-4 text-red-400" />
                }
              />

              <ResultMetric
                label="Unanswered"
                value={
                  result.unansweredCount
                }
                icon={
                  <FileQuestion className="h-4 w-4 text-white/30" />
                }
              />
            </div>
          </section>
        </div>

        {/* Attempt metadata */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-indigo-400" />

            <div>
              <h2 className="font-semibold">
                Attempt Information
              </h2>

              <p className="text-xs text-white/35">
                Timing and submission details
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetaCard
              label="Started"
              value={formatDate(
                attempt.startTime
              )}
            />

            <MetaCard
              label="Submitted"
              value={formatDate(
                attempt.submittedAt
              )}
            />

            <MetaCard
              label="Attempt Duration"
              value={formatDuration(
                attempt.startTime,
                attempt.submittedAt ||
                  attempt.endTime
              )}
            />

            <MetaCard
              label="Exam Duration"
              value={`${exam.duration} min`}
            />

            <MetaCard
              label="Tab Switches"
              value={String(
                attempt.tabSwitchCount ??
                  0
              )}
            />
          </div>
        </section>

        {/* Question analysis */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                  Question-wise Analysis
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Review the student's answers and
                  correct answers.
                </p>
              </div>

              <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/40">
                {questions.length} Questions
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr]">
            {/* Question navigation */}
            <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
              <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-white/25">
                Questions
              </p>

              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
                {questions.map(
                  (
                    question,
                    index
                  ) => (
                    <button
                      key={
                        question._id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedQuestion(
                          question._id
                        )
                      }
                      className={`relative flex h-11 items-center justify-center rounded-xl text-xs font-semibold transition ${
                        selectedQuestion ===
                        question._id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                          : question.isCorrect
                            ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            : question.isAnswered
                              ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                              : "bg-white/5 text-white/35 hover:bg-white/10"
                      }`}
                    >
                      {index + 1}

                      <span
                        className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${
                          question.isCorrect
                            ? "bg-emerald-400"
                            : question.isAnswered
                              ? "bg-red-400"
                              : "bg-white/20"
                        }`}
                      />
                    </button>
                  )
                )}
              </div>

              <div className="mt-5 space-y-2 border-t border-white/5 pt-5">
                <Legend
                  className="bg-emerald-500"
                  label="Correct"
                />

                <Legend
                  className="bg-red-500"
                  label="Incorrect"
                />

                <Legend
                  className="bg-white/20"
                  label="Unanswered"
                />
              </div>
            </div>

            {/* Question detail */}
            <div className="p-5 sm:p-6">
              {selectedQuestionData ? (
                <QuestionAnalysis
                  question={
                    selectedQuestionData
                  }
                />
              ) : (
                <div className="py-16 text-center text-sm text-white/35">
                  Select a question to view
                  its details.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   QUESTION ANALYSIS
========================================================= */

function QuestionAnalysis({
  question,
}: {
  question: QuestionResult;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                question.isCorrect
                  ? "bg-emerald-500/10 text-emerald-300"
                  : question.isAnswered
                    ? "bg-red-500/10 text-red-300"
                    : "bg-white/5 text-white/35"
              }`}
            >
              {question.isCorrect
                ? "Correct"
                : question.isAnswered
                  ? "Incorrect"
                  : "Unanswered"}
            </span>

            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/35">
              {question.type ===
              "multi"
                ? "Multiple Choice"
                : "Single Choice"}
            </span>

            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/35">
              {question.marks}{" "}
              {question.marks ===
              1
                ? "mark"
                : "marks"}
            </span>

            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] capitalize text-white/35">
              {question.difficulty}
            </span>
          </div>

          <h3 className="text-lg font-semibold leading-7 text-white/90">
            {question.questionText}
          </h3>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {question.options.map(
          (option, index) => {
            const isSelected =
              question.selectedAnswers.includes(
                option
              );

            const isCorrect =
              question.correctAnswers.includes(
                option
              );

            let optionClass =
              "border-white/10 bg-white/[0.02]";

            if (isCorrect) {
              optionClass =
                "border-emerald-500/30 bg-emerald-500/10";
            } else if (isSelected) {
              optionClass =
                "border-red-500/30 bg-red-500/10";
            }

            return (
              <div
                key={`${option}-${index}`}
                className={`rounded-2xl border p-4 ${optionClass}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                      isCorrect
                        ? "bg-emerald-500/20 text-emerald-300"
                        : isSelected
                          ? "bg-red-500/20 text-red-300"
                          : "bg-white/5 text-white/35"
                    }`}
                  >
                    {String.fromCharCode(
                      65 + index
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-white/75">
                      {option}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {isSelected && (
                        <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[10px] font-medium text-indigo-300">
                          Student selected
                        </span>
                      )}

                      {isCorrect && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-300">
                          Correct answer
                        </span>
                      )}
                    </div>
                  </div>

                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : isSelected ? (
                    <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                  ) : null}
                </div>
              </div>
            );
          }
        )}
      </div>

      {!question.isAnswered && (
        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

            <div>
              <p className="text-sm font-medium text-amber-300">
                Question was unanswered
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-200/50">
                The student did not select an answer
                for this question.
              </p>
            </div>
          </div>
        </div>
      )}

      {question.explanation && (
        <div className="mt-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Explanation
          </p>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="mt-0.5 text-white/25">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-white/25">
          {label}
        </p>

        <p className="mt-1 truncate text-sm text-white/70">
          {value}
        </p>
      </div>
    </div>
  );
}

function ResultMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5">
        {icon}

        <span className="text-[10px] uppercase tracking-wider text-white/25">
          {label}
        </span>
      </div>

      <p className="mt-2 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

function MetaCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase tracking-wider text-white/25">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium leading-5 text-white/70">
        {value}
      </p>
    </div>
  );
}

function Legend({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2 text-xs text-white/35">
      <span
        className={`h-2 w-2 rounded-full ${className}`}
      />

      {label}
    </div>
  );
}

function StatusBadge({
  status,
  passed,
}: {
  status: AttemptStatus;
  passed?: boolean;
}) {
  if (
    status === "SUBMITTED" ||
    status === "EVALUATED"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
          passed
            ? "bg-emerald-500/10 text-emerald-300"
            : "bg-red-500/10 text-red-300"
        }`}
      >
        {passed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}

        {passed
          ? "Passed"
          : "Failed"}
      </span>
    );
  }

  if (status === "TIMED_OUT") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300">
        <Clock3 className="h-4 w-4" />
        Timed Out
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300">
      <Clock3 className="h-4 w-4" />
      In Progress
    </span>
  );
}

export default InstructorAttemptDetails;
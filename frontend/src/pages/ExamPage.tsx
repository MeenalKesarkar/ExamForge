import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  FileQuestion,
  LoaderCircle,
  Send,
  Timer,
  Trophy,
  X,
  XCircle,
} from "lucide-react";

interface Attempt {
  _id: string;
  studentId: string;
  examId: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  startTime: string;
  endTime: string;
  status: string;
}

interface Question {
  _id: string;
  questionText: string;
  type: "single" | "multi";
  options: string[];
  marks: number;
}

interface SubmitResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  status: string;
}

const API_URL = "http://localhost:5000/api";

function ExamPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, string[]>
  >({});

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Difference between server clock and browser clock
  const [serverTimeOffset, setServerTimeOffset] = useState<
    number | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Submit confirmation
  const [showSubmitModal, setShowSubmitModal] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Final result
  const [submitResult, setSubmitResult] =
    useState<SubmitResult | null>(null);

  const [submitError, setSubmitError] = useState("");

  // ==================================================
  // FETCH ATTEMPT AND QUESTIONS
  // ==================================================

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        if (!attemptId) {
          throw new Error("Attempt ID is missing");
        }

        const response = await fetch(
          `${API_URL}/attempts/${attemptId}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load exam"
          );
        }

        setAttempt(data.attempt);
        setQuestions(data.questions);
        setAnswers(data.attempt.answers || {});

        // Calculate server/browser time difference
        if (data.serverNow) {
          const serverTime = new Date(
            data.serverNow
          ).getTime();

          const clientTime = Date.now();

          setServerTimeOffset(
            serverTime - clientTime
          );
        } else {
          setServerTimeOffset(0);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load exam";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  // ==================================================
  // SERVER-BASED COUNTDOWN TIMER
  // ==================================================

  useEffect(() => {
    if (
      !attempt ||
      attempt.status !== "IN_PROGRESS" ||
      serverTimeOffset === null
    ) {
      return;
    }

    const updateTimer = () => {
      const currentServerTime =
        Date.now() + serverTimeOffset;

      const endTime = new Date(
        attempt.endTime
      ).getTime();

      const difference =
        endTime - currentServerTime;

      const seconds = Math.max(
        0,
        Math.floor(difference / 1000)
      );

      setRemainingSeconds(seconds);
    };

    updateTimer();

    const timer = setInterval(
      updateTimer,
      1000
    );

    return () => clearInterval(timer);
  }, [attempt, serverTimeOffset]);

  // ==================================================
  // CHECK EXPIRY ON BACKEND
  // ==================================================

  useEffect(() => {
    if (
      remainingSeconds !== 0 ||
      !attemptId ||
      !attempt ||
      attempt.status !== "IN_PROGRESS"
    ) {
      return;
    }

    const checkExpiry = async () => {
      try {
        const response = await fetch(
          `${API_URL}/attempts/${attemptId}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to check exam status"
          );
        }

        setAttempt(data.attempt);

        setAnswers(
          data.attempt.answers || {}
        );

        if (
          data.attempt.status ===
          "TIMED_OUT"
        ) {
          setError(
            "Time is over. Your exam has ended."
          );
        }
      } catch (err) {
        console.error(
          "Error checking exam expiry:",
          err
        );
      }
    };

    checkExpiry();
  }, [
    remainingSeconds,
    attemptId,
    attempt,
  ]);

  // ==================================================
  // SAVE ANSWER TO BACKEND
  // ==================================================

  const saveAnswer = async (
    questionId: string,
    selectedAnswers: string[]
  ) => {
    try {
      if (!attemptId) {
        return;
      }

      // Update UI immediately
      setAnswers((previous) => ({
        ...previous,
        [questionId]: selectedAnswers,
      }));

      const response = await fetch(
        `${API_URL}/attempts/${attemptId}/answer`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId,
            selectedAnswers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save answer"
        );
      }
    } catch (err) {
      console.error(
        "Error saving answer:",
        err
      );
    }
  };

  // ==================================================
  // SUBMIT EXAM
  // ==================================================

  const submitExam = async () => {
    if (!attemptId || !attempt) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `${API_URL}/attempts/${attemptId}/submit`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit exam"
        );
      }

      setAttempt((previous) =>
        previous
          ? {
              ...previous,
              status: data.result.status,
            }
          : previous
      );

      setShowSubmitModal(false);

      setSubmitResult(data.result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to submit exam";

      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================================================
  // TIMER FORMATTING
  // ==================================================

  const minutes = Math.floor(
    remainingSeconds / 60
  )
    .toString()
    .padStart(2, "0");

  const seconds = (
    remainingSeconds % 60
  )
    .toString()
    .padStart(2, "0");

  // ==================================================
  // ANSWER STATISTICS
  // ==================================================

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter(
      (answer) => answer && answer.length > 0
    ).length;
  }, [answers]);

  const unansweredCount = Math.max(
    questions.length - answeredCount,
    0
  );

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" />
          </div>

          <div className="text-center">
            <p className="font-semibold text-slate-900">
              Loading your exam
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Please wait a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Unable to Load Exam
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/student")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

        </div>
      </div>
    );
  }

  if (!attempt) {
    return null;
  }

  // ==================================================
  // MODERN SUBMISSION RESULT SCREEN
  // ==================================================

  if (submitResult) {
    const passed = submitResult.passed;

    return (
      <div className="min-h-screen bg-slate-50">

        {/* Top Navigation */}
        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                ExamForge
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Exam Result
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/student")
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>

          </div>

        </header>

        <main className="mx-auto max-w-6xl px-6 py-10">

          {/* Success Hero */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-7 py-10 text-white shadow-xl sm:px-10">

            {/* Decorative circles */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

            <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-white/5" />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">

              <div>

                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Exam Submitted Successfully
                </div>

                <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                  Your exam is complete!
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
                  Your answers have been submitted
                  and evaluated by ExamForge. Here
                  is your performance summary.
                </p>

              </div>

              {/* Score Circle */}
              <div className="flex justify-center lg:justify-end">

                <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm">

                  <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white text-slate-900 shadow-xl">

                    <span className="text-4xl font-black tracking-tight">
                      {submitResult.percentage.toFixed(
                        0
                      )}
                      %
                    </span>

                    <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Score
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* Result Cards */}
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* Score */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                  <Trophy className="h-5 w-5 text-indigo-600" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Score
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-slate-900">
                {submitResult.score}

                <span className="text-lg font-semibold text-slate-400">
                  {" "}
                  / {submitResult.totalMarks}
                </span>
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Total marks obtained
              </p>

            </div>

            {/* Percentage */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Percentage
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-slate-900">
                {submitResult.percentage.toFixed(
                  2
                )}
                %
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Overall performance
              </p>

            </div>

            {/* Answered */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Answered
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-slate-900">
                {answeredCount}

                <span className="text-lg font-semibold text-slate-400">
                  {" "}
                  / {questions.length}
                </span>
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Questions attempted
              </p>

            </div>

            {/* Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    passed
                      ? "bg-emerald-50"
                      : "bg-red-50"
                  }`}
                >
                  {passed ? (
                    <Trophy className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Result
                </span>

              </div>

              <p
                className={`mt-5 text-3xl font-black ${
                  passed
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {passed
                  ? "Passed"
                  : "Not Passed"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Final examination status
              </p>

            </div>

          </section>

          {/* Performance Summary */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* Main Summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                  <FileQuestion className="h-6 w-6 text-indigo-600" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Performance Summary
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    A quick overview of your exam
                    attempt.
                  </p>
                </div>

              </div>

              {/* Progress */}
              <div className="mt-8">

                <div className="mb-3 flex items-center justify-between">

                  <span className="text-sm font-semibold text-slate-700">
                    Overall Score
                  </span>

                  <span className="text-sm font-bold text-indigo-600">
                    {submitResult.percentage.toFixed(
                      0
                    )}
                    %
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          submitResult.percentage
                        )
                      )}%`,
                    }}
                  />

                </div>

              </div>

              {/* Answer Breakdown */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl bg-emerald-50 p-5">

                  <div className="flex items-center gap-3">

                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                    <span className="text-sm font-semibold text-emerald-800">
                      Answered Questions
                    </span>

                  </div>

                  <p className="mt-3 text-2xl font-black text-emerald-700">
                    {answeredCount}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-5">

                  <div className="flex items-center gap-3">

                    <AlertCircle className="h-5 w-5 text-slate-500" />

                    <span className="text-sm font-semibold text-slate-700">
                      Unanswered Questions
                    </span>

                  </div>

                  <p className="mt-3 text-2xl font-black text-slate-700">
                    {unansweredCount}
                  </p>

                </div>

              </div>

            </div>

            {/* Result Status */}
            <div
              className={`rounded-3xl border p-7 shadow-sm ${
                passed
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-red-100 bg-red-50"
              }`}
            >

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">

                {passed ? (
                  <Trophy className="h-7 w-7 text-emerald-600" />
                ) : (
                  <XCircle className="h-7 w-7 text-red-600" />
                )}

              </div>

              <h3
                className={`mt-6 text-2xl font-black ${
                  passed
                    ? "text-emerald-900"
                    : "text-red-900"
                }`}
              >
                {passed
                  ? "Congratulations!"
                  : "Exam Completed"}
              </h3>

              <p
                className={`mt-3 text-sm leading-6 ${
                  passed
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                {passed
                  ? "You have successfully passed this examination. Your result has been recorded."
                  : "Your examination has been submitted and your result has been recorded."}
              </p>

              <div className="mt-7 rounded-2xl bg-white/80 p-4">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Final Status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      passed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {submitResult.status}
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* Bottom Action */}
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <ArrowLeft className="h-6 w-6 text-indigo-600" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Ready to continue?
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Return to your student dashboard to
              explore other published exams.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/student")
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Student Dashboard
            </button>

          </section>

        </main>
      </div>
    );
  }

  // ==================================================
  // MAIN EXAM UI
  // ==================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/student")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              title="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                ExamForge
              </h1>

              <p className="text-xs text-slate-500">
                JavaScript Fundamentals Test
              </p>
            </div>

          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 ${
              remainingSeconds <= 60
                ? "border-red-200 bg-red-50"
                : remainingSeconds <= 300
                ? "border-amber-200 bg-amber-50"
                : "border-indigo-200 bg-indigo-50"
            }`}
          >

            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                remainingSeconds <= 60
                  ? "bg-red-100"
                  : remainingSeconds <= 300
                  ? "bg-amber-100"
                  : "bg-indigo-100"
              }`}
            >
              <Timer
                className={`h-5 w-5 ${
                  remainingSeconds <= 60
                    ? "text-red-600"
                    : remainingSeconds <= 300
                    ? "text-amber-600"
                    : "text-indigo-600"
                }`}
              />
            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Time Remaining
              </p>

              <p
                className={`text-lg font-black ${
                  remainingSeconds <= 60
                    ? "text-red-700"
                    : remainingSeconds <= 300
                    ? "text-amber-700"
                    : "text-indigo-700"
                }`}
              >
                {minutes}:{seconds}
              </p>

            </div>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">

        {/* Exam Overview */}
        <section className="mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-7 text-white shadow-xl">

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                <FileQuestion className="h-3.5 w-3.5" />
                Online Examination
              </div>

              <h2 className="text-2xl font-black sm:text-3xl">
                JavaScript Fundamentals Test
              </h2>

              <p className="mt-2 text-sm text-indigo-100">
                Answer all questions carefully
                before submitting your exam.
              </p>

            </div>

            <div className="flex gap-3">

              <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">

                <p className="text-xs text-indigo-100">
                  Questions
                </p>

                <p className="mt-1 text-2xl font-black">
                  {questions.length}
                </p>

              </div>

              <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">

                <p className="text-xs text-indigo-100">
                  Answered
                </p>

                <p className="mt-1 text-2xl font-black">
                  {answeredCount}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* Progress */}
        <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-3 flex items-center justify-between">

            <div>

              <p className="text-sm font-bold text-slate-900">
                Exam Progress
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {answeredCount} of {questions.length}{" "}
                questions answered
              </p>

            </div>

            <span className="text-sm font-bold text-indigo-600">
              {questions.length > 0
                ? Math.round(
                    (answeredCount /
                      questions.length) *
                      100
                  )
                : 0}
              %
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
              style={{
                width: `${
                  questions.length > 0
                    ? (answeredCount /
                        questions.length) *
                      100
                    : 0
                }%`,
              }}
            />

          </div>

        </div>

        {/* Questions */}
        <div className="space-y-6">

          {questions.map(
            (question, index) => {

              const selectedAnswers =
                answers[question._id] || [];

              const isAnswered =
                selectedAnswers.length > 0;

              return (
                <section
                  key={question._id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >

                  {/* Question Header */}
                  <div className="border-b border-slate-100 px-6 py-5 sm:px-7">

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex gap-4">

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                            isAnswered
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                              Question {index + 1}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              {question.type ===
                              "multi"
                                ? "Multiple Choice"
                                : "Single Choice"}
                            </span>

                          </div>

                          <h3 className="mt-2 text-base font-bold leading-7 text-slate-900 sm:text-lg">
                            {question.questionText}
                          </h3>

                        </div>

                      </div>

                      <span className="shrink-0 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                        {question.marks}{" "}
                        {question.marks === 1
                          ? "mark"
                          : "marks"}
                      </span>

                    </div>

                  </div>

                  {/* Options */}
                  <div className="space-y-3 p-6 sm:p-7">

                    {question.options.map(
                      (
                        option,
                        optionIndex
                      ) => {

                        const selected =
                          selectedAnswers.includes(
                            option
                          );

                        return (
                          <label
                            key={optionIndex}
                            className={`group flex items-center gap-4 rounded-2xl border-2 p-4 transition ${
                              selected
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-slate-100 bg-slate-50/50 hover:border-indigo-200 hover:bg-indigo-50/50"
                            } ${
                              attempt.status ===
                              "IN_PROGRESS"
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-60"
                            }`}
                          >

                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                selected
                                  ? "border-indigo-600 bg-indigo-600"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {selected && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>

                            <input
                              type={
                                question.type ===
                                "multi"
                                  ? "checkbox"
                                  : "radio"
                              }
                              name={`question-${question._id}`}
                              checked={selected}
                              disabled={
                                attempt.status !==
                                "IN_PROGRESS"
                              }
                              onChange={() => {

                                const currentAnswers =
                                  answers[
                                    question._id
                                  ] || [];

                                // Single select
                                if (
                                  question.type ===
                                  "single"
                                ) {
                                  saveAnswer(
                                    question._id,
                                    [option]
                                  );

                                  return;
                                }

                                // Multi select
                                const alreadySelected =
                                  currentAnswers.includes(
                                    option
                                  );

                                const updatedAnswers =
                                  alreadySelected
                                    ? currentAnswers.filter(
                                        (
                                          answer
                                        ) =>
                                          answer !==
                                          option
                                      )
                                    : [
                                        ...currentAnswers,
                                        option,
                                      ];

                                saveAnswer(
                                  question._id,
                                  updatedAnswers
                                );
                              }}
                              className="sr-only"
                            />

                            <span
                              className={`text-sm font-medium leading-6 ${
                                selected
                                  ? "text-indigo-900"
                                  : "text-slate-700"
                              }`}
                            >
                              {option}
                            </span>

                          </label>
                        );
                      }
                    )}

                  </div>

                </section>
              );
            }
          )}

        </div>

        {/* Submit Area */}
        {attempt.status ===
          "IN_PROGRESS" && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    Ready to submit?
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {unansweredCount > 0
                      ? `${unansweredCount} question${
                          unansweredCount === 1
                            ? ""
                            : "s"
                        } ${
                          unansweredCount === 1
                            ? "is"
                            : "are"
                        } still unanswered.`
                      : "You have answered all questions."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSubmitModal(true)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" />
                Submit Exam
              </button>

            </div>

          </div>
        )}

      </main>

      {/* ==================================================
          MODERN SUBMIT CONFIRMATION MODAL
      ================================================== */}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-md">

          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">

            {/* Top gradient */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

            <div className="p-7 sm:p-8">

              {!submitting && (
                <button
                  type="button"
                  onClick={() =>
                    setShowSubmitModal(false)
                  }
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <Send className="h-6 w-6 text-indigo-600" />
              </div>

              <h2 className="mt-6 text-2xl font-black text-slate-900">
                Submit your exam?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Once you submit the exam, your
                answers will be evaluated and you
                will not be able to make further
                changes.
              </p>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold text-slate-400">
                    Answered
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {answeredCount}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold text-slate-400">
                    Unanswered
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {unansweredCount}
                  </p>

                </div>

              </div>

              {/* Warning */}
              {unansweredCount > 0 && (
                <div className="mt-5 flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">

                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                  <p className="text-sm leading-6 text-amber-800">
                    You still have{" "}
                    <strong>
                      {unansweredCount}
                    </strong>{" "}
                    unanswered question
                    {unansweredCount === 1
                      ? ""
                      : "s"}
                    . You can still submit, but
                    unanswered questions will not
                    receive marks.
                  </p>

                </div>
              )}

              {/* Error */}
              {submitError && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {submitError}
                </div>
              )}

              {/* Buttons */}
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    setShowSubmitModal(false)
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-5 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue Exam
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitExam}
                  className="flex-1 rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      Yes, Submit
                    </span>
                  )}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default ExamPage;
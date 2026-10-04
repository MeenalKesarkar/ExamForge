import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Loader2,
  Send,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

/* =========================================================
   TYPES
========================================================= */

interface ExamQuestion {
  _id: string;
  examId: string;
  questionText: string;
  type: "single" | "multi";
  options: string[];
  marks: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  order: number;
}

interface AttemptData {
  _id: string;
  examId: string;
  studentId: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  startTime: string;
  endTime: string;
  submittedAt?: string | null;
  status:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "EVALUATED"
    | "TIMED_OUT";
  tabSwitchCount?: number;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
}

interface ExamData {
  _id: string;
  title: string;
  subject?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking?: boolean;
  negativePenalty?: number;
  instructions?: string[];
}

interface AttemptResponse {
  attempt: AttemptData;
  exam: ExamData;
  questions: ExamQuestion[];
  serverNow: string;
  remainingSeconds?: number;
  resultsAvailable?: boolean;
  result?: ExamResult | null;
}

interface ExamResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passingMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  answeredCount: number;
  questionResults?: Array<{
    questionId: string;
    answered: boolean;
    correct: boolean;
    marks: number;
  }>;
}

/* =========================================================
   API
========================================================= */

const API_URL =
  "http://localhost:5000/api";

/* =========================================================
   HELPERS
========================================================= */

const formatTime = (
  totalSeconds: number
) => {
  const safeSeconds = Math.max(
    0,
    totalSeconds
  );

  const hours = Math.floor(
    safeSeconds / 3600
  );

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60
  );

  const seconds =
    safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const getErrorMessage = (
  data: unknown,
  fallback: string
) => {
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof (
      data as { message?: unknown }
    ).message === "string"
  ) {
    return (
      data as {
        message: string;
      }
    ).message;
  }

  return fallback;
};

const normalizeResult = (
  rawResult: Partial<ExamResult>,
  examData: ExamData,
  answerData: Record<string, string[]>,
  questionCount: number
): ExamResult => {
  const answeredCount =
    rawResult.answeredCount ??
    Object.values(answerData).filter(
      (answer) =>
        Array.isArray(answer) &&
        answer.length > 0
    ).length;

  return {
    score: rawResult.score ?? 0,
    totalMarks:
      rawResult.totalMarks ??
      examData.totalMarks,
    percentage:
      rawResult.percentage ?? 0,
    passed: rawResult.passed ?? false,
    passingMarks:
      rawResult.passingMarks ??
      examData.passingMarks,
    correctCount:
      rawResult.correctCount ?? 0,
    incorrectCount:
      rawResult.incorrectCount ?? 0,
    unansweredCount:
      rawResult.unansweredCount ??
      Math.max(
        0,
        questionCount - answeredCount
      ),
    answeredCount,
    questionResults:
      rawResult.questionResults,
  };
};

/* =========================================================
   COMPONENT
========================================================= */

function ExamPage() {
  const {
    attemptId,
  } = useParams<{
    attemptId: string;
  }>();

  const navigate =
    useNavigate();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    attempt,
    setAttempt,
  ] =
    useState<AttemptData | null>(
      null
    );

  const [
    exam,
    setExam,
  ] =
    useState<ExamData | null>(
      null
    );

  const [
    questions,
    setQuestions,
  ] = useState<ExamQuestion[]>(
    []
  );

  const [
    answers,
    setAnswers,
  ] = useState<
    Record<string, string[]>
  >({});

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(0);

  const [
    result,
    setResult,
  ] =
    useState<ExamResult | null>(
      null
    );

  const [
    ,
    setResultsAvailable,
  ] = useState(false);

  const [
    submittedStatus,
    setSubmittedStatus,
  ] =
    useState<
      | "SUBMITTED"
      | "TIMED_OUT"
      | "EVALUATED"
      | null
    >(null);

  const [
    flaggedQuestions,
    setFlaggedQuestions,
  ] = useState<
    Set<string>
  >(new Set());

  const [
    savingQuestionId,
    setSavingQuestionId,
  ] = useState<
    string | null
  >(null);

  /*
   * Difference between the browser clock and
   * the server clock.
   *
   * The server remains authoritative.
   */
  const serverOffsetRef =
    useRef(0);

  const autoSubmitStartedRef =
    useRef(false);

  /* =======================================================
     LOAD ATTEMPT
  ======================================================= */

  const loadAttempt =
    useCallback(
      async () => {
        if (!attemptId) {
          setError(
            "Invalid exam attempt."
          );
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/attempts/${attemptId}`,
              {
                method: "GET",
                credentials:
                  "include",
              }
            );

          let data: AttemptResponse | {
            message?: string;
          };

          try {
            data =
              await response.json();
          } catch {
            data = {};
          }

          if (
            response.status === 401
          ) {
            navigate("/", {
              replace: true,
            });
            return;
          }

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                data,
                "Unable to load this exam."
              )
            );
          }

          const attemptResponse =
            data as AttemptResponse;

          setAttempt(
            attemptResponse.attempt
          );

          setExam(
            attemptResponse.exam
          );

          setQuestions(
            attemptResponse.questions
          );

          setAnswers(
            attemptResponse
              .attempt.answers || {}
          );

          setResultsAvailable(
            Boolean(
              attemptResponse
                .resultsAvailable
            )
          );

          /*
           * Calculate server/browser
           * clock difference.
           */
          const serverTime =
            new Date(
              attemptResponse.serverNow
            ).getTime();

          serverOffsetRef.current =
            serverTime -
            Date.now();

          /*
           * Backend may already tell us
           * the exact remaining time.
           */
          if (
            typeof attemptResponse.remainingSeconds ===
            "number"
          ) {
            setRemainingSeconds(
              attemptResponse.remainingSeconds
            );
          } else {
            const endTime =
              new Date(
                attemptResponse
                  .attempt.endTime
              ).getTime();

            const correctedNow =
              Date.now() +
              serverOffsetRef.current;

            setRemainingSeconds(
              Math.max(
                0,
                Math.floor(
                  (endTime -
                    correctedNow) /
                    1000
                )
              )
            );
          }

          /*
           * Completed attempt.
           */
          if (
            attemptResponse.attempt
              .status !==
            "IN_PROGRESS"
          ) {
            setSubmittedStatus(
              attemptResponse
                .attempt
                .status as
                | "SUBMITTED"
                | "TIMED_OUT"
                | "EVALUATED"
            );

            if (
              attemptResponse.resultsAvailable &&
              attemptResponse.result
            ) {
              setResult(
                normalizeResult(
                  attemptResponse.result,
                  attemptResponse.exam,
                  attemptResponse.attempt.answers || {},
                  attemptResponse.questions.length
                )
              );
            } else {
              setResult(null);
            }
          }
        } catch (err) {
          console.error(
            "Load attempt error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this exam."
          );
        } finally {
          setLoading(false);
        }
      },
      [attemptId, navigate]
    );

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  /* =======================================================
     WAIT FOR RESULTS
     Results become available only after the exam deadline.
  ======================================================= */

  useEffect(() => {
    if (
      !attemptId ||
      !submittedStatus ||
      result
    ) {
      return;
    }

    const checkForPublishedResult =
      async () => {
        try {
          const response =
            await fetch(
              `${API_URL}/attempts/${attemptId}`,
              {
                method: "GET",
                credentials:
                  "include",
              }
            );

          if (!response.ok) {
            return;
          }

          const data =
            (await response.json()) as AttemptResponse;

          setResultsAvailable(
            Boolean(
              data.resultsAvailable
            )
          );

          if (
            data.resultsAvailable &&
            data.result
          ) {
            setResult(
              normalizeResult(
                data.result,
                data.exam,
                data.attempt.answers || {},
                data.questions.length
              )
            );

            setAttempt(
              data.attempt
            );
          }
        } catch (err) {
          console.error(
            "Result availability check error:",
            err
          );
        }
      };

    const interval =
      window.setInterval(
        checkForPublishedResult,
        5000
      );

    void checkForPublishedResult();

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    attemptId,
    submittedStatus,
    result,
  ]);

  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (
      !attempt ||
      attempt.status !==
        "IN_PROGRESS" ||
      submittedStatus
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        const endTime =
          new Date(
            attempt.endTime
          ).getTime();

        const correctedNow =
          Date.now() +
          serverOffsetRef.current;

        const seconds =
          Math.max(
            0,
            Math.floor(
              (endTime -
                correctedNow) /
                1000
            )
          );

        setRemainingSeconds(
          seconds
        );

        if (
          seconds <= 0 &&
          !autoSubmitStartedRef.current
        ) {
          autoSubmitStartedRef.current =
            true;

          void submitExam(
            true
          );
        }
      }, 250);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    attempt,
    submittedStatus,
  ]);

  /* =======================================================
     SAVE ANSWER
  ======================================================= */

  const saveAnswer = async (
    questionId: string,
    selectedAnswers: string[]
  ) => {
    if (
      !attemptId ||
      !attempt ||
      attempt.status !==
        "IN_PROGRESS"
    ) {
      return;
    }

    try {
      setSavingQuestionId(
        questionId
      );

      const response =
        await fetch(
          `${API_URL}/attempts/${attemptId}/answer`,
          {
            method: "PATCH",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              questionId,
              answers: selectedAnswers,
            }),
          }
        );

      let data: unknown = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (
        response.status === 401
      ) {
        navigate("/", {
          replace: true,
        });
        return;
      }

      /*
       * Backend tells us when the exam
       * has expired.
       */
      if (
        response.status === 409
      ) {
        await loadAttempt();
        return;
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to save answer."
          )
        );
      }
    } catch (err) {
      console.error(
        "Save answer error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save answer."
      );
    } finally {
      setSavingQuestionId(
        null
      );
    }
  };

  /* =======================================================
     SELECT ANSWER
  ======================================================= */

  const handleAnswerChange =
    (
      question: ExamQuestion,
      option: string
    ) => {
      if (
        !attempt ||
        attempt.status !==
          "IN_PROGRESS"
      ) {
        return;
      }

      const previous =
        answers[
          question._id
        ] || [];

      let nextAnswers: string[];

      if (
        question.type ===
        "single"
      ) {
        nextAnswers = [
          option,
        ];
      } else {
        if (
          previous.includes(option)
        ) {
          nextAnswers =
            previous.filter(
              (answer) =>
                answer !== option
            );
        } else {
          nextAnswers = [
            ...previous,
            option,
          ];
        }
      }

      setAnswers(
        (current) => ({
          ...current,
          [question._id]:
            nextAnswers,
        })
      );

      void saveAnswer(
        question._id,
        nextAnswers
      );
    };

  /* =======================================================
     SUBMIT EXAM
  ======================================================= */

  async function submitExam(
    automatic = false
  ) {
    if (
      !attemptId ||
      submitting
    ) {
      return;
    }

    /*
     * Prevent normal submit after an attempt
     * has already been completed.
     */
    if (
      attempt &&
      attempt.status !==
        "IN_PROGRESS"
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/attempts/${attemptId}/submit`,
          {
            method: "POST",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      let data: any = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (
        response.status === 401
      ) {
        navigate("/", {
          replace: true,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to submit exam."
          )
        );
      }

      setResultsAvailable(
        Boolean(
          data.resultsAvailable
        )
      );

      setResult(
        data.resultsAvailable &&
          data.result
          ? normalizeResult(
              data.result,
              exam!,
              answers,
              questions.length
            )
          : null
      );

      setSubmittedStatus(
        data.attempt?.status ===
          "TIMED_OUT"
          ? "TIMED_OUT"
          : "SUBMITTED"
      );

      setAttempt(
        (current) =>
          current
            ? {
                ...current,
                status:
                  data.attempt
                    ?.status ||
                  (automatic
                    ? "TIMED_OUT"
                    : "SUBMITTED"),
                submittedAt:
                  data.attempt
                    ?.submittedAt ||
                  new Date().toISOString(),
              }
            : current
      );

      setRemainingSeconds(0);
    } catch (err) {
      console.error(
        "Submit exam error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit exam."
      );

      /*
       * If auto-submit failed because of a
       * temporary network issue, allow another
       * attempt to be triggered.
       */
      if (automatic) {
        autoSubmitStartedRef.current =
          false;
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     TAB SWITCH
  ======================================================= */

  useEffect(() => {
    if (
      !attemptId ||
      !attempt ||
      attempt.status !==
        "IN_PROGRESS"
    ) {
      return;
    }

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "hidden"
        ) {
          void fetch(
            `${API_URL}/attempts/${attemptId}/tab-switch`,
            {
              method: "PATCH",
              credentials:
                "include",
              keepalive: true,
            }
          );
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [
    attemptId,
    attempt,
  ]);

  /* =======================================================
     CURRENT QUESTION
  ======================================================= */

  const currentQuestion =
    questions[currentIndex];

  const currentAnswers =
    currentQuestion
      ? answers[
          currentQuestion._id
        ] || []
      : [];

  /* =======================================================
     STATS
  ======================================================= */

  const answeredCount =
    useMemo(() => {
      return questions.filter(
        (question) =>
          (
            answers[
              question._id
            ] || []
          ).length > 0
      ).length;
    }, [
      answers,
      questions,
    ]);

  const unansweredCount =
    questions.length -
    answeredCount;

  const flaggedCount =
    flaggedQuestions.size;

  const progress =
    questions.length > 0
      ? Math.round(
          (answeredCount /
            questions.length) *
            100
        )
      : 0;

  const isLowTime =
    remainingSeconds <=
    5 * 60;

  const isCriticalTime =
    remainingSeconds <=
    60;

  /* =======================================================
     TOGGLE FLAG
  ======================================================= */

  const toggleFlag = (
    questionId: string
  ) => {
    setFlaggedQuestions(
      (current) => {
        const next =
          new Set(current);

        if (
          next.has(questionId)
        ) {
          next.delete(
            questionId
          );
        } else {
          next.add(questionId);
        }

        return next;
      }
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your exam...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RESULTS PENDING POPUP
  ======================================================= */

  if (
    submittedStatus
  ) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
          <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-white px-6 py-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
              Exam Submitted
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Your exam has been submitted
            </h1>
          </div>

          <div className="px-6 py-7 text-center">
            <p className="text-sm leading-6 text-slate-600">
              {submittedStatus === "TIMED_OUT"
                ? "Your exam time has ended and your answers have been submitted automatically."
                : "Your answers have been submitted successfully."}
            </p>

            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
              <p className="text-sm font-semibold text-indigo-800">
                Results will be announced soon.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Your score will be displayed after the exam deadline.
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              This page will automatically check for your result.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/student")
              }
              className="mt-6 w-full rounded-2xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RESULT SCREEN
  ======================================================= */

  if (
    submittedStatus &&
    result
  ) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-4xl">

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-white px-6 py-10 text-center sm:px-10">

              {result.passed ? (
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
              ) : (
                <AlertCircle className="mx-auto h-16 w-16 text-amber-600" />
              )}

              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {submittedStatus ===
                "TIMED_OUT"
                  ? "Time Expired"
                  : "Exam Completed"}
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                {exam?.title ||
                  "Exam Result"}
              </h1>

              <p className="mt-2 text-slate-500">
                {exam?.subject ||
                  "Assessment Result"}
              </p>

            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Score
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {result.score}
                  <span className="text-lg text-slate-400">
                    {" "}
                    /{" "}
                    {result.totalMarks}
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Percentage
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {result.percentage}%
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Correct
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {result.correctCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Incorrect
                </p>

                <p className="mt-2 text-3xl font-bold text-rose-600">
                  {result.incorrectCount}
                </p>
              </div>

            </div>

            <div className="grid gap-4 px-6 pb-6 sm:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Answered
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {result.answeredCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Unanswered
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {result.unansweredCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Passing Marks
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {result.passingMarks}
                </p>
              </div>

            </div>

            <div className="border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/student"
                  )
                }
                className="w-full rounded-2xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700"
              >
                Back to Dashboard
              </button>
            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =======================================================
     NO ATTEMPT
  ======================================================= */

  if (
    !attempt ||
    !exam ||
    !currentQuestion
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <div className="max-w-md text-center">

          <AlertCircle className="mx-auto h-12 w-12 text-rose-600" />

          <h1 className="mt-5 text-2xl font-bold">
            Unable to load exam
          </h1>

          <p className="mt-2 text-slate-500">
            {error ||
              "This exam attempt could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/student"
              )
            }
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>

        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN EXAM UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          TOP HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              ExamForge
            </p>

            <h1 className="truncate text-base font-bold sm:text-lg">
              {exam.title}
            </h1>

            <p className="hidden text-xs text-slate-500 sm:block">
              {exam.subject ||
                "Online Assessment"}
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 ${
              isCriticalTime
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : isLowTime
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            <Clock3 className="h-5 w-5" />

            <div>
              <p className="hidden text-[10px] uppercase tracking-wider opacity-50 sm:block">
                Time Remaining
              </p>

              <p className="font-mono text-lg font-bold">
                {formatTime(
                  remainingSeconds
                )}
              </p>
            </div>
          </div>

        </div>

        {/* Progress */}
        <div className="h-1 bg-slate-200">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

      </header>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span>
              {error}
            </span>
          </div>
        </div>
      )}

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* =================================================
              QUESTION
          ================================================= */}

          <section>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

              {/* Question Header */}

              <div className="flex items-start justify-between gap-4">

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      Question{" "}
                      {currentIndex + 1}{" "}
                      /{" "}
                      {questions.length}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {currentQuestion.marks}{" "}
                      {currentQuestion.marks ===
                      1
                        ? "mark"
                        : "marks"}
                    </span>

                    {currentQuestion
                      .type ===
                      "multi" && (
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        Select all that apply
                      </span>
                    )}

                  </div>

                  <h2 className="mt-5 text-xl font-bold leading-relaxed sm:text-2xl">
                    {
                      currentQuestion.questionText
                    }
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    toggleFlag(
                      currentQuestion._id
                    )
                  }
                  className={`shrink-0 rounded-xl border p-2.5 transition ${
                    flaggedQuestions.has(
                      currentQuestion._id
                    )
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                  }`}
                  title={
                    flaggedQuestions.has(
                      currentQuestion._id
                    )
                      ? "Unflag question"
                      : "Flag question"
                  }
                >
                  <Flag className="h-5 w-5" />
                </button>

              </div>

              {/* Options */}

              <div className="mt-8 space-y-3">

                {currentQuestion.options.map(
                  (
                    option,
                    optionIndex
                  ) => {
                    const selected =
                      currentAnswers.includes(
                        option
                      );

                    const inputId = `${currentQuestion._id}-${optionIndex}`;

                    return (
                      <label
                        key={option}
                        htmlFor={inputId}
                        className={`group flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                          selected
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50"
                        }`}
                      >

                        <input
                          id={inputId}
                          type={
                            currentQuestion.type ===
                            "multi"
                              ? "checkbox"
                              : "radio"
                          }
                          name={
                            currentQuestion._id
                          }
                          checked={selected}
                          onChange={() =>
                            handleAnswerChange(
                              currentQuestion,
                              option
                            )
                          }
                          className="sr-only"
                        />

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold ${
                            selected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(
                            65 +
                              optionIndex
                          )}
                        </span>

                        <span
                          className={`flex-1 text-sm leading-6 sm:text-base ${
                            selected
                              ? "text-slate-900"
                              : "text-slate-700"
                          }`}
                        >
                          {option}
                        </span>

                        {selected && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600" />
                        )}

                      </label>
                    );
                  }
                )}

              </div>

              {/* Save status */}

              <div className="mt-5 flex min-h-5 items-center justify-end text-xs text-slate-500">

                {savingQuestionId ===
                  currentQuestion._id && (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving answer...
                  </span>
                )}

              </div>

              {/* Navigation */}

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">

                <button
                  type="button"
                  disabled={
                    currentIndex ===
                    0
                  }
                  onClick={() =>
                    setCurrentIndex(
                      (index) =>
                        Math.max(
                          0,
                          index - 1
                        )
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {currentIndex <
                questions.length -
                  1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIndex(
                        (index) =>
                          Math.min(
                            questions.length -
                              1,
                            index + 1
                          )
                      )
                    }
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={() =>
                      void submitExam(
                        false
                      )
                    }
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Exam
                      </>
                    )}
                  </button>
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* Summary */}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <h3 className="font-semibold">
                  Exam Progress
                </h3>

                <span className="text-sm text-slate-500">
                  {progress}%
                </span>

              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Answered
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-600">
                    {answeredCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Remaining
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {unansweredCount}
                  </p>
                </div>

              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  Flagged
                </p>

                <p className="mt-1 text-xl font-bold text-amber-600">
                  {flaggedCount}
                </p>
              </div>

            </div>

            {/* Question Navigator */}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

              <h3 className="font-semibold">
                Questions
              </h3>

              <div className="mt-4 grid grid-cols-5 gap-2">

                {questions.map(
                  (
                    question,
                    index
                  ) => {
                    const answered =
                      (
                        answers[
                          question._id
                        ] || []
                      ).length >
                      0;

                    const flagged =
                      flaggedQuestions.has(
                        question._id
                      );

                    const active =
                      index ===
                      currentIndex;

                    return (
                      <button
                        key={
                          question._id
                        }
                        type="button"
                        onClick={() =>
                          setCurrentIndex(
                            index
                          )
                        }
                        className={`relative flex h-10 items-center justify-center rounded-xl text-xs font-semibold transition ${
                          active
                            ? "bg-indigo-600 text-white ring-2 ring-indigo-300/30"
                            : answered
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        {index + 1}

                        {flagged && (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* Instructions */}

            {exam.instructions &&
              exam.instructions.length >
                0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

                  <h3 className="font-semibold">
                    Instructions
                  </h3>

                  <ul className="mt-3 space-y-2">

                    {exam.instructions.map(
                      (
                        instruction,
                        index
                      ) => (
                        <li
                          key={
                            `${instruction}-${index}`
                          }
                          className="flex gap-2 text-xs leading-5 text-slate-600"
                        >
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-600" />

                          <span>
                            {instruction}
                          </span>
                        </li>
                      )
                    )}

                  </ul>

                </div>
              )}

            {/* Submit */}

            <button
              type="button"
              disabled={
                submitting
              }
              onClick={() =>
                void submitExam(
                  false
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Exam
                </>
              )}
            </button>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default ExamPage;

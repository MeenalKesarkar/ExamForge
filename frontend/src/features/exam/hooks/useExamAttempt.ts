import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AttemptData, AttemptResponse, ExamData, ExamQuestion, ExamResult } from "../types";
import { API_URL } from "../../../config/apiConfig";
const MAX_FOCUS_LOSSES = 3;

interface SubmitResponse {
  message?: string;
  resultsAvailable?: boolean;
  result?: Partial<ExamResult> | null;
  attempt?: { status?: AttemptData["status"]; submittedAt?: string | null };
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message;
  }
  return fallback;
}

function normalizeResult(
  raw: Partial<ExamResult>,
  exam: ExamData,
  answers: Record<string, string[]>,
  questionCount: number,
): ExamResult {
  const answeredCount = raw.answeredCount ?? Object.values(answers).filter((value) => Array.isArray(value) && value.length > 0).length;
  return {
    score: raw.score ?? 0,
    totalMarks: raw.totalMarks ?? exam.totalMarks,
    percentage: raw.percentage ?? 0,
    passed: raw.passed ?? false,
    passingMarks: raw.passingMarks ?? exam.passingMarks,
    correctCount: raw.correctCount ?? 0,
    incorrectCount: raw.incorrectCount ?? 0,
    unansweredCount: raw.unansweredCount ?? Math.max(0, questionCount - answeredCount),
    answeredCount,
    questionResults: raw.questionResults,
  };
}

export function useExamAttempt() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [, setResultsAvailable] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<"SUBMITTED" | "TIMED_OUT" | "EVALUATED" | null>(null);
  const [focusWarning, setFocusWarning] = useState("");
  const [proctoringDisqualified, setProctoringDisqualified] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(() => new Set());
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const serverOffsetRef = useRef(0);
  const autoSubmitStartedRef = useRef(false);
  const focusLossRecordedRef = useRef(false);

  const loadAttempt = useCallback(async () => {
    if (!attemptId) {
      setError("Invalid exam attempt.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/attempts/${attemptId}`, { credentials: "include" });
      const data: AttemptResponse | { message?: string } = await response.json().catch(() => ({}));
      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      if (!response.ok) throw new Error(getErrorMessage(data, "Unable to load this exam."));

      const loaded = data as AttemptResponse;
      setAttempt(loaded.attempt);
      setProctoringDisqualified(Boolean(loaded.attempt.proctoringDisqualified));
      setExam(loaded.exam);
      setQuestions(loaded.questions);
      setAnswers(loaded.attempt.answers || {});
      setResultsAvailable(Boolean(loaded.resultsAvailable));
      serverOffsetRef.current = new Date(loaded.serverNow).getTime() - Date.now();
      const remaining = loaded.remainingSeconds ?? Math.floor((new Date(loaded.attempt.endTime).getTime() - (Date.now() + serverOffsetRef.current)) / 1000);
      setRemainingSeconds(Math.max(0, remaining));
      setTimerPaused(Boolean(loaded.timerPaused ?? loaded.attempt.timerPaused));

      if (loaded.attempt.status !== "IN_PROGRESS") {
        setSubmittedStatus(loaded.attempt.status);
        setResult(loaded.resultsAvailable && loaded.result
          ? normalizeResult(loaded.result, loaded.exam, loaded.attempt.answers || {}, loaded.questions.length)
          : null);
      }
    } catch (loadError) {
      console.error("Load attempt error:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Unable to load this exam.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => { void loadAttempt(); }, [loadAttempt]);

  useEffect(() => {
    if (!attemptId || !submittedStatus || result) return;
    const checkForPublishedResult = async () => {
      try {
        const response = await fetch(`${API_URL}/attempts/${attemptId}`, { credentials: "include" });
        if (!response.ok) return;
        const data = await response.json() as AttemptResponse;
        setResultsAvailable(Boolean(data.resultsAvailable));
        if (data.resultsAvailable && data.result) {
          setResult(normalizeResult(data.result, data.exam, data.attempt.answers || {}, data.questions.length));
          setAttempt(data.attempt);
        }
      } catch (pollError) {
        console.error("Result availability check error:", pollError);
      }
    };
    const interval = window.setInterval(() => void checkForPublishedResult(), 5000);
    void checkForPublishedResult();
    return () => window.clearInterval(interval);
  }, [attemptId, submittedStatus, result]);

  const submitExam = useCallback(async (automatic = false) => {
    if (!attemptId || submitting || (attempt && attempt.status !== "IN_PROGRESS")) return;
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch(`${API_URL}/attempts/${attemptId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch((): SubmitResponse => ({})) as SubmitResponse;
      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      if (!response.ok) throw new Error(getErrorMessage(data, "Failed to submit exam."));

      setResultsAvailable(Boolean(data.resultsAvailable));
      setResult(data.resultsAvailable && data.result && exam
        ? normalizeResult(data.result, exam, answers, questions.length)
        : null);
      setSubmittedStatus(data.attempt?.status === "TIMED_OUT" ? "TIMED_OUT" : "SUBMITTED");
      setAttempt((current) => current ? {
        ...current,
        status: data.attempt?.status || (automatic ? "TIMED_OUT" : "SUBMITTED"),
        submittedAt: data.attempt?.submittedAt || new Date().toISOString(),
      } : current);
      setRemainingSeconds(0);
    } catch (submitError) {
      console.error("Submit exam error:", submitError);
      setError(submitError instanceof Error ? submitError.message : "Failed to submit exam.");
      if (automatic) autoSubmitStartedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [attempt, attemptId, answers, exam, navigate, questions.length, submitting]);

  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS" || submittedStatus || timerPaused) return;
    const interval = window.setInterval(() => {
      const seconds = Math.max(0, remainingSeconds - 1);
      setRemainingSeconds(seconds);
      if (seconds <= 0 && !autoSubmitStartedRef.current) {
        autoSubmitStartedRef.current = true;
        void submitExam(true);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [attempt, remainingSeconds, submitExam, submittedStatus, timerPaused]);

  useEffect(() => {
    if (!attemptId || !attempt || attempt.status !== "IN_PROGRESS" || submittedStatus || timerPaused) return;
    const syncTimer = async () => {
      try {
        const response = await fetch(`${API_URL}/attempts/${attemptId}/heartbeat`, {
          method: "PATCH", credentials: "include",
        });
        if (!response.ok) return;
        const data = await response.json() as { remainingSeconds?: number; timerPaused?: boolean; status?: AttemptData["status"]; serverNow?: string };
        if (data.status && data.status !== "IN_PROGRESS") {
          await loadAttempt();
          return;
        }
        if (typeof data.remainingSeconds === "number") setRemainingSeconds(data.remainingSeconds);
        if (data.serverNow) serverOffsetRef.current = new Date(data.serverNow).getTime() - Date.now();
        if (data.timerPaused) setTimerPaused(true);
      } catch (syncError) {
        console.error("Exam timer sync error:", syncError);
      }
    };
    const interval = window.setInterval(() => void syncTimer(), 5000);
    const pauseOnExit = () => {
      void fetch(`${API_URL}/attempts/${attemptId}/pause`, {
        method: "PATCH", credentials: "include", keepalive: true,
      });
    };
    window.addEventListener("pagehide", pauseOnExit);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", pauseOnExit);
    };
  }, [attempt, attemptId, loadAttempt, submittedStatus, timerPaused]);

  const resumeTimer = useCallback(async () => {
    if (!attemptId) return;
    try {
      const response = await fetch(`${API_URL}/attempts/${attemptId}/resume`, {
        method: "PATCH", credentials: "include",
      });
      const data = await response.json().catch(() => ({})) as { message?: string; remainingSeconds?: number; serverNow?: string };
      if (!response.ok) throw new Error(data.message || "Unable to resume this exam.");
      if (typeof data.remainingSeconds === "number") setRemainingSeconds(data.remainingSeconds);
      if (data.serverNow) serverOffsetRef.current = new Date(data.serverNow).getTime() - Date.now();
      setTimerPaused(false);
      setError("");
    } catch (resumeError) {
      setError(resumeError instanceof Error ? resumeError.message : "Unable to resume this exam.");
    }
  }, [attemptId]);

  const saveAnswer = useCallback(async (questionId: string, selectedAnswers: string[]) => {
    if (!attemptId || !attempt || attempt.status !== "IN_PROGRESS") return;
    try {
      setSavingQuestionId(questionId);
      const response = await fetch(`${API_URL}/attempts/${attemptId}/answer`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answers: selectedAnswers }),
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      if (response.status === 409) {
        await loadAttempt();
        return;
      }
      if (!response.ok) throw new Error(getErrorMessage(data, "Failed to save answer."));
    } catch (saveError) {
      console.error("Save answer error:", saveError);
      setError(saveError instanceof Error ? saveError.message : "Failed to save answer.");
    } finally {
      setSavingQuestionId(null);
    }
  }, [attempt, attemptId, loadAttempt, navigate]);

  const handleAnswerChange = useCallback((question: ExamQuestion, option: string) => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;
    const previous = answers[question._id] || [];
    const nextAnswers = question.type === "single"
      ? [option]
      : previous.includes(option)
        ? previous.filter((answer) => answer !== option)
        : [...previous, option];
    setAnswers((current) => ({ ...current, [question._id]: nextAnswers }));
    void saveAnswer(question._id, nextAnswers);
  }, [answers, attempt, saveAnswer]);

  useEffect(() => {
    if (!attemptId || !attempt || attempt.status !== "IN_PROGRESS") return;
    const resetFocusLoss = () => {
      focusLossRecordedRef.current = false;
    };

    const recordFocusLoss = () => {
      if (focusLossRecordedRef.current) return;
      focusLossRecordedRef.current = true;

      void fetch(`${API_URL}/attempts/${attemptId}/tab-switch`, {
        method: "PATCH",
        credentials: "include",
        keepalive: true,
      })
        .then(async (response) => {
          if (!response.ok) return;
          const data = await response.json() as { tabSwitchCount?: number; terminated?: boolean };
          if (typeof data.tabSwitchCount === "number") {
            setAttempt((current) => current
              ? { ...current, tabSwitchCount: data.tabSwitchCount }
              : current);
            if (data.terminated) {
              setProctoringDisqualified(true);
              setSubmittedStatus("SUBMITTED");
              setAttempt((current) => current
                ? { ...current, status: "SUBMITTED", proctoringDisqualified: true }
                : current);
            } else {
              setFocusWarning(
                `Focus loss warning ${data.tabSwitchCount} of ${MAX_FOCUS_LOSSES}. Keep this exam tab active; the attempt ends at ${MAX_FOCUS_LOSSES}.`
              );
            }
          }
        })
        .catch((focusError) => {
          focusLossRecordedRef.current = false;
          console.error("Unable to record exam focus loss:", focusError);
        });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") recordFocusLoss();
      else resetFocusLoss();
    };

    const handleBlur = () => {
      if (document.visibilityState === "visible") recordFocusLoss();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", resetFocusLoss);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", resetFocusLoss);
    };
  }, [attempt, attemptId]);

  const currentQuestion = questions[currentIndex];
  const currentAnswers = currentQuestion ? answers[currentQuestion._id] || [] : [];
  const answeredCount = useMemo(() => questions.filter((question) => (answers[question._id] || []).length > 0).length, [answers, questions]);
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flaggedQuestions.size;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isLowTime = remainingSeconds <= 5 * 60;
  const isCriticalTime = remainingSeconds <= 60;

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  return {
    loading, submitting, error, attempt, exam, questions, answers,
    currentIndex, setCurrentIndex, remainingSeconds, result, submittedStatus,
    timerPaused, resumeTimer,
    focusWarning, proctoringDisqualified,
    flaggedQuestions, savingQuestionId, currentQuestion, currentAnswers,
    answeredCount, unansweredCount, flaggedCount, progress, isLowTime,
    isCriticalTime, tabSwitchCount: attempt?.tabSwitchCount ?? 0,
    handleAnswerChange, toggleFlag, submitExam,
    returnToDashboard: () => navigate("/student", { replace: true }),
  };
}

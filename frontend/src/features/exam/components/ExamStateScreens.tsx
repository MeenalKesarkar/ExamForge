import {
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { ExamData, ExamResult } from "../types";

interface ExamStateScreensProps {
  submittedStatus?: "SUBMITTED" | "TIMED_OUT" | "EVALUATED" | null;
  result?: ExamResult | null;
  exam?: ExamData | null;
  error?: string;
  onBack: () => void;
}

export function ExamLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-4 text-sm text-slate-500">Loading your exam...</p>
      </div>
    </div>
  );
}

export function ExamSubmittedScreen({ submittedStatus, onBack }: ExamStateScreensProps) {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-white px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Exam Submitted</p>
          <h1 className="mt-2 text-2xl font-bold">Your exam has been submitted</h1>
        </div>
        <div className="px-6 py-7 text-center">
          <p className="text-sm leading-6 text-slate-600">
            {submittedStatus === "TIMED_OUT"
              ? "Your exam time has ended and your answers have been submitted automatically."
              : "Your answers have been submitted successfully."}
          </p>
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
            <p className="text-sm font-semibold text-indigo-800">Results will be announced soon.</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Your score will be displayed after the exam deadline.</p>
          </div>
          <p className="mt-4 text-xs text-slate-500">This page will automatically check for your result.</p>
          <button type="button" onClick={onBack} className="mt-6 w-full rounded-2xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExamResultScreen({ result, exam, submittedStatus, onBack }: ExamStateScreensProps) {
  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <header className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-white px-6 py-10 text-center sm:px-10">
          {result.passed ? <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /> : <AlertCircle className="mx-auto h-16 w-16 text-amber-600" />}
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {submittedStatus === "TIMED_OUT" ? "Time Expired" : "Exam Completed"}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{exam?.title || "Exam Result"}</h1>
          <p className="mt-2 text-slate-500">{exam?.subject || "Assessment Result"}</p>
        </header>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard label="Score" value={result.score} suffix={` / ${result.totalMarks}`} />
          <ScoreCard label="Percentage" value={`${result.percentage}%`} />
          <ScoreCard label="Correct" value={result.correctCount} valueClass="text-emerald-600" />
          <ScoreCard label="Incorrect" value={result.incorrectCount} valueClass="text-rose-600" />
        </div>
        <div className="grid gap-4 px-6 pb-6 sm:grid-cols-3">
          <ScoreCard label="Answered" value={result.answeredCount} />
          <ScoreCard label="Unanswered" value={result.unansweredCount} />
          <ScoreCard label="Passing Marks" value={result.passingMarks} />
        </div>
        <footer className="border-t border-slate-100 p-6">
          <button type="button" onClick={onBack} className="w-full rounded-2xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700">
            Back to Dashboard
          </button>
        </footer>
      </div>
    </div>
  );
}

export function ExamLoadErrorScreen({ error, onBack }: ExamStateScreensProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-600" />
        <h1 className="mt-5 text-2xl font-bold">Unable to load exam</h1>
        <p className="mt-2 text-slate-500">{error || "This exam attempt could not be loaded."}</p>
        <button type="button" onClick={onBack} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  suffix = "",
  valueClass = "",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}<span className="text-lg text-slate-400">{suffix}</span></p>
    </div>
  );
}

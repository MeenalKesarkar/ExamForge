import React from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EVALUATED"
  | "TIMED_OUT";

export interface Student {
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

export interface Exam {
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

export interface QuestionResult {
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

export interface Attempt {
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

export interface Result {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

export interface DetailResponse {
  attempt: Attempt;
  student?: Student | null;
  exam: Exam;
  result: Result;
  questions: QuestionResult[];
}

export function formatDate(
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

export function formatDuration(
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

// QuestionAnalysis component
export function QuestionAnalysis({
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
                  ? "bg-emerald-50 text-emerald-700"
                    : question.isAnswered
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {question.isCorrect
                ? "Correct"
                : question.isAnswered
                  ? "Incorrect"
                  : "Unanswered"}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
              {question.type ===
              "multi"
                ? "Multiple Choice"
                : "Single Choice"}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
              {question.marks}{" "}
              {question.marks ===
              1
                ? "mark"
                : "marks"}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] capitalize text-slate-600">
              {question.difficulty}
            </span>
          </div>

          <h3 className="text-lg font-semibold leading-7 text-slate-900">
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
              "border-slate-200 bg-white";

            if (isCorrect) {
                optionClass =
                  "border-emerald-200 bg-emerald-50";
            } else if (isSelected) {
                optionClass =
                  "border-red-200 bg-red-50";
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
                        ? "bg-emerald-100 text-emerald-700"
                        : isSelected
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {String.fromCharCode(
                      65 + index
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-slate-700">
                      {option}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {isSelected && (
                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700">
                          Student selected
                        </span>
                      )}

                      {isCorrect && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
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
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <p className="text-sm font-medium text-amber-900">
                Question was unanswered
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                The student did not select an answer
                for this question.
              </p>
            </div>
          </div>
        </div>
      )}

      {question.explanation && (
        <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Explanation
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-700">
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

// InfoItem component
export function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mt-0.5 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <p className="mt-1 truncate text-sm text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

// ResultMetric component
export function ResultMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5">
        {icon}

        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-2 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

// MetaCard component
export function MetaCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium leading-5 text-slate-700">
        {value}
      </p>
    </div>
  );
}

// Legend component
export function Legend({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
      <span
        className={`h-2 w-2 rounded-full ${className}`}
      />

      {label}
    </div>
  );
}

// StatusBadge component
export function StatusBadge({
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
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700"
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
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
        <Clock3 className="h-4 w-4" />
        Timed Out
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
      <Clock3 className="h-4 w-4" />
      In Progress
    </span>
  );
}


import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  Send,
} from "lucide-react";
import type { ExamQuestion } from "../types";

interface ExamQuestionPanelProps {
  question: ExamQuestion;
  index: number;
  total: number;
  selectedAnswers: string[];
  flagged: boolean;
  saving: boolean;
  submitting: boolean;
  onAnswer: (question: ExamQuestion, option: string) => void;
  onFlag: (questionId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

// ExamQuestionPanel component
export default function ExamQuestionPanel({
  question,
  index,
  total,
  selectedAnswers,
  flagged,
  saving,
  submitting,
  onAnswer,
  onFlag,
  onPrevious,
  onNext,
  onSubmit,
}: ExamQuestionPanelProps) {
  return (
    <section>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Question {index + 1} / {total}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{question.marks} {question.marks === 1 ? "mark" : "marks"}</span>
              {question.type === "multi" && <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">Select all that apply</span>}
            </div>
            <h2 className="mt-5 text-xl font-bold leading-relaxed sm:text-2xl">{question.questionText}</h2>
          </div>
          <button
            type="button"
            onClick={() => onFlag(question._id)}
            className={`shrink-0 rounded-xl border p-2.5 transition ${flagged ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"}`}
            title={flagged ? "Unflag question" : "Flag question"}
          >
            <Flag className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 space-y-3">
          {question.options.map((option, optionIndex) => {
            const selected = selectedAnswers.includes(option);
            const inputId = `${question._id}-${optionIndex}`;
            return (
              <label
                key={option}
                htmlFor={inputId}
                className={`group flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${selected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50"}`}
              >
                <input
                  id={inputId}
                  type={question.type === "multi" ? "checkbox" : "radio"}
                  name={question._id}
                  checked={selected}
                  onChange={() => onAnswer(question, option)}
                  className="sr-only"
                />
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className={`flex-1 text-sm leading-6 sm:text-base ${selected ? "text-slate-900" : "text-slate-700"}`}>{option}</span>
                {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600" />}
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex min-h-5 items-center justify-end text-xs text-slate-500">
          {saving && <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving answer...</span>}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
          <button type="button" disabled={index === 0} onClick={onPrevious} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />Previous
          </button>
          {index < total - 1 ? (
            <button type="button" onClick={onNext} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
              Next<ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" disabled={submitting} onClick={onSubmit} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : <><Send className="h-4 w-4" />Submit Exam</>}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

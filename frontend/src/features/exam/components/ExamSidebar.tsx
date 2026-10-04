import { Loader2, Send } from "lucide-react";
import type { ExamData, ExamQuestion } from "../types";

interface ExamSidebarProps {
  exam: ExamData;
  questions: ExamQuestion[];
  answers: Record<string, string[]>;
  flaggedQuestions: Set<string>;
  currentIndex: number;
  progress: number;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  tabSwitchCount: number;
  submitting: boolean;
  onSelectQuestion: (index: number) => void;
  onSubmit: () => void;
}

export default function ExamSidebar({
  exam,
  questions,
  answers,
  flaggedQuestions,
  currentIndex,
  progress,
  answeredCount,
  unansweredCount,
  flaggedCount,
  tabSwitchCount,
  submitting,
  onSelectQuestion,
  onSubmit,
}: ExamSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Exam Progress</h3>
          <span className="text-sm text-slate-500">{progress}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <SummaryCard label="Answered" value={answeredCount} valueClass="text-emerald-600" />
          <SummaryCard label="Remaining" value={unansweredCount} />
        </div>
        <div className="mt-3"><SummaryCard label="Flagged" value={flaggedCount} valueClass="text-amber-600" /></div>
        <div className="mt-3"><SummaryCard label="Tab switches / blur" value={tabSwitchCount} valueClass={tabSwitchCount > 0 ? "text-rose-600" : "text-slate-700"} /></div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Questions</h3>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const answered = (answers[question._id] || []).length > 0;
            const flagged = flaggedQuestions.has(question._id);
            const active = index === currentIndex;
            return (
              <button
                key={question._id}
                type="button"
                onClick={() => onSelectQuestion(index)}
                className={`relative flex h-10 items-center justify-center rounded-xl text-xs font-semibold transition ${active ? "bg-indigo-600 text-white ring-2 ring-indigo-300/30" : answered ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"}`}
              >
                {index + 1}
                {flagged && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </div>
      </section>

      {exam.instructions && exam.instructions.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Instructions</h3>
          <ul className="mt-3 space-y-2">
            {exam.instructions.map((instruction, index) => (
              <li key={`${instruction}-${index}`} className="flex gap-2 text-xs leading-5 text-slate-600">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-600" />
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900">Exam monitoring</h3>
        <p className="mt-1 text-xs leading-5 text-amber-800">
          Keep this tab active and close other tabs or applications. This browser cannot inspect background apps. Three focus losses end the attempt and block another attempt.
        </p>
      </section>

      <button type="button" disabled={submitting} onClick={onSubmit} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : <><Send className="h-4 w-4" />Submit Exam</>}
      </button>
    </aside>
  );
}

function SummaryCard({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

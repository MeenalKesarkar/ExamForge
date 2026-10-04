import { Clock3, Trophy } from "lucide-react";
import type { StudentResult } from "../types";

interface StudentResultsSectionProps {
  results: StudentResult[];
  loading: boolean;
  formatDateTime: (value?: string | null) => string;
}

export default function StudentResultsSection({
  results, loading, formatDateTime,
}: StudentResultsSectionProps) {
  return (
    <section id="student-results" className="mt-10">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-600">
                  Your progress
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Results
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Exam results unlock after the exam deadline.
              </p>
              {loading ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                  Loading your results...
                </div>
              ) : results.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  Completed exam results will appear here.
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {results.map((item) => (
                    <article
                      key={item.attemptId}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {item.exam.title}
                          </h3>
                          {item.exam.subject && (
                            <p className="mt-1 text-sm text-slate-500">
                              {item.exam.subject}
                            </p>
                          )}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.resultsAvailable
                            ? item.result?.passed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {item.resultsAvailable
                            ? item.result?.passed ? "Passed" : "Not passed"
                            : "Locked"}
                        </span>
                      </div>
                      {item.resultsAvailable && item.result ? (
                        <div className="mt-5 rounded-xl bg-indigo-50 p-4">
                          <p className="text-sm font-medium text-indigo-700">
                            Score
                          </p>
                          <p className="mt-1 text-2xl font-extrabold text-indigo-950">
                            {item.result.score} / {item.result.totalMarks}
                          </p>
                          <p className="mt-1 text-sm text-indigo-700">
                            {item.result.percentage}%
                          </p>
                        </div>
                      ) : (
                        <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                          <Clock3 className="h-4 w-4 shrink-0 text-amber-600" />
                          Available after {item.exam.endDate
                            ? formatDateTime(item.exam.endDate)
                            : "the exam deadline"}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
  );
}

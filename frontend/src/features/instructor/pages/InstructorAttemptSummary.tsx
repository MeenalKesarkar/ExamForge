import { Award, CheckCircle2, Clock3, FileQuestion, XCircle } from "lucide-react";
import { formatDate, formatDuration, MetaCard, ResultMetric } from "./InstructorAttemptDetailsShared";
import type { Attempt, Exam, Result } from "./InstructorAttemptDetailsShared";

// AttemptScoreSummary component
export function AttemptScoreSummary({ result, questionCount }: { result: Result; questionCount: number }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Questions Correct
                    </p>
    
                    <p className="mt-2 text-4xl font-bold">
                      {result.correctCount}
                      <span className="text-xl text-slate-400">
                        {" "}
                        / {questionCount}
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
                    <span className="text-slate-500">
                      Score Percentage
                    </span>
    
                    <span className="font-semibold">
                      {result.percentage}%
                    </span>
                  </div>
    
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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
                      <FileQuestion className="h-4 w-4 text-slate-400" />
                    }
                  />
                </div>
              </section>
  );
}

// AttemptInformation component
export function AttemptInformation({ attempt, exam }: { attempt: Attempt; exam: Exam }) {
  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-indigo-600" />
    
                <div>
                  <h2 className="font-semibold">
                    Attempt Information
                  </h2>
    
                  <p className="text-xs text-slate-500">
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
  );
}

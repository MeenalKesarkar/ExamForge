import { Clock3, FileText, Search } from "lucide-react";
import type { Attempt, Exam } from "../results";
import { formatDate, getStudentEmail, getStudentName } from "../results";
import { MobileMetric, StatusBadge } from "./InstructorResultWidgets";

interface InstructorAttemptResultsListProps {
  attempts: Attempt[];
  exam: Exam | null;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "ALL" | Attempt["status"];
  onStatusFilterChange: (value: "ALL" | Attempt["status"]) => void;
  onViewDetails: (attemptId: string) => void;
}

// InstructorAttemptResultsList component
export default function InstructorAttemptResultsList({ attempts, exam, search, onSearchChange, statusFilter, onStatusFilterChange, onViewDetails }: InstructorAttemptResultsListProps) {
  return (
    <>
      {/* Controls */}
            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    
                  <input
                    value={search}
                    onChange={(event) =>
                      onSearchChange(
                        event.target.value
                      )
                    }
                    placeholder="Search student name or email..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
    
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["ALL", "All"],
                      [
                        "SUBMITTED",
                        "Submitted",
                      ],
                      [
                        "EVALUATED",
                        "Evaluated",
                      ],
                      [
                        "TIMED_OUT",
                        "Timed Out",
                      ],
                      [
                        "IN_PROGRESS",
                        "In Progress",
                      ],
                    ] as const
                  ).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          onStatusFilterChange(
                            value
                          )
                        }
                        className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                          statusFilter ===
                          value
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>
            </section>
    
            {/* Results */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">
                      Best Student Results
                    </h2>
    
                    <p className="mt-1 text-xs text-slate-500">
                      {
                        attempts.length
                      }{" "}
                      student result{attempts.length === 1 ? "" : "s"} shown · highest score per student
                    </p>
                  </div>
                </div>
              </div>
    
              {attempts.length ===
              0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                    <FileText className="h-6 w-6 text-indigo-500" />
                  </div>
    
                  <h3 className="mt-5 font-semibold">
                    No attempts found
                  </h3>
    
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    There are no student attempts
                    matching the current search
                    or filter.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[850px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Student
                          </th>
    
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Questions Correct
                          </th>
    
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Score Percentage
                          </th>
    
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Status
                          </th>
    
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Submitted
                          </th>
    
                          <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>
    
                      <tbody>
                        {attempts.map(
                          (attempt) => (
                            <tr
                              key={
                                attempt._id
                              }
                              className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/30"
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                                    {getStudentName(
                                      attempt
                                    )
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>
    
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {getStudentName(
                                        attempt
                                      )}
                                    </p>
    
                                    <p className="mt-1 text-xs text-slate-500">
                                      {getStudentEmail(
                                        attempt
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>
    
                              <td className="px-6 py-5">
                                <span className="text-sm font-semibold">
                                  {attempt.correctCount ??
                                    0}
                                  /
                                  {exam?.questionCount ??
                                    0}
                                </span>
                              </td>
    
                              <td className="px-6 py-5">
                                <span className="text-sm font-medium">
                                  {attempt.percentage ??
                                    0}
                                  %
                                </span>
                              </td>
    
                              <td className="px-6 py-5">
                                <StatusBadge
                                  status={
                                    attempt.status
                                  }
                                  passed={
                                    attempt.passed
                                  }
                                />
                              </td>
    
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Clock3 className="h-3.5 w-3.5" />
    
                                  {formatDate(
                                    attempt.submittedAt
                                  )}
                                </div>
                              </td>
    
                              <td className="px-6 py-5 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onViewDetails(attempt._id)
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
    
                  {/* Mobile cards */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {attempts.map(
                      (attempt) => (
                        <div
                          key={
                            attempt._id
                          }
                          className="p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                                {getStudentName(
                                  attempt
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>
    
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {getStudentName(
                                    attempt
                                  )}
                                </p>
    
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {getStudentEmail(
                                    attempt
                                  )}
                                </p>
                              </div>
                            </div>
    
                            <StatusBadge
                              status={
                                attempt.status
                              }
                              passed={
                                attempt.passed
                              }
                            />
                          </div>
    
                          <div className="mt-5 grid grid-cols-3 gap-3">
                            <MobileMetric
                              label="Questions Correct"
                              value={`${attempt.correctCount ?? 0}/${exam?.questionCount ?? 0}`}
                            />
    
                            <MobileMetric
                              label="Score Percentage"
                              value={`${attempt.percentage ?? 0}%`}
                            />
    
                            <MobileMetric
                              label="Tabs"
                              value={String(
                                attempt.tabSwitchCount ??
                                  0
                              )}
                            />
                          </div>
    
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-500">
                              {formatDate(
                                attempt.submittedAt
                              )}
                            </span>
    
                            <button
                              type="button"
                              onClick={() =>
                                onViewDetails(attempt._id)
                              }
                              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </section>
    </>
  );
}

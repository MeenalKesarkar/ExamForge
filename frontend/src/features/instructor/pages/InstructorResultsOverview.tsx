import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InstructorAttemptResultsList from "../components/InstructorAttemptResultsList";
import type { Attempt } from "../results";
import { API_URL } from "../../../config/apiConfig";

interface ExamResultGroup {
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
  resultsHidden?: boolean;
  attempts: Attempt[];
}

// InstructorResultsOverview component
export default function InstructorResultsOverview() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ExamResultGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingExamId, setUpdatingExamId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Attempt["status"]>("ALL");

  useEffect(() => {
    let active = true;

    const loadGroups = async () => {
      try {
        setLoading(true);
        setError("");
        const examResponse = await fetch(`${API_URL}/exams/instructor`, { credentials: "include" });

        if (examResponse.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (!examResponse.ok) {
          const data = await examResponse.json().catch(() => null);
          throw new Error(data?.message || "Unable to load your exams.");
        }

        const exams = await examResponse.json() as Omit<ExamResultGroup, "attempts">[];
        const resultGroups = await Promise.all(exams.map(async (exam) => {
          const response = await fetch(`${API_URL}/attempts/exam/${exam._id}/results`, { credentials: "include" });
          if (response.status === 401) {
            navigate("/", { replace: true });
            throw new Error("Your session has expired.");
          }
          if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.message || `Unable to load results for ${exam.title}.`);
          }
          const data = await response.json() as { attempts?: Attempt[] };
          return { ...exam, attempts: data.attempts || [] };
        }));

        if (active) setGroups(resultGroups);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load exam results.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadGroups();
    return () => { active = false; };
  }, [navigate]);

  const setResultsVisible = async (examId: string, visible: boolean) => {
    try {
      setUpdatingExamId(examId);
      setError("");
      const response = await fetch(`${API_URL}/exams/${examId}/results-visibility`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible }),
      });
      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to update results visibility.");
      setGroups((current) => current.map((group) =>
        group._id === examId ? { ...group, resultsHidden: !visible } : group
      ));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update results visibility.");
    } finally {
      setUpdatingExamId(null);
    }
  };

  const visibleGroups = groups.filter((group) => !group.resultsHidden);
  const hiddenGroups = groups.filter((group) => group.resultsHidden);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate("/instructor")} className="flex items-center gap-3 text-slate-600 transition hover:text-indigo-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"><ArrowLeft className="h-5 w-5" /></span>
            <span className="text-left"><span className="block text-sm font-semibold">Instructor Dashboard</span><span className="block text-xs text-slate-500">Back to exams</span></span>
          </button>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><BarChart3 className="h-4 w-4" /> Results</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-7 rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 p-7 text-white shadow-xl shadow-indigo-100">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">Instructor results</p>
          <h1 className="mt-2 text-3xl font-extrabold">Results by exam</h1>
          <p className="mt-2 text-sm text-indigo-100">Each exam keeps its own attempts until you hide that results group.</p>
        </section>

        {error && <div role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-bold">No exams yet</h2>
            <p className="mt-2 text-sm text-slate-500">Your exam results will appear here, grouped by exam.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleGroups.map((group) => (
              <section key={group._id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold">{group.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{group.subject || "Assessment"} | {group.attempts.length} attempts</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => navigate(`/instructor/exams/${group._id}/results`)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Open results</button>
                    <button type="button" disabled={updatingExamId === group._id} onClick={() => void setResultsVisible(group._id, false)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                      <EyeOff className="h-4 w-4" /> Hide results
                    </button>
                  </div>
                </div>
                <InstructorAttemptResultsList
                  attempts={group.attempts}
                  exam={group}
                  search={search}
                  onSearchChange={setSearch}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  onViewDetails={(attemptId) => navigate(`/instructor/attempts/${attemptId}`)}
                />
              </section>
            ))}

            {hiddenGroups.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold">Hidden results</h2>
                <p className="mt-1 text-sm text-slate-500">Hidden results remain stored and can be restored at any time.</p>
                <div className="mt-4 divide-y divide-slate-100">
                  {hiddenGroups.map((group) => (
                    <div key={group._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div><p className="font-semibold">{group.title}</p><p className="text-xs text-slate-500">{group.attempts.length} attempts saved</p></div>
                      <button type="button" disabled={updatingExamId === group._id} onClick={() => void setResultsVisible(group._id, true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                        <Eye className="h-4 w-4" /> Restore results
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

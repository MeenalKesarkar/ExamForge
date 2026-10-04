import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, GraduationCap, RefreshCw, Search, UserRound, UserRoundCheck, UserRoundX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../apiConfig";

interface StudentRecord {
  _id: string;
  name: string;
  email: string;
  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  studentId?: string;
  classSection?: string;
  isActive: boolean;
  isGraduated: boolean;
  graduatedAt?: string;
}

function academicLabel(student: StudentRecord) {
  return `Year ${student.yearOfStudy ?? "—"} · Semester ${student.semester ?? "—"}`;
}

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/admin/students`, { credentials: "include", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (response.status === 401) { navigate("/", { replace: true }); return; }
      if (!response.ok) throw new Error(data.message || "Unable to load students.");
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStudents(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => !query || `${student.name} ${student.email} ${student.studentId || ""}`.toLowerCase().includes(query));
  }, [search, students]);

  const updateStudent = async (student: StudentRecord, action: "promote" | "graduate") => {
    const prompt = action === "promote"
      ? `Promote ${student.name} from semester ${student.semester ?? "unknown"} to the next semester?`
      : `Mark ${student.name} as graduated and deactivate their login? Their exam history will be kept.`;
    if (!window.confirm(prompt)) return;
    setBusyId(student._id); setError(""); setNotice("");
    try {
      const response = await fetch(`${API_URL}/admin/students/${encodeURIComponent(student._id)}/${action}`, {
        method: "PATCH", credentials: "include", headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (response.status === 401) { navigate("/", { replace: true }); return; }
      if (!response.ok) throw new Error(data.message || "Unable to update this student.");
      setNotice(data.message || "Student record updated.");
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this student.");
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = students.filter((student) => student.isActive && !student.isGraduated).length;
  const graduatedCount = students.filter((student) => student.isGraduated || !student.isActive).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-700" aria-label="Back to admin dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            <div><p className="text-sm font-semibold text-slate-500">Administrator portal</p><h1 className="text-2xl font-extrabold tracking-tight">Student records</h1></div>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/profile" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">My profile</Link>
            <button type="button" onClick={() => { setLoading(true); void loadStudents(); }} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
          </div>
        </header>

        <section className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><GraduationCap className="h-6 w-6" /></span><div><h2 className="text-xl font-extrabold">Manage student progression</h2><p className="mt-1 text-sm text-indigo-100">Promote students one semester at a time or archive graduates without deleting their exam history.</p></div></div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <Stat icon={<UserRoundCheck className="h-5 w-5" />} label="Active students" value={activeCount} />
          <Stat icon={<UserRoundX className="h-5 w-5" />} label="Graduated or inactive" value={graduatedCount} />
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-extrabold">Approved students</h2><p className="mt-1 text-sm text-slate-500">Promotions update academic eligibility; graduation disables sign-in and retains all attempts.</p></div>
            <label className="relative block w-full sm:max-w-xs"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, ID" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></label>
          </div>
          {error && <div role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
          {notice && <div role="status" className="m-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{notice}</div>}
          {loading ? <p className="p-12 text-center text-sm font-semibold text-slate-500">Loading student records…</p> : visibleStudents.length === 0 ? <div className="p-12 text-center"><UserRound className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No students found</p><p className="mt-1 text-sm text-slate-500">Try another search or approve student applications first.</p></div> : (
            <div className="divide-y divide-slate-100">
              {visibleStudents.map((student) => {
                const graduated = student.isGraduated || !student.isActive;
                return <article key={student._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-extrabold text-indigo-700">{student.name.trim().charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate font-bold">{student.name}</p><p className="truncate text-sm text-slate-500">{student.email}{student.studentId ? ` · ${student.studentId}` : ""}</p><p className="mt-1 text-xs font-semibold text-slate-500">{student.degree || "BCA"} · {academicLabel(student)}{student.classSection ? ` · Section ${student.classSection}` : ""}</p></div></div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">{graduated ? <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{student.isGraduated ? "Graduated" : "Inactive"}</span> : <><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Active</span><button type="button" onClick={() => void updateStudent(student, "promote")} disabled={busyId === student._id} className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50">{busyId === student._id ? "Saving…" : "Promote semester"}</button><button type="button" onClick={() => void updateStudent(student, "graduate")} disabled={busyId === student._id} className="rounded-xl bg-indigo-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-800 disabled:opacity-50">Graduate</button></>}</div>
                </article>;
              })}
            </div>
          )}
        </section>
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Graduated students remain in the database so historical attempts and results are still available.</p>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">{icon}</span><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="text-2xl font-extrabold">{value}</p></div></div>;
}

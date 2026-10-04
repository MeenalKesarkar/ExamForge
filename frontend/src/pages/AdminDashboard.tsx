import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Clock3, GraduationCap, LogOut, RefreshCw, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { logout } from "../redux/slices/authSlice";
import { logoutUser } from "../services/authService";

const API_URL = "http://localhost:5000/api";
type ApplicantRole = "student" | "instructor";
type RequestFilter = "all" | ApplicantRole;
type Decision = "approve" | "reject";
interface TeachingAssignment { subject: string; degree: string; yearOfStudy: number; semesters: number[]; classSections: string[]; }
interface AccountRequest {
  _id: string; name: string; email: string; role: ApplicantRole; institution?: string;
  degree?: string; yearOfStudy?: number; semester?: number; studentId?: string;
  classSection?: string; teachingAssignments?: TeachingAssignment[]; createdAt?: string;
}
const formatDate = (value?: string) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const getInitials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "EF";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const admin = useAppSelector((state) => state.auth.user);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [filter, setFilter] = useState<RequestFilter>("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<{ id: string; action: Decision } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch(API_URL + "/admin/requests", { credentials: "include", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (response.status === 401) { navigate("/", { replace: true }); return; }
      if (!response.ok) throw new Error(data.message || "Could not load account requests.");
      setError("");
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load account requests.");
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRequests(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRequests]);
  const visibleRequests = useMemo(
    () => filter === "all" ? requests : requests.filter((request) => request.role === filter),
    [filter, requests],
  );
  const decideRequest = async (request: AccountRequest, action: Decision) => {
    setBusy({ id: request._id, action }); setError(""); setNotice("");
    try {
      const response = await fetch(API_URL + "/admin/requests/" + encodeURIComponent(request._id) + "/" + action, {
        method: "PATCH", credentials: "include", headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (response.status === 401) { navigate("/", { replace: true }); return; }
      if (!response.ok) throw new Error(data.message || "Could not update this request.");
      setRequests((current) => current.filter((item) => item._id !== request._id));
      setNotice(action === "approve"
        ? request.name + " is approved and can now sign in with the password they registered with."
        : request.name + "’s request was declined.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this request.");
    } finally { setBusy(null); }
  };
  const handleLogout = async () => { await logoutUser(); dispatch(logout()); navigate("/", { replace: true }); };
  const studentCount = requests.filter((request) => request.role === "student").length;
  const instructorCount = requests.length - studentCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate("/admin")} className="flex items-center gap-3 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 text-white shadow-lg shadow-indigo-200"><GraduationCap className="h-6 w-6" aria-hidden="true" /></span>
            <span><span className="block text-lg font-extrabold tracking-tight">ExamForge</span><span className="block text-xs font-semibold text-slate-500">Administrator portal</span></span>
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/admin/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700" aria-label="Open admin profile"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><UserRound className="h-4 w-4" /></span><span className="hidden max-w-36 truncate sm:block">{admin?.name || "My profile"}</span></Link>
            <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" aria-label="Sign out"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 p-6 text-white shadow-xl shadow-indigo-200/60 sm:p-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-50"><ShieldCheck className="h-4 w-4" /> Administration workspace</div><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Account requests</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">Review student and instructor applications. Approved applicants can sign in immediately with the password they created during registration.</p></div><div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm"><p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Pending applications</p><p className="mt-1 text-3xl font-extrabold">{requests.length}</p></div></div>
        </section>
        <section className="mt-6 grid gap-4 sm:grid-cols-3"><SummaryCard icon={<Clock3 className="h-5 w-5" />} label="Awaiting review" value={requests.length} /><SummaryCard icon={<GraduationCap className="h-5 w-5" />} label="Students" value={studentCount} /><SummaryCard icon={<Users className="h-5 w-5" />} label="Instructors" value={instructorCount} /></section>
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-extrabold tracking-tight">Review applications</h2><p className="mt-1 text-sm text-slate-500">Applicant passwords are securely hashed and stored in MongoDB when they register.</p></div><button type="button" onClick={() => { setLoading(true); void loadRequests(); }} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"><RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /> Refresh</button></div>
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter requests">{(["all", "student", "instructor"] as RequestFilter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={"rounded-xl px-4 py-2 text-sm font-bold transition " + (filter === item ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700")}>{item === "all" ? "All requests" : item === "student" ? "Students" : "Instructors"}</button>)}</div>
          {error && <div role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          {notice && <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}
          {loading ? <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-semibold text-slate-500">Loading account requests…</div> : visibleRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Check className="h-7 w-7" /></span><h3 className="mt-4 text-lg font-extrabold">{requests.length === 0 ? "You’re all caught up" : "No matching requests"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{requests.length === 0 ? "New student and instructor applications will appear here after they register." : "Choose another filter to review the remaining applications."}</p></div>
          ) : <div className="grid gap-4 lg:grid-cols-2">{visibleRequests.map((request) => (
            <article key={request._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
              <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 font-extrabold text-indigo-700">{getInitials(request.name)}</span><div className="min-w-0"><h3 className="truncate font-extrabold">{request.name}</h3><p className="truncate text-sm text-slate-500">{request.email}</p></div></div><span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold capitalize text-indigo-700">{request.role}</span></div>
              <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><Detail label="Institution" value={request.institution || "Not provided"} /><Detail label="Submitted" value={formatDate(request.createdAt)} />{request.role === "student" ? <><Detail label="Student ID" value={request.studentId || "Not provided"} /><Detail label="Program / year" value={[request.degree, request.yearOfStudy ? "Year " + request.yearOfStudy : ""].filter(Boolean).join(" · ") || "Not provided"} /><Detail label="Semester" value={request.semester ? String(request.semester) : "Not provided"} /><Detail label="Section" value={request.classSection || "Not provided"} /></> : <div className="sm:col-span-2"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Teaching assignments</p>{request.teachingAssignments?.length ? <div className="flex flex-wrap gap-2">{request.teachingAssignments.map((assignment, index) => <span key={assignment.subject + index} className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{assignment.subject} · {assignment.degree} · Year {assignment.yearOfStudy}</span>)}</div> : <p className="text-sm text-slate-500">Not provided</p>}</div>}</div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => void decideRequest(request, "reject")} disabled={busy?.id === request._id} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><X className="h-4 w-4" />{busy?.id === request._id && busy.action === "reject" ? "Declining…" : "Decline"}</button><button type="button" onClick={() => void decideRequest(request, "approve")} disabled={busy?.id === request._id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"><Check className="h-4 w-4" />{busy?.id === request._id && busy.action === "approve" ? "Approving…" : "Approve account"}</button></div>
            </article>
          ))}</div>}
        </section>
      </main>
    </div>
  );
}
function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</span><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="text-2xl font-extrabold tracking-tight">{value}</p></div></div>;
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words font-semibold text-slate-700">{value}</p></div>;
}

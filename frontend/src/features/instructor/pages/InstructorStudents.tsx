import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CircleCheck,
  Clock3,
  GraduationCap,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { API_URL } from "../../../config/apiConfig";

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  classSection?: string;
  isActive: boolean;
  eligibleExamCount: number;
  attemptCount: number;
  attendedExamCount: number;
  inProgressExamCount: number;
}

// InstructorStudents component
function InstructorStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      try {
        const response = await fetch(
          `${API_URL}/profile/instructor/students`,
          { credentials: "include" }
        );

        if (response.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load students.");
        }

        if (isMounted) {
          setStudents(Array.isArray(data.students) ? data.students : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load students.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadStudents();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      [student.name, student.email, student.studentId]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [students, search]);

  const activeCount = students.filter((student) => student.isActive).length;
  const attendedCount = students.filter((student) => student.attendedExamCount > 0).length;
  const attemptCount = students.reduce((sum, student) => sum + student.attemptCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/instructor")}
            className="inline-flex items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-indigo-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ArrowLeft className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold text-slate-900">Instructor Dashboard</span>
              <span className="block text-xs text-slate-500">Back to workspace</span>
            </span>
          </button>
          <span className="hidden items-center gap-2 text-sm font-bold text-indigo-700 sm:flex">
            <Users className="h-4 w-4" /> Students
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 p-6 text-white shadow-xl shadow-indigo-100 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="h-4 w-4" /> Teaching groups
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Students</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                Students in the year, semester, and class sections assigned to your teaching profile.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Matching students</p>
              <p className="mt-1 text-3xl font-extrabold">{students.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Users className="h-5 w-5" />} label="Students" value={students.length} />
          <Metric icon={<CircleCheck className="h-5 w-5" />} label="Active accounts" value={activeCount} />
          <Metric icon={<BookOpen className="h-5 w-5" />} label="Attended exams" value={attendedCount} />
          <Metric icon={<Activity className="h-5 w-5" />} label="Total attempts" value={attemptCount} />
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Your student groups</h2>
              <p className="mt-1 text-sm text-slate-500">Exam activity is counted across your published exams eligible for each student.</p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, or student ID"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm font-semibold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading students...
            </div>
          ) : error ? (
            <div className="m-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">{error}</div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Users className="h-7 w-7" /></div>
              <h3 className="mt-4 font-bold text-slate-900">No students found</h3>
              <p className="mt-1 text-sm text-slate-500">Approved students matching your teaching assignments will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                    <Head>Student</Head><Head>Academic group</Head><Head>Account</Head><Head>Exam attendance</Head><Head>Attempts</Head>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-sm font-extrabold text-indigo-700">{student.name.charAt(0).toUpperCase()}</span>
                          <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{student.name}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{student.email}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="block font-semibold text-slate-800">{student.degree || "—"} · Year {student.yearOfStudy ?? "—"}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">Semester {student.semester ?? "—"}{student.classSection ? ` · Section ${student.classSection}` : ""}</span>
                      </td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${student.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{student.isActive ? "Active" : "Inactive"}</span></td>
                      <td className="px-6 py-4">
                        {student.attendedExamCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"><CircleCheck className="h-3.5 w-3.5" /> {student.attendedExamCount} attended</span>
                        ) : <span className="text-sm text-slate-400">Not attended</span>}
                        {student.inProgressExamCount > 0 && (
                          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"><Clock3 className="h-3.5 w-3.5" /> {student.inProgressExamCount} in progress</span>
                        )}
                        <span className="mt-1 block text-xs text-slate-500">of {student.eligibleExamCount} eligible exams</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{student.attemptCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Metric component
function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</span><span className="text-2xl font-extrabold text-slate-900">{value}</span></div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

// Head component
function Head({ children }: { children: ReactNode }) {
  return <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{children}</th>;
}

export default InstructorStudents;

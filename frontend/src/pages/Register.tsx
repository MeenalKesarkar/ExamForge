import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { useAppDispatch } from "../redux/hooks";
import { login } from "../redux/slices/authSlice";
import {
  registerUser,
  type TeachingAssignment,
} from "../services/authService";

type Role = "student" | "instructor";

type AssignmentForm = TeachingAssignment & {
  semesterText: string;
  classSectionsText: string;
};

const yearSemesterMap: Record<number, number[]> = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
};

const createAssignment = (): AssignmentForm => ({
  subject: "",
  degree: "BCA",
  yearOfStudy: 1,
  semesters: [1],
  classSections: ["A"],
  semesterText: "1",
  classSectionsText: "A",
});

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [degree, setDegree] = useState("BCA");
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [semester, setSemester] = useState(1);
  const [studentId, setStudentId] = useState("");
  const [classSection, setClassSection] = useState("A");

  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [assignments, setAssignments] = useState<AssignmentForm[]>([
    createAssignment(),
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableSemesters = useMemo(
    () => yearSemesterMap[yearOfStudy],
    [yearOfStudy]
  );

  const inputClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6347ff] focus:bg-white focus:ring-4 focus:ring-[#6347ff]/10 disabled:cursor-not-allowed disabled:opacity-60";

  const selectClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#6347ff] focus:bg-white focus:ring-4 focus:ring-[#6347ff]/10 disabled:cursor-not-allowed disabled:opacity-60";

  const updateYear = (value: number) => {
    setYearOfStudy(value);
    setSemester(yearSemesterMap[value][0]);
  };

  const updateAssignment = (
    index: number,
    field: keyof AssignmentForm,
    value: string | number
  ) => {
    setAssignments((current) =>
      current.map((assignment, assignmentIndex) => {
        if (assignmentIndex !== index) return assignment;

        if (field === "yearOfStudy") {
          const nextYear = Number(value);
          const nextSemester = yearSemesterMap[nextYear][0];
          return {
            ...assignment,
            yearOfStudy: nextYear,
            semesters: [nextSemester],
            semesterText: String(nextSemester),
          };
        }

        return {
          ...assignment,
          [field]: value,
        };
      })
    );
  };

  const handleAssignmentSemesters = (
    index: number,
    value: string
  ) => {
    const numbers = value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item, position, array) =>
        [1, 2, 3, 4, 5, 6].includes(item) &&
        array.indexOf(item) === position
      );

    setAssignments((current) =>
      current.map((assignment, assignmentIndex) =>
        assignmentIndex === index
          ? {
              ...assignment,
              semesterText: value,
              semesters: numbers,
            }
          : assignment
      )
    );
  };

  const handleAssignmentSections = (
    index: number,
    value: string
  ) => {
    const sections = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setAssignments((current) =>
      current.map((assignment, assignmentIndex) =>
        assignmentIndex === index
          ? {
              ...assignment,
              classSectionsText: value,
              classSections: sections,
            }
          : assignment
      )
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "student") {
      if (!studentId.trim() || !classSection.trim()) {
        setError("Student ID and class section are required.");
        return;
      }
    }

    if (role === "instructor") {
      if (!institution.trim()) {
        setError("Institution is required for instructor registration.");
        return;
      }

      if (
        assignments.some(
          (assignment) =>
            !assignment.subject.trim() ||
            assignment.semesters.length === 0 ||
            assignment.classSections.length === 0
        )
      ) {
        setError(
          "Complete every teaching assignment before registering."
        );
        return;
      }
    }

    try {
      setLoading(true);

      const result = await registerUser({
        name: normalizedName,
        email: normalizedEmail,
        password,
        role,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        ...(role === "student"
          ? {
              degree,
              yearOfStudy,
              semester,
              studentId: studentId.trim(),
              classSection: classSection.trim(),
            }
          : {
              institution: institution.trim(),
              teachingAssignments: assignments.map(
                ({ semesterText, classSectionsText, ...assignment }) =>
                  assignment
              ),
            }),
      });

      dispatch(login({ user: result.user }));
      setSuccess("Registration successful. Redirecting...");

      window.setTimeout(() => {
        navigate(
          result.user.role === "student" ? "/student" : "/instructor",
          { replace: true }
        );
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#05091f]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
        <section className="relative hidden min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#15104f] via-[#24117c] to-[#6d16df] lg:flex lg:w-[46%] xl:w-[48%]">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-10 py-10 xl:px-14 2xl:px-16">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    ExamForge
                  </h1>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/90 ring-1 ring-white/15">
                    V1.0
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/60">
                  Academic Assessment Platform
                </p>
              </div>
            </div>

            <div className="max-w-xl py-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
                <GraduationCap className="h-4 w-4" />
                Join ExamForge
              </div>

              <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white xl:text-5xl 2xl:text-6xl">
                Create.
                <br />
                <span className="bg-gradient-to-r from-white via-purple-100 to-fuchsia-200 bg-clip-text text-transparent">
                  Learn.
                </span>
                <br />
                Achieve.
              </h2>

              <p className="mt-6 max-w-lg text-sm leading-7 text-white/65 xl:text-base">
                Create your ExamForge account and access the assessment portal
                based on your academic role.
              </p>

              <div className="mt-9 space-y-3">
                <Feature title="Student & Instructor Accounts" />
                <Feature title="Personalized Academic Portals" />
                <Feature title="Secure Authentication" />
              </div>
            </div>

            <div className="text-xs text-white/40">
              © 2026 ExamForge • Built for academic excellence.
            </div>
          </div>
        </section>

        <section className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-8 sm:px-6 sm:py-10 md:px-8 lg:w-[54%] lg:px-10 xl:w-[52%] xl:px-14">
          <div className="w-full max-w-[720px]">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#5138ff]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(17,25,54,0.10)]">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#4f39ff] via-[#6937ff] to-[#b10cff]" />

              <div className="p-5 sm:p-7 md:p-9 lg:p-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-xl bg-[#f0efff] px-3 py-2 text-sm font-semibold text-[#4f39ff]">
                  <GraduationCap className="h-4 w-4" />
                  Create your ExamForge account
                </div>

                <h2 className="text-3xl font-extrabold tracking-tight text-[#111936] sm:text-[34px]">
                  Join ExamForge 👋
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                  Choose your role and enter your academic details.
                </p>

                {error && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700" role="alert">
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="font-medium">{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Register as
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["student", "instructor"] as Role[]).map((item) => (
                        <button
                          key={item}
                          type="button"
                          disabled={loading}
                          onClick={() => setRole(item)}
                          className={`h-12 rounded-xl border text-sm font-bold capitalize transition ${
                            role === item
                              ? "border-[#6347ff] bg-[#f0efff] text-[#5138ff] ring-4 ring-[#6347ff]/10"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full name">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        disabled={loading}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Email address">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={loading}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <PasswordField
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      setShow={setShowPassword}
                      disabled={loading}
                      placeholder="Minimum 8 characters"
                    />
                    <PasswordField
                      label="Confirm password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      show={showConfirmPassword}
                      setShow={setShowConfirmPassword}
                      disabled={loading}
                      placeholder="Re-enter password"
                    />
                  </div>

                  {role === "student" ? (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Degree">
                          <input
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Student ID">
                          <input
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            placeholder="BCA2026-001"
                            disabled={loading}
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-3">
                        <Field label="Year of study">
                          <select
                            value={yearOfStudy}
                            onChange={(e) => updateYear(Number(e.target.value))}
                            disabled={loading}
                            className={selectClass}
                          >
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                          </select>
                        </Field>

                        <Field label="Semester">
                          <select
                            value={semester}
                            onChange={(e) => setSemester(Number(e.target.value))}
                            disabled={loading}
                            className={selectClass}
                          >
                            {availableSemesters.map((item) => (
                              <option key={item} value={item}>
                                Semester {item}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Class / Section">
                          <input
                            value={classSection}
                            onChange={(e) => setClassSection(e.target.value)}
                            placeholder="A"
                            disabled={loading}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Institution">
                          <input
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="ExamForge Academy"
                            disabled={loading}
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Phone (optional)">
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone number"
                            disabled={loading}
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <Field label="City (optional)">
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          disabled={loading}
                          className={inputClass}
                        />
                      </Field>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">
                              Teaching assignments
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Add the subjects, years, semesters and classes you teach.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setAssignments((current) => [
                                ...current,
                                createAssignment(),
                              ])
                            }
                            disabled={loading}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#5138ff] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#432bdc] disabled:opacity-60"
                          >
                            <Plus className="h-4 w-4" />
                            Add
                          </button>
                        </div>

                        <div className="mt-4 space-y-4">
                          {assignments.map((assignment, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Assignment {index + 1}
                                </p>
                                {assignments.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAssignments((current) =>
                                        current.filter(
                                          (_, assignmentIndex) =>
                                            assignmentIndex !== index
                                        )
                                      )
                                    }
                                    disabled={loading}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </button>
                                )}
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Subject">
                                  <input
                                    value={assignment.subject}
                                    onChange={(e) =>
                                      updateAssignment(index, "subject", e.target.value)
                                    }
                                    placeholder="Financial Accounting"
                                    disabled={loading}
                                    className={inputClass}
                                  />
                                </Field>

                                <Field label="Degree">
                                  <input
                                    value={assignment.degree}
                                    onChange={(e) =>
                                      updateAssignment(index, "degree", e.target.value)
                                    }
                                    disabled={loading}
                                    className={inputClass}
                                  />
                                </Field>

                                <Field label="Year of study">
                                  <select
                                    value={assignment.yearOfStudy}
                                    onChange={(e) =>
                                      updateAssignment(
                                        index,
                                        "yearOfStudy",
                                        Number(e.target.value)
                                      )
                                    }
                                    disabled={loading}
                                    className={selectClass}
                                  >
                                    <option value={1}>1st Year</option>
                                    <option value={2}>2nd Year</option>
                                    <option value={3}>3rd Year</option>
                                  </select>
                                </Field>

                                <Field label="Semesters">
                                  <input
                                    value={assignment.semesterText}
                                    onChange={(e) =>
                                      handleAssignmentSemesters(index, e.target.value)
                                    }
                                    placeholder="1, 2"
                                    disabled={loading}
                                    className={inputClass}
                                  />
                                </Field>

                                <div className="sm:col-span-2">
                                  <Field label="Class / Sections">
                                    <input
                                      value={assignment.classSectionsText}
                                      onChange={(e) =>
                                        handleAssignmentSections(index, e.target.value)
                                      }
                                      placeholder="A, B"
                                      disabled={loading}
                                      className={inputClass}
                                    />
                                  </Field>
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    Separate multiple values with commas.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {role === "student" && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Phone (optional)">
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone number"
                          disabled={loading}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="City (optional)">
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Dandeli"
                          disabled={loading}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4c39f5] via-[#6534f7] to-[#a20cff] px-5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <span>Create account</span>
                        <ArrowRight className="h-5 w-5 transition duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Secure HttpOnly session
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  setShow,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6347ff] focus:bg-white focus:ring-4 focus:ring-[#6347ff]/10 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        disabled={disabled}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        {show ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </Field>
  );
}

function Feature({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 backdrop-blur-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
    </div>
  );
}

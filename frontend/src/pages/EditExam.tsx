import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { API_URL } from "../apiConfig";

// ======================================================
// TYPES
// ======================================================

interface Exam {
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
  negativePenalty: number;
  allowedAttempts: number;

  startDate?: string;
  endDate?: string;

  instructions?: string[];

  shuffleQuestions: boolean;
  shuffleOptions: boolean;

  published: boolean;

  createdAt?: string;
}

interface ExamResponse {
  message?: string;

  _id?: string;
  title?: string;
  subject?: string;
  degree?: string;
  yearOfStudy?: number;
  semester?: number;

  duration?: number;
  questionCount?: number;
  totalMarks?: number;
  passingMarks?: number;

  negativeMarking?: boolean;
  negativePenalty?: number;
  allowedAttempts?: number;

  startDate?: string;
  endDate?: string;

  instructions?: string[];

  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;

  published?: boolean;

  createdAt?: string;

  exam?: Exam;
}

// ======================================================
// COMPONENT
// ======================================================

function EditExam() {
  const { examId } =
    useParams<{ examId: string }>();

  const navigate = useNavigate();

  // ====================================================
  // STATE
  // ====================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // Basic information
  const [title, setTitle] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [degree, setDegree] =
    useState("BCA");

  // Academic information
  const [yearOfStudy, setYearOfStudy] =
    useState("");

  const [semester, setSemester] =
    useState("");

  // Exam settings
  const [duration, setDuration] =
    useState("30");

  const [questionCount, setQuestionCount] =
    useState("5");

  const [totalMarks, setTotalMarks] =
    useState("5");

  const [passingMarks, setPassingMarks] =
    useState("3");

  // Marking
  const [negativeMarking, setNegativeMarking] =
    useState(false);

  const [negativePenalty, setNegativePenalty] =
    useState("0");

  const [allowedAttempts, setAllowedAttempts] =
    useState("1");

  // Availability
  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  // Instructions
  const [instructions, setInstructions] =
    useState("");

  // Shuffle
  const [shuffleQuestions, setShuffleQuestions] =
    useState(false);

  const [shuffleOptions, setShuffleOptions] =
    useState(false);

  // Publication
  const [published, setPublished] =
    useState(false);

  // ====================================================
  // FORMAT DATE FOR DATETIME-LOCAL
  // ====================================================

  const formatDateTimeLocal = (
    value?: string
  ): string => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    const hours =
      String(
        date.getHours()
      ).padStart(2, "0");

    const minutes =
      String(
        date.getMinutes()
      ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // ====================================================
  // LOAD EXAM INTO FORM
  // ====================================================

  const loadExamIntoForm = (
    exam: Exam
  ) => {
    setTitle(
      exam.title || ""
    );

    setSubject(
      exam.subject || ""
    );

    setDegree(
      exam.degree || "BCA"
    );

    setYearOfStudy(
      exam.yearOfStudy
        ? String(exam.yearOfStudy)
        : ""
    );

    setSemester(
      exam.semester
        ? String(exam.semester)
        : ""
    );

    setDuration(
      String(
        exam.duration ?? 30
      )
    );

    setQuestionCount(
      String(
        exam.questionCount ?? 5
      )
    );

    setTotalMarks(
      String(
        exam.totalMarks ?? 5
      )
    );

    setPassingMarks(
      String(
        exam.passingMarks ?? 3
      )
    );

    setNegativeMarking(
      Boolean(
        exam.negativeMarking
      )
    );

    setNegativePenalty(
      String(
        exam.negativePenalty ?? 0
      )
    );

    setAllowedAttempts(
      String(
        exam.allowedAttempts ?? 1
      )
    );

    setStartDate(
      formatDateTimeLocal(
        exam.startDate
      )
    );

    setEndDate(
      formatDateTimeLocal(
        exam.endDate
      )
    );

    setInstructions(
      Array.isArray(
        exam.instructions
      )
        ? exam.instructions.join("\n")
        : ""
    );

    setShuffleQuestions(
      Boolean(
        exam.shuffleQuestions
      )
    );

    setShuffleOptions(
      Boolean(
        exam.shuffleOptions
      )
    );

    setPublished(
      Boolean(
        exam.published
      )
    );
  };

  // ====================================================
  // FETCH EXAM
  // ====================================================

  useEffect(() => {
    const fetchExam =
      async () => {
        if (!examId) {
          setError(
            "Exam ID is missing."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");
          setSuccess("");

          const response =
            await fetch(
              `${API_URL}/exams/${examId}`,
              {
                method: "GET",
                credentials: "include",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const data: ExamResponse =
            await response.json();

          // --------------------------------------------
          // SESSION EXPIRED
          // --------------------------------------------

          if (
            response.status === 401
          ) {
            navigate("/", {
              replace: true,
            });

            return;
          }

          // --------------------------------------------
          // FORBIDDEN
          // --------------------------------------------

          if (
            response.status === 403
          ) {
            setError(
              data.message ||
                "You are not allowed to manage this exam."
            );

            return;
          }

          // --------------------------------------------
          // OTHER ERROR
          // --------------------------------------------

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to load exam."
            );
          }

          // --------------------------------------------
          // RESPONSE
          // --------------------------------------------

          const exam =
            data.exam || data;

          if (
            !exam ||
            !exam._id
          ) {
            throw new Error(
              "Exam information was not returned by the server."
            );
          }

          loadExamIntoForm(
            exam as Exam
          );
        } catch (err) {
          console.error(
            "Load exam error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load exam."
          );
        } finally {
          setLoading(false);
        }
      };

    void fetchExam();
  }, [
    examId,
    navigate,
  ]);

  // ====================================================
  // SAVE EXAM
  // ====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!examId) {
      setError(
        "Exam ID is missing."
      );

      return;
    }

    setError("");
    setSuccess("");

    // --------------------------------------------
    // CONVERT VALUES
    // --------------------------------------------

    const parsedDuration =
      Number(duration);

    const parsedQuestionCount =
      Number(questionCount);

    const parsedTotalMarks =
      Number(totalMarks);

    const parsedPassingMarks =
      Number(passingMarks);

    const parsedNegativePenalty =
      Number(negativePenalty);

    const parsedAllowedAttempts =
      Number(allowedAttempts);

    const parsedYear =
      yearOfStudy
        ? Number(yearOfStudy)
        : undefined;

    const parsedSemester =
      semester
        ? Number(semester)
        : undefined;

    // --------------------------------------------
    // VALIDATION
    // --------------------------------------------

    if (!title.trim()) {
      setError(
        "Exam title is required."
      );

      return;
    }

    if (
      !Number.isFinite(
        parsedDuration
      ) ||
      parsedDuration <= 0
    ) {
      setError(
        "Duration must be greater than 0 minutes."
      );

      return;
    }

    if (
      !Number.isFinite(
        parsedQuestionCount
      ) ||
      parsedQuestionCount <= 0
    ) {
      setError(
        "Question count must be greater than 0."
      );

      return;
    }

    if (
      !Number.isFinite(
        parsedTotalMarks
      ) ||
      parsedTotalMarks < 0
    ) {
      setError(
        "Total marks cannot be negative."
      );

      return;
    }

    if (
      !Number.isFinite(
        parsedPassingMarks
      ) ||
      parsedPassingMarks < 0
    ) {
      setError(
        "Passing marks cannot be negative."
      );

      return;
    }

    if (
      parsedPassingMarks >
      parsedTotalMarks
    ) {
      setError(
        "Passing marks cannot be greater than total marks."
      );

      return;
    }

    if (
      negativeMarking &&
      (
        !Number.isFinite(
          parsedNegativePenalty
        ) ||
        parsedNegativePenalty < 0
      )
    ) {
      setError(
        "Negative marking penalty must be 0 or greater."
      );

      return;
    }

    if (
      !Number.isFinite(
        parsedAllowedAttempts
      ) ||
      parsedAllowedAttempts < 1
    ) {
      setError(
        "Allowed attempts must be at least 1."
      );

      return;
    }

    if (
      parsedYear !== undefined &&
      (
        parsedYear < 1 ||
        parsedYear > 3
      )
    ) {
      setError(
        "Year of study must be between 1 and 3."
      );

      return;
    }

    if (
      parsedSemester !== undefined &&
      (
        parsedSemester < 1 ||
        parsedSemester > 6
      )
    ) {
      setError(
        "Semester must be between 1 and 6."
      );

      return;
    }

    if (published && !endDate) {
      setError(
        "Please select the exam deadline before publishing."
      );

      return;
    }

    if (
      startDate &&
      endDate &&
      new Date(startDate) >=
        new Date(endDate)
    ) {
      setError(
        "End date must be later than start date."
      );

      return;
    }

    // --------------------------------------------
    // UPDATE REQUEST
    // --------------------------------------------

    try {
      setSaving(true);

      const instructionsArray =
        instructions
          .split("\n")
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);

      const response =
        await fetch(
          `${API_URL}/exams/${examId}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              title:
                title.trim(),

              subject:
                subject.trim(),

              degree:
                degree.trim(),

              yearOfStudy:
                parsedYear,

              semester:
                parsedSemester,

              duration:
                parsedDuration,

              questionCount:
                parsedQuestionCount,

              totalMarks:
                parsedTotalMarks,

              passingMarks:
                parsedPassingMarks,

              negativeMarking,

              negativePenalty:
                negativeMarking
                  ? parsedNegativePenalty
                  : 0,

              allowedAttempts:
                parsedAllowedAttempts,

              startDate:
                startDate
                  ? new Date(
                      startDate
                    ).toISOString()
                  : null,

              endDate:
                endDate
                  ? new Date(
                      endDate
                    ).toISOString()
                  : null,

              instructions:
                instructionsArray,

              shuffleQuestions,

              shuffleOptions,

              published,
            }),
          }
        );

      const data: ExamResponse =
        await response.json();

      // --------------------------------------------
      // SESSION EXPIRED
      // --------------------------------------------

      if (
        response.status === 401
      ) {
        navigate("/", {
          replace: true,
        });

        return;
      }

      // --------------------------------------------
      // SERVER ERROR
      // --------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update exam."
        );
      }

      // --------------------------------------------
      // SUCCESS
      // --------------------------------------------

      setSuccess(
        "Exam updated successfully."
      );

      if (data.exam) {
        loadExamIntoForm(
          data.exam
        );
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Update exam error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update exam."
      );
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // DELETE EXAM
  // ====================================================

  const handleDelete = () => {
    if (examId) {
      setError("");
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete =
    async () => {
      if (!examId) {
        return;
      }

      try {
        setDeleting(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `${API_URL}/exams/${examId}`,
            {
              method: "DELETE",
              credentials: "include",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data: ExamResponse =
          await response.json().catch(() => ({}));

        if (
          response.status === 401
        ) {
          navigate("/", {
            replace: true,
          });

          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to delete exam."
          );
        }

        navigate(
          "/instructor",
          {
            replace: true,
            state: {
              message:
                "Exam deleted successfully.",
            },
          }
        );
      } catch (err) {
        console.error(
          "Delete exam error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete exam."
        );
      } finally {
        setDeleting(false);
      }
    };

  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-200">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>

          <p className="mt-4 text-sm font-bold text-slate-700">
            Loading exam...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Preparing the exam settings
          </p>

        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">

        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/instructor"
              )
            }
            className="flex items-center gap-3"
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-200">
              <BookOpen className="h-5 w-5 text-white" />
            </div>

            <div className="hidden text-left sm:block">

              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Exam
                <span className="text-indigo-600">
                  Forge
                </span>
              </h1>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Instructor Portal
              </p>

            </div>

          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/instructor"
              )
            }
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:inline">
              Dashboard
            </span>
          </button>

        </div>

      </header>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* PAGE HEADER */}

        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-200 sm:p-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <Settings className="h-3.5 w-3.5" />
                Exam Management
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Manage Exam
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Update your exam settings,
                academic eligibility,
                timing, marking rules and
                publication status.
              </p>

            </div>

            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/10 md:flex">
              <FileText className="h-10 w-10 text-white/90" />
            </div>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">

            <CheckCircle2 className="h-5 w-5 shrink-0" />

            {success}

          </div>
        )}

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ==================================================
              BASIC INFORMATION
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-5 w-5" />
              </div>

              <div>

                <h3 className="text-lg font-black text-slate-900">
                  Basic Information
                </h3>

                <p className="text-xs font-medium text-slate-400">
                  General details about this exam
                </p>

              </div>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div className="md:col-span-2">

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Exam Title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="e.g. JavaScript Fundamentals"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(event) =>
                    setSubject(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Web Development"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Degree
                </label>

                <select
                  value={degree}
                  onChange={(event) =>
                    setDegree(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >

                  <option value="BCA">
                    BCA
                  </option>

                </select>

              </div>

            </div>

          </section>

          {/* ==================================================
              ACADEMIC ELIGIBILITY
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <GraduationCap className="h-5 w-5" />
              </div>

              <div>

                <h3 className="text-lg font-black text-slate-900">
                  Academic Eligibility
                </h3>

                <p className="text-xs font-medium text-slate-400">
                  Choose which BCA students can see this exam
                </p>

              </div>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Year of Study
                </label>

                <select
                  value={yearOfStudy}
                  onChange={(event) =>
                    setYearOfStudy(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >

                  <option value="">
                    All Years
                  </option>

                  <option value="1">
                    1st Year
                  </option>

                  <option value="2">
                    2nd Year
                  </option>

                  <option value="3">
                    3rd Year
                  </option>

                </select>

              </div>

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Semester
                </label>

                <select
                  value={semester}
                  onChange={(event) =>
                    setSemester(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >

                  <option value="">
                    All Semesters
                  </option>

                  <option value="1">
                    Semester 1
                  </option>

                  <option value="2">
                    Semester 2
                  </option>

                  <option value="3">
                    Semester 3
                  </option>

                  <option value="4">
                    Semester 4
                  </option>

                  <option value="5">
                    Semester 5
                  </option>

                  <option value="6">
                    Semester 6
                  </option>

                </select>

              </div>

            </div>

          </section>

          {/* ==================================================
              EXAM SETTINGS
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>

                <h3 className="text-lg font-black text-slate-900">
                  Exam Settings
                </h3>

                <p className="text-xs font-medium text-slate-400">
                  Configure timing and question limits
                </p>

              </div>

            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Duration
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(event) =>
                      setDuration(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-14 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    min
                  </span>

                </div>

              </div>

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Questions
                </label>

                <input
                  type="number"
                  min="1"
                  value={questionCount}
                  onChange={(event) =>
                    setQuestionCount(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Total Marks
                </label>

                <input
                  type="number"
                  min="0"
                  value={totalMarks}
                  onChange={(event) =>
                    setTotalMarks(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Passing Marks
                </label>

                <input
                  type="number"
                  min="0"
                  value={passingMarks}
                  onChange={(event) =>
                    setPassingMarks(
                      event.target.value
                    )
                  }
                  max={Number(totalMarks) || undefined}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
                {Number(passingMarks) > Number(totalMarks) && <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">Passing marks cannot exceed total marks. Lower the passing marks before saving.</p>}

              </div>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">

                <div>

                  <p className="text-sm font-extrabold text-slate-800">
                    Randomize Questions
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Draw questions randomly for attempts
                  </p>

                </div>

                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(event) =>
                    setShuffleQuestions(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-indigo-600"
                />

              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">

                <div>

                  <p className="text-sm font-extrabold text-slate-800">
                    Randomize Options
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Shuffle answer option order
                  </p>

                </div>

                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(event) =>
                    setShuffleOptions(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-indigo-600"
                />

              </label>

            </div>

          </section>

          {/* ==================================================
              MARKING RULES
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>

                <h3 className="text-lg font-black text-slate-900">
                  Marking Rules
                </h3>

                <p className="text-xs font-medium text-slate-400">
                  Configure attempts and negative marking
                </p>

              </div>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Allowed Attempts
                </label>

                <input
                  type="number"
                  min="1"
                  max="10"
                  value={allowedAttempts}
                  onChange={(event) =>
                    setAllowedAttempts(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <div>

                  <p className="text-sm font-extrabold text-slate-800">
                    Enable Negative Marking
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Deduct marks for incorrect answers
                  </p>

                </div>

                <input
                  type="checkbox"
                  checked={negativeMarking}
                  onChange={(event) =>
                    setNegativeMarking(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-indigo-600"
                />

              </label>

              {negativeMarking && (
                <div>

                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Penalty Per Wrong Answer
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={negativePenalty}
                    onChange={(event) =>
                      setNegativePenalty(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                </div>
              )}

            </div>

          </section>

          {/* ==================================================
              AVAILABILITY
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>

              <div>

                <h3 className="text-lg font-black text-slate-900">
                  Availability
                </h3>

                <p className="text-xs font-medium text-slate-400">
                  Leave the start blank to begin on save; set the student deadline
                </p>

              </div>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Start Date & Time
                </label>

                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
                {!startDate && published && <p className="mt-2 text-xs font-medium text-indigo-600">This exam will start as soon as you save it.</p>}

              </div>

              <div>

                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  End Date & Time
                </label>

                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

            </div>

          </section>

          {/* ==================================================
              INSTRUCTIONS
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <FileText className="h-5 w-5" />
              </div>

              <div>

                <h3 className="text-lg font-black text-slate-900">
                  Instructions
                </h3>

                <p className="text-xs font-medium text-slate-400">
                  Enter one instruction per line
                </p>

              </div>

            </div>

            <textarea
              value={instructions}
              onChange={(event) =>
                setInstructions(
                  event.target.value
                )
              }
              rows={6}
              placeholder={`Answer all questions
Do not refresh the page during the exam
Submit before the timer expires`}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />

          </section>

          {/* ==================================================
              PUBLICATION
          ================================================== */}

          <section className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5 sm:p-7">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-black text-slate-900">
                  Exam Publication
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Published exams become available
                  to eligible students according to
                  the configured academic criteria
                  and dates.
                </p>

              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-indigo-100 bg-white px-4 py-3 shadow-sm">

                <input
                  type="checkbox"
                  checked={published}
                  onChange={(event) =>
                    setPublished(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-indigo-600"
                />

                <span className="text-sm font-extrabold text-slate-800">
                  {published
                    ? "Published"
                    : "Draft"}
                </span>

              </label>

            </div>

          </section>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

            <button
              type="button"
              onClick={handleDelete}
              disabled={
                deleting ||
                saving
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              {deleting
                ? "Deleting..."
                : "Delete Exam"}

            </button>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/instructor/exams/${examId}/questions`
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >

                <BookOpen className="h-4 w-4" />

                Question Bank

              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  deleting
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >

                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}

              </button>

            </div>

          </div>

        </form>

      </main>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="mt-10 border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">

          <p>
            © 2026 ExamForge · Instructor Portal
          </p>

          <p className="font-medium">
            Create. Assess. Understand.
          </p>

        </div>

      </footer>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deleting) setShowDeleteConfirm(false);
        }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-exam-title" aria-describedby="delete-exam-description" className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/30">
            <div className="relative bg-gradient-to-br from-rose-50 via-white to-violet-50 px-6 pb-6 pt-7 sm:px-7">
              <button type="button" aria-label="Close confirmation" disabled={deleting} onClick={() => setShowDeleteConfirm(false)} className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-50"><X className="h-5 w-5" /></button>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-1 ring-rose-200"><AlertTriangle className="h-6 w-6" /></div>
              <h2 id="delete-exam-title" className="mt-5 text-xl font-black tracking-tight text-slate-900">Delete this exam?</h2>
              <p id="delete-exam-description" className="mt-2 text-sm leading-6 text-slate-600">This permanently removes <span className="font-bold text-slate-800">{title || "this exam"}</span>, its questions, and its student attempt records. This can’t be undone.</p>
              {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-700">{error}</p>}
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
              <button type="button" disabled={deleting} onClick={() => setShowDeleteConfirm(false)} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">Keep exam</button>
              <button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-70">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? "Deleting exam…" : "Delete exam"}
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}

export default EditExam;

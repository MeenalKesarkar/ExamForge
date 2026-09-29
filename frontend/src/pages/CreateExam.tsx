import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  Info,
  Minus,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";

// ======================================================
// CONFIG
// ======================================================

const API_URL = "http://localhost:5000/api";

// ======================================================
// TYPES
// ======================================================

interface ExamForm {
  title: string;
  subject: string;
  degree: string;
  yearOfStudy: string;
  semester: string;
  duration: string;
  questionCount: string;
  totalMarks: string;
  passingMarks: string;
  allowedAttempts: string;
  negativeMarking: boolean;
  negativePenalty: string;
  instructions: string;
}

// ======================================================
// INITIAL FORM
// ======================================================

const initialForm: ExamForm = {
  title: "",
  subject: "",
  degree: "BCA",
  yearOfStudy: "",
  semester: "",
  duration: "30",
  questionCount: "25",
  totalMarks: "25",
  passingMarks: "13",
  allowedAttempts: "2",
  negativeMarking: false,
  negativePenalty: "0.25",
  instructions:
    "Read each question carefully before answering. Your answers will be saved automatically during the examination.",
};

// ======================================================
// COMPONENT
// ======================================================

function CreateExam() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<ExamForm>(initialForm);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const updateField = <
    K extends keyof ExamForm
  >(
    field: K,
    value: ExamForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ====================================================
  // QUESTION COUNT / MARKS
  // ====================================================

  const handleQuestionCountChange = (
    value: string
  ) => {
    setForm((current) => {
      const nextForm = {
        ...current,
        questionCount: value,
      };

      if (
        value &&
        !Number.isNaN(Number(value))
      ) {
        const questionCount =
          Number(value);

        nextForm.totalMarks =
          String(questionCount);

        nextForm.passingMarks =
          String(
            Math.ceil(
              questionCount * 0.5
            )
          );
      }

      return nextForm;
    });

    setError("");
    setSuccess("");
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = async (
    publish: boolean
  ) => {
    setError("");
    setSuccess("");

    // --------------------------------------------------
    // Validation
    // --------------------------------------------------

    if (!form.title.trim()) {
      setError(
        "Please enter an exam title."
      );
      return;
    }

    if (!form.subject.trim()) {
      setError(
        "Please enter the subject."
      );
      return;
    }

    if (!form.yearOfStudy) {
      setError(
        "Please select the BCA year."
      );
      return;
    }

    if (!form.semester) {
      setError(
        "Please select the semester."
      );
      return;
    }

    if (
      !form.duration ||
      Number(form.duration) <= 0
    ) {
      setError(
        "Exam duration must be greater than 0."
      );
      return;
    }

    if (
      !form.questionCount ||
      Number(form.questionCount) <= 0
    ) {
      setError(
        "Question count must be greater than 0."
      );
      return;
    }

    if (
      !form.totalMarks ||
      Number(form.totalMarks) <= 0
    ) {
      setError(
        "Total marks must be greater than 0."
      );
      return;
    }

    if (
      !form.passingMarks ||
      Number(form.passingMarks) < 0
    ) {
      setError(
        "Please enter valid passing marks."
      );
      return;
    }

    if (
      Number(form.passingMarks) >
      Number(form.totalMarks)
    ) {
      setError(
        "Passing marks cannot be greater than total marks."
      );
      return;
    }

    if (
      !form.allowedAttempts ||
      Number(form.allowedAttempts) < 1
    ) {
      setError(
        "Allowed attempts must be at least 1."
      );
      return;
    }

    if (
      form.negativeMarking &&
      Number(form.negativePenalty) <= 0
    ) {
      setError(
        "Please enter a valid negative marking penalty."
      );
      return;
    }

    // --------------------------------------------------
    // Prepare payload
    // --------------------------------------------------

    const payload = {
      title: form.title.trim(),

      subject:
        form.subject.trim(),

      degree: "BCA",

      yearOfStudy:
        Number(form.yearOfStudy),

      semester:
        Number(form.semester),

      duration:
        Number(form.duration),

      questionCount:
        Number(form.questionCount),

      totalMarks:
        Number(form.totalMarks),

      passingMarks:
        Number(form.passingMarks),

      allowedAttempts:
        Number(form.allowedAttempts),

      negativeMarking:
        form.negativeMarking,

      negativePenalty:
        form.negativeMarking
          ? Number(
              form.negativePenalty
            )
          : 0,

      instructions:
        form.instructions.trim(),

      published: publish,
    };

    try {
      setSaving(true);

      const response =
        await fetch(
          `${API_URL}/exams`,
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create exam."
        );
      }

      setSuccess(
        publish
          ? "Exam created and published successfully."
          : "Exam saved as a draft successfully."
      );

      setTimeout(() => {
        navigate(
          "/instructor/exams"
        );
      }, 900);
    } catch (requestError) {
      console.error(
        "Create exam error:",
        requestError
      );

      if (
        requestError instanceof Error
      ) {
        setError(
          requestError.message
        );
      } else {
        setError(
          "Unable to create exam."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/instructor"
                )
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                bg-white
                text-slate-600
                shadow-sm
                transition
                hover:border-indigo-200
                hover:bg-indigo-50
                hover:text-indigo-600
              "
            >
              <ArrowLeft
                size={18}
              />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">
                Instructor Workspace
              </p>

              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                Create New Exam
              </h1>
            </div>

          </div>

          <div className="hidden items-center gap-2 sm:flex">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles
                size={17}
              />
            </div>

            <span className="text-sm font-bold text-slate-800">
              ExamForge
            </span>

          </div>

        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#11163b] via-[#292272] to-[#6815ba] p-6 text-white shadow-xl sm:p-8">

          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative z-10">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur">

              <GraduationCap
                size={14}
              />

              BCA Assessment Builder

            </div>

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Build a new assessment
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/80 sm:text-base">
              Configure your exam, define who can
              take it, and prepare the assessment
              before adding questions.
            </p>

          </div>

        </section>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-bold">
                Unable to create exam
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-bold">
                Success
              </p>

              <p className="mt-1">
                {success}
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <div className="mt-6 space-y-6">

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen
                    size={19}
                  />
                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Basic Information
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Give your assessment a clear academic
                    identity.
                  </p>

                </div>

              </div>

            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-2">

              {/* TITLE */}

              <div className="lg:col-span-2">

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Exam Title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="e.g. JavaScript Fundamentals Test"
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    text-slate-800
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-indigo-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                  "
                />

              </div>

              {/* SUBJECT */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Subject
                </label>

                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) =>
                    updateField(
                      "subject",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Web Development"
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    text-slate-800
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-indigo-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                  "
                />

              </div>

              {/* DEGREE */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Degree
                </label>

                <div className="relative">

                  <select
                    value={form.degree}
                    disabled
                    className="
                      h-12
                      w-full
                      appearance-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-100
                      px-4
                      text-sm
                      font-semibold
                      text-slate-600
                      outline-none
                    "
                  >
                    <option value="BCA">
                      BCA
                    </option>
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  ExamForge is currently dedicated to
                  BCA students.
                </p>

              </div>

              {/* YEAR */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  BCA Year
                </label>

                <div className="relative">

                  <select
                    value={
                      form.yearOfStudy
                    }
                    onChange={(event) =>
                      updateField(
                        "yearOfStudy",
                        event.target.value
                      )
                    }
                    className="
                      h-12
                      w-full
                      appearance-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      text-sm
                      text-slate-800
                      outline-none
                      transition
                      focus:border-indigo-400
                      focus:bg-white
                      focus:ring-4
                      focus:ring-indigo-500/10
                    "
                  >
                    <option value="">
                      Select year
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

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>

              {/* SEMESTER */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Semester
                </label>

                <div className="relative">

                  <select
                    value={
                      form.semester
                    }
                    onChange={(event) =>
                      updateField(
                        "semester",
                        event.target.value
                      )
                    }
                    className="
                      h-12
                      w-full
                      appearance-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      text-sm
                      text-slate-800
                      outline-none
                      transition
                      focus:border-indigo-400
                      focus:bg-white
                      focus:ring-4
                      focus:ring-indigo-500/10
                    "
                  >
                    <option value="">
                      Select semester
                    </option>

                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                      6,
                    ].map(
                      (semester) => (
                        <option
                          key={
                            semester
                          }
                          value={
                            semester
                          }
                        >
                          Semester{" "}
                          {semester}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              EXAM CONFIGURATION
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Clock3
                    size={19}
                  />
                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Exam Configuration
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Define timing, questions and scoring.
                  </p>

                </div>

              </div>

            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2 lg:grid-cols-3">

              {/* DURATION */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Duration
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="1"
                    value={
                      form.duration
                    }
                    onChange={(event) =>
                      updateField(
                        "duration",
                        event.target.value
                      )
                    }
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      pr-16
                      text-sm
                      font-semibold
                      text-slate-800
                      outline-none
                      focus:border-indigo-400
                      focus:bg-white
                      focus:ring-4
                      focus:ring-indigo-500/10
                    "
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    min
                  </span>

                </div>

              </div>

              {/* QUESTION COUNT */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Questions
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.questionCount
                  }
                  onChange={(event) =>
                    handleQuestionCountChange(
                      event.target.value
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    font-semibold
                    text-slate-800
                    outline-none
                    focus:border-indigo-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                  "
                />

              </div>

              {/* TOTAL MARKS */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Total Marks
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.totalMarks
                  }
                  onChange={(event) =>
                    updateField(
                      "totalMarks",
                      event.target.value
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    font-semibold
                    text-slate-800
                    outline-none
                    focus:border-indigo-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                  "
                />

              </div>

              {/* PASSING MARKS */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Passing Marks
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.passingMarks
                  }
                  onChange={(event) =>
                    updateField(
                      "passingMarks",
                      event.target.value
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    font-semibold
                    text-slate-800
                    outline-none
                    focus:border-indigo-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                  "
                />

              </div>

              {/* ALLOWED ATTEMPTS */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Allowed Attempts
                </label>

                <div className="relative">

                  <select
                    value={
                      form.allowedAttempts
                    }
                    onChange={(event) =>
                      updateField(
                        "allowedAttempts",
                        event.target.value
                      )
                    }
                    className="
                      h-12
                      w-full
                      appearance-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      text-sm
                      font-semibold
                      text-slate-800
                      outline-none
                      focus:border-indigo-400
                      focus:bg-white
                      focus:ring-4
                      focus:ring-indigo-500/10
                    "
                  >
                    <option value="1">
                      1 Attempt
                    </option>

                    <option value="2">
                      2 Attempts
                    </option>

                    <option value="3">
                      3 Attempts
                    </option>
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>

              {/* NEGATIVE MARKING */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 lg:col-span-3">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Minus
                        size={18}
                      />
                    </div>

                    <div>

                      <p className="text-sm font-bold text-slate-800">
                        Negative Marking
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Deduct marks for an incorrectly
                        answered question.
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={
                      form.negativeMarking
                    }
                    onClick={() =>
                      updateField(
                        "negativeMarking",
                        !form.negativeMarking
                      )
                    }
                    className={`
                      relative
                      h-7
                      w-12
                      shrink-0
                      rounded-full
                      transition
                      ${
                        form.negativeMarking
                          ? "bg-indigo-600"
                          : "bg-slate-300"
                      }
                    `}
                  >

                    <span
                      className={`
                        absolute
                        top-1
                        h-5
                        w-5
                        rounded-full
                        bg-white
                        shadow
                        transition
                        ${
                          form.negativeMarking
                            ? "left-6"
                            : "left-1"
                        }
                      `}
                    />

                  </button>

                </div>

                {form.negativeMarking && (
                  <div className="mt-4 border-t border-slate-200 pt-4">

                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                      Penalty per Incorrect Answer
                    </label>

                    <div className="relative max-w-[260px]">

                      <input
                        type="number"
                        min="0.01"
                        step="0.05"
                        value={
                          form.negativePenalty
                        }
                        onChange={(
                          event
                        ) =>
                          updateField(
                            "negativePenalty",
                            event.target
                              .value
                          )
                        }
                        className="
                          h-11
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          pr-20
                          text-sm
                          font-semibold
                          text-slate-800
                          outline-none
                          focus:border-indigo-400
                          focus:ring-4
                          focus:ring-indigo-500/10
                        "
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        marks
                      </span>

                    </div>

                  </div>
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              INSTRUCTIONS
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText
                    size={19}
                  />
                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Exam Instructions
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    These instructions will be shown to
                    students before they start.
                  </p>

                </div>

              </div>

            </div>

            <div className="p-5 sm:p-6">

              <textarea
                value={
                  form.instructions
                }
                onChange={(event) =>
                  updateField(
                    "instructions",
                    event.target.value
                  )
                }
                rows={6}
                placeholder="Enter instructions for students..."
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-4
                  text-sm
                  leading-6
                  text-slate-800
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-indigo-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-indigo-500/10
                "
              />

              <div className="mt-3 flex items-start gap-2 text-xs text-slate-400">

                <Info
                  size={14}
                  className="mt-0.5 shrink-0"
                />

                <p>
                  Keep instructions clear and concise.
                  Students will be able to see them before
                  starting the assessment.
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              PREVIEW
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50 shadow-sm">

            <div className="p-5 sm:p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                  <Target
                    size={20}
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Assessment Preview
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {form.title ||
                      "Your exam title"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {form.subject ||
                      "Subject"}{" "}
                    · BCA ·{" "}
                    {form.yearOfStudy
                      ? getYearLabel(
                          Number(
                            form.yearOfStudy
                          )
                        )
                      : "Year"}{" "}
                    ·{" "}
                    {form.semester
                      ? `Semester ${form.semester}`
                      : "Semester"}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                    <div className="rounded-xl bg-white p-3 shadow-sm">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Questions
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-slate-800">
                        {form.questionCount ||
                          "0"}
                      </p>

                    </div>

                    <div className="rounded-xl bg-white p-3 shadow-sm">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Duration
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-slate-800">
                        {form.duration ||
                          "0"}{" "}
                        <span className="text-xs font-semibold text-slate-400">
                          min
                        </span>
                      </p>

                    </div>

                    <div className="rounded-xl bg-white p-3 shadow-sm">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Marks
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-slate-800">
                        {form.totalMarks ||
                          "0"}
                      </p>

                    </div>

                    <div className="rounded-xl bg-white p-3 shadow-sm">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Attempts
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-slate-800">
                        {form.allowedAttempts ||
                          "0"}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck
                size={18}
              />
            </div>

            <div>

              <p className="text-sm font-bold text-slate-800">
                Server-controlled assessment
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Exam timing, attempt limits, question
                selection and scoring will be enforced by
                the ExamForge backend.
              </p>

            </div>

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl sm:p-4">

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  navigate(
                    "/instructor"
                  )
                }
                className="
                  inline-flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-5
                  text-sm
                  font-semibold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <ArrowLeft
                  size={16}
                />

                Cancel
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    handleSubmit(
                      false
                    )
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <Save
                    size={16}
                  />

                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    handleSubmit(
                      true
                    )
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-gradient-to-r
                    from-indigo-600
                    to-violet-600
                    px-6
                    text-sm
                    font-bold
                    text-white
                    shadow-lg
                    shadow-indigo-600/20
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-xl
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <CheckCircle2
                    size={17}
                  />

                  {saving
                    ? "Creating..."
                    : "Create & Publish"}
                </button>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

// ======================================================
// HELPER
// ======================================================

function getYearLabel(
  year?: number
): string {
  if (year === 1) {
    return "1st Year";
  }

  if (year === 2) {
    return "2nd Year";
  }

  if (year === 3) {
    return "3rd Year";
  }

  return "BCA";
}

// ======================================================
// EXPORT
// ======================================================

export default CreateExam;
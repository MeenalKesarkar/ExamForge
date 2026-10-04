import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileQuestion,
  GraduationCap,
  Info,
  Loader2,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";
import { API_URL } from "../apiConfig";

interface ExamFormData {
  title: string;
  subject: string;
  degree: string;
  yearOfStudy: string;
  semester: string;
  duration: string;
  questionCount: string;
  totalMarks: string;
  passingMarks: string;
  negativeMarking: boolean;
  negativePenalty: string;
  allowedAttempts: string;
  startDate: string;
  endDate: string;
  instructions: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  published: boolean;
}

interface ExamResponse {
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
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  published: boolean;
}

const initialForm: ExamFormData = {
  title: "",
  subject: "",
  degree: "BCA",
  yearOfStudy: "",
  semester: "",
  duration: "30",
  questionCount: "25",
  totalMarks: "25",
  passingMarks: "13",
  negativeMarking: false,
  negativePenalty: "0.25",
  allowedAttempts: "1",
  startDate: "",
  endDate: "",
  instructions: "",
  shuffleQuestions: false,
  shuffleOptions: false,
  published: false,
};

function toDateTimeLocal(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function ExamForm() {
  const navigate = useNavigate();
  const { examId } = useParams();

  const isEditMode = Boolean(examId);

  const [form, setForm] = useState<ExamFormData>(initialForm);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/exams/${examId}`,
          {
            credentials: "include",
          }
        );

        if (response.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.message || "Failed to load exam."
          );
        }

        const data: ExamResponse = await response.json();

        setForm({
          title: data.title || "",
          subject: data.subject || "",
          degree: data.degree || "BCA",
          yearOfStudy:
            data.yearOfStudy !== undefined
              ? String(data.yearOfStudy)
              : "",
          semester:
            data.semester !== undefined
              ? String(data.semester)
              : "",
          duration: String(data.duration ?? 30),
          questionCount: String(data.questionCount ?? 25),
          totalMarks: String(data.totalMarks ?? 25),
          passingMarks: String(data.passingMarks ?? 13),
          negativeMarking: Boolean(data.negativeMarking),
          negativePenalty: String(
            data.negativePenalty ?? 0.25
          ),
          allowedAttempts: String(
            data.allowedAttempts ?? 1
          ),
          startDate: toDateTimeLocal(data.startDate),
          endDate: toDateTimeLocal(data.endDate),
          instructions:
            data.instructions?.join("\n") || "",
          shuffleQuestions:
            Boolean(data.shuffleQuestions),
          shuffleOptions:
            Boolean(data.shuffleOptions),
          published: Boolean(data.published),
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the exam."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadExam();
  }, [examId, navigate]);

  const updateField = <K extends keyof ExamFormData>(
    field: K,
    value: ExamFormData[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const numericSummary = useMemo(() => {
    const duration = Number(form.duration) || 0;
    const questions = Number(form.questionCount) || 0;
    const marks = Number(form.totalMarks) || 0;
    const passing = Number(form.passingMarks) || 0;

    return {
      duration,
      questions,
      marks,
      passing,
    };
  }, [
    form.duration,
    form.questionCount,
    form.totalMarks,
    form.passingMarks,
  ]);

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Please enter an exam title.";
    }

    if (!form.subject.trim()) {
      return "Please enter the subject.";
    }

    if (!form.yearOfStudy) {
      return "Please select the BCA year.";
    }

    if (!form.semester) {
      return "Please select the semester.";
    }

    if (numericSummary.duration < 1) {
      return "Duration must be at least 1 minute.";
    }

    if (numericSummary.questions < 1) {
      return "Question count must be at least 1.";
    }

    if (numericSummary.marks < 0) {
      return "Total marks cannot be negative.";
    }

    if (
      numericSummary.passing < 0 ||
      numericSummary.passing > numericSummary.marks
    ) {
      return "Passing marks must be between 0 and total marks.";
    }

    if (
      form.negativeMarking &&
      Number(form.negativePenalty) < 0
    ) {
      return "Negative marking penalty cannot be negative.";
    }

    if (Number(form.allowedAttempts) < 1) {
      return "Allowed attempts must be at least 1.";
    }

    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) <= new Date(form.startDate)
    ) {
      return "End date must be after the start date.";
    }

    return "";
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const instructions = form.instructions
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        degree: "BCA",
        yearOfStudy: Number(form.yearOfStudy),
        semester: Number(form.semester),
        duration: Number(form.duration),
        questionCount: Number(form.questionCount),
        totalMarks: Number(form.totalMarks),
        passingMarks: Number(form.passingMarks),
        negativeMarking: form.negativeMarking,
        negativePenalty: form.negativeMarking
          ? Number(form.negativePenalty)
          : 0,
        allowedAttempts: Number(form.allowedAttempts),
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : undefined,
        endDate: form.endDate
          ? new Date(form.endDate).toISOString()
          : undefined,
        instructions,
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        published: form.published,
      };

      const url = isEditMode
        ? `${API_URL}/exams/${examId}`
        : `${API_URL}/exams`;

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to ${isEditMode ? "update" : "create"} exam.`
        );
      }

      const savedExam = data?.exam || data;

      setSuccess(
        isEditMode
          ? "Exam updated successfully."
          : "Exam created successfully."
      );

      if (!isEditMode && savedExam?._id) {
        setTimeout(() => {
          navigate(
            `/instructor/exams/${savedExam._id}/questions`
          );
        }, 700);

        return;
      }

      if (isEditMode) {
        setTimeout(() => {
          navigate("/instructor");
        }, 700);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the exam."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>

          <p className="mt-4 text-sm text-white/60">
            Loading exam...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/instructor")}
            className="flex items-center gap-3 text-white/80 transition hover:text-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold">
                Back to Dashboard
              </p>
              <p className="text-xs text-white/40">
                Instructor workspace
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-white/50">
              ExamForge
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-purple-600/10 p-6 shadow-2xl shadow-indigo-950/20 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
                <Settings2 className="h-3.5 w-3.5" />
                {isEditMode
                  ? "Edit Examination"
                  : "Create Examination"}
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {isEditMode
                  ? "Update your exam"
                  : "Build a new exam"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
                Configure the academic details, timing,
                questions, marking rules and availability for
                your BCA students.
              </p>
            </div>

            <div className="hidden h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 lg:flex">
              <FileQuestion className="h-9 w-9 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Main form */}
            <div className="space-y-6">
              {/* Basic information */}
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                    <BookOpen className="h-5 w-5 text-indigo-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Basic Information
                    </h2>
                    <p className="text-xs text-white/40">
                      Tell students what this examination is about.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Exam Title
                    </label>

                    <input
                      value={form.title}
                      onChange={(event) =>
                        updateField(
                          "title",
                          event.target.value
                        )
                      }
                      placeholder="e.g. JavaScript Fundamentals Test"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Subject
                    </label>

                    <input
                      value={form.subject}
                      onChange={(event) =>
                        updateField(
                          "subject",
                          event.target.value
                        )
                      }
                      placeholder="e.g. JavaScript"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Degree
                    </label>

                    <div className="relative">
                      <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                      <select
                        value={form.degree}
                        disabled
                        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-white/70 outline-none"
                      >
                        <option value="BCA">
                          BCA
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Year
                    </label>

                    <select
                      value={form.yearOfStudy}
                      onChange={(event) =>
                        updateField(
                          "yearOfStudy",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-indigo-500/60"
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
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Semester
                    </label>

                    <select
                      value={form.semester}
                      onChange={(event) =>
                        updateField(
                          "semester",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-indigo-500/60"
                    >
                      <option value="">
                        Select semester
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

              {/* Exam configuration */}
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                    <Settings2 className="h-5 w-5 text-purple-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Exam Configuration
                    </h2>
                    <p className="text-xs text-white/40">
                      Configure duration, marks and attempts.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <NumberField
                    label="Duration"
                    suffix="minutes"
                    value={form.duration}
                    onChange={(value) =>
                      updateField("duration", value)
                    }
                    min={1}
                  />

                  <NumberField
                    label="Questions per Attempt"
                    value={form.questionCount}
                    onChange={(value) =>
                      updateField(
                        "questionCount",
                        value
                      )
                    }
                    min={1}
                  />

                  <NumberField
                    label="Total Marks"
                    value={form.totalMarks}
                    onChange={(value) =>
                      updateField(
                        "totalMarks",
                        value
                      )
                    }
                    min={0}
                  />

                  <NumberField
                    label="Passing Marks"
                    value={form.passingMarks}
                    onChange={(value) =>
                      updateField(
                        "passingMarks",
                        value
                      )
                    }
                    min={0}
                  />

                  <NumberField
                    label="Allowed Attempts"
                    value={form.allowedAttempts}
                    onChange={(value) =>
                      updateField(
                        "allowedAttempts",
                        value
                      )
                    }
                    min={1}
                    max={10}
                  />

                  {form.negativeMarking && (
                    <NumberField
                      label="Negative Marking Penalty"
                      value={form.negativePenalty}
                      onChange={(value) =>
                        updateField(
                          "negativePenalty",
                          value
                        )
                      }
                      min={0}
                      step="0.25"
                    />
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.negativeMarking}
                      onChange={(event) =>
                        updateField(
                          "negativeMarking",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 accent-indigo-500"
                    />

                    <div>
                      <p className="text-sm font-medium">
                        Enable negative marking
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/40">
                        Incorrect answers can reduce the
                        student's score according to the
                        configured penalty.
                      </p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Scheduling */}
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                    <CalendarDays className="h-5 w-5 text-cyan-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Schedule
                    </h2>
                    <p className="text-xs text-white/40">
                      Optional availability window for this exam.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Start Date & Time
                    </label>

                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) =>
                        updateField(
                          "startDate",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      End Date & Time
                    </label>

                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) =>
                        updateField(
                          "endDate",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/60"
                    />
                  </div>
                </div>
              </section>

              {/* Instructions */}
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Info className="h-5 w-5 text-amber-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Instructions
                    </h2>
                    <p className="text-xs text-white/40">
                      Add one instruction per line.
                    </p>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={form.instructions}
                  onChange={(event) =>
                    updateField(
                      "instructions",
                      event.target.value
                    )
                  }
                  placeholder={`Example:
Do not refresh the examination page.
Submit your answers before the timer reaches zero.
Each question carries 1 mark.`}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 outline-none placeholder:text-white/20 focus:border-indigo-500/60"
                />
              </section>

              {/* Advanced options */}
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Advanced Options
                    </h2>
                    <p className="text-xs text-white/40">
                      Fine-tune how questions are presented.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Toggle
                    checked={form.shuffleQuestions}
                    onChange={(value) =>
                      updateField(
                        "shuffleQuestions",
                        value
                      )
                    }
                    title="Shuffle questions"
                    description="Randomize question order for each attempt."
                  />

                  <Toggle
                    checked={form.shuffleOptions}
                    onChange={(value) =>
                      updateField(
                        "shuffleOptions",
                        value
                      )
                    }
                    title="Shuffle options"
                    description="Randomize the answer option order."
                  />

                  <Toggle
                    checked={form.published}
                    onChange={(value) =>
                      updateField(
                        "published",
                        value
                      )
                    }
                    title="Publish exam"
                    description="Make this exam available to eligible BCA students."
                  />
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="sticky top-24 space-y-6">
                {/* Summary */}
                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-indigo-400" />

                    <div>
                      <h2 className="font-semibold">
                        Exam Summary
                      </h2>
                      <p className="text-xs text-white/40">
                        Quick preview
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <SummaryRow
                      label="Duration"
                      value={`${numericSummary.duration} min`}
                    />

                    <SummaryRow
                      label="Questions"
                      value={String(
                        numericSummary.questions
                      )}
                    />

                    <SummaryRow
                      label="Total marks"
                      value={String(
                        numericSummary.marks
                      )}
                    />

                    <SummaryRow
                      label="Passing marks"
                      value={String(
                        numericSummary.passing
                      )}
                    />

                    <SummaryRow
                      label="Attempts"
                      value={form.allowedAttempts}
                    />

                    <SummaryRow
                      label="Negative marking"
                      value={
                        form.negativeMarking
                          ? `Yes (-${form.negativePenalty})`
                          : "No"
                      }
                    />
                  </div>
                </section>

                {/* Academic target */}
                <section className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.06] p-6">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="mt-0.5 h-5 w-5 text-indigo-400" />

                    <div>
                      <h3 className="font-semibold">
                        Student Eligibility
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-white/40">
                        This exam will be associated with the
                        selected BCA year and semester.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70">
                          BCA
                        </span>

                        {form.yearOfStudy && (
                          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70">
                            Year {form.yearOfStudy}
                          </span>
                        )}

                        {form.semester && (
                          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70">
                            Semester {form.semester}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-semibold shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {isEditMode
                        ? "Save Changes"
                        : "Create Exam"}
                    </>
                  )}
                </button>

                {!isEditMode && (
                  <p className="text-center text-xs leading-5 text-white/30">
                    After creating the exam, you'll be able
                    to add and manage its question bank.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: string;
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = "1",
}: NumberFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/80">
        {label}
      </label>

      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10"
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
}

function Toggle({
  checked,
  onChange,
  title,
  description,
}: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
      <div>
        <p className="text-sm font-medium text-white/90">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/35">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-indigo-600"
            : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </label>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-white/40">
        {label}
      </span>

      <span className="text-sm font-medium text-white/80">
        {value}
      </span>
    </div>
  );
}

export default ExamForm;

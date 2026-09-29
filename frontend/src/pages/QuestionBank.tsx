import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Edit3,
  FileQuestion,
  Filter,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

// ======================================================
// CONFIG
// ======================================================

const API_URL =
  "http://localhost:5000/api";

// ======================================================
// TYPES
// ======================================================

type QuestionType =
  | "single"
  | "multi";

type Difficulty =
  | "easy"
  | "medium"
  | "hard";

interface Question {
  _id: string;

  questionText: string;

  type: QuestionType;

  options: string[];

  correctAnswers: string[];

  marks: number;

  explanation?: string;

  difficulty?: Difficulty;

  order?: number;
}

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

  allowedAttempts?: number;

  published: boolean;
}

interface QuestionForm {
  questionText: string;

  type: QuestionType;

  options: string[];

  correctAnswers: string[];

  marks: number;

  explanation: string;

  difficulty: Difficulty;
}

// ======================================================
// INITIAL FORM
// ======================================================

const emptyQuestion: QuestionForm = {
  questionText: "",

  type: "single",

  options: [
    "",
    "",
    "",
    "",
  ],

  correctAnswers: [],

  marks: 1,

  explanation: "",

  difficulty: "medium",
};

// ======================================================
// COMPONENT
// ======================================================

function QuestionBank() {
  const navigate =
    useNavigate();

  const { examId } =
    useParams<{
      examId: string;
    }>();

  // ====================================================
  // STATE
  // ====================================================

  const [exam, setExam] =
    useState<Exam | null>(
      null
    );

  const [questions, setQuestions] =
    useState<Question[]>(
      []
    );

  const [form, setForm] =
    useState<QuestionForm>(
      emptyQuestion
    );

  const [editingId, setEditingId] =
    useState<string | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState<
      "all" | QuestionType
    >("all");

  const [difficultyFilter, setDifficultyFilter] =
    useState<
      "all" | Difficulty
    >("all");

  const [showForm, setShowForm] =
    useState(true);

  // ====================================================
  // LOAD DATA
  // ====================================================

  useEffect(() => {
    if (!examId) {
      setError(
        "Exam ID is missing."
      );

      setLoading(false);

      return;
    }

    void loadData();
  }, [examId]);

  // ====================================================
  // LOAD EXAM + QUESTIONS
  // ====================================================

  const loadData =
    async () => {
      try {
        setLoading(true);

        setError("");

        const [
          examResponse,
          questionResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/exams/${examId}`,
            {
              credentials:
                "include",
            }
          ),

          fetch(
            `${API_URL}/questions/exam/${examId}`,
            {
              credentials:
                "include",
            }
          ),
        ]);

        const examData =
          await examResponse.json();

        const questionData =
          await questionResponse.json();

        if (
          !examResponse.ok
        ) {
          throw new Error(
            examData?.message ||
              "Failed to load exam"
          );
        }

        if (
          !questionResponse.ok
        ) {
          throw new Error(
            questionData?.message ||
              "Failed to load question bank"
          );
        }

        setExam(
          examData
        );

        setQuestions(
          Array.isArray(
            questionData
          )
            ? questionData
            : questionData.questions ||
                []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load question bank"
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // RESET FORM
  // ====================================================

  const resetForm = () => {
    setForm(
      emptyQuestion
    );

    setEditingId(
      null
    );

    setError("");

    setSuccess("");
  };

  // ====================================================
  // OPEN CREATE FORM
  // ====================================================

  const openCreateForm =
    () => {
      resetForm();

      setShowForm(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // ====================================================
  // HANDLE TYPE CHANGE
  // ====================================================

  const changeQuestionType =
    (
      type: QuestionType
    ) => {
      setForm(
        (current) => ({
          ...current,

          type,

          correctAnswers:
            [],
        })
      );
    };

  // ====================================================
  // UPDATE OPTION
  // ====================================================

  const updateOption = (
    index: number,
    value: string
  ) => {
    setForm(
      (current) => {
        const options = [
          ...current.options,
        ];

        const previousValue =
          options[index];

        options[index] =
          value;

        const correctAnswers =
          current.correctAnswers.map(
            (answer) =>
              answer ===
              previousValue
                ? value
                : answer
          );

        return {
          ...current,

          options,

          correctAnswers,
        };
      }
    );
  };

  // ====================================================
  // TOGGLE CORRECT ANSWER
  // ====================================================

  const toggleCorrectAnswer =
    (
      option: string
    ) => {
      if (!option.trim()) {
        return;
      }

      setForm(
        (current) => {
          if (
            current.type ===
            "single"
          ) {
            return {
              ...current,

              correctAnswers: [
                option,
              ],
            };
          }

          const exists =
            current.correctAnswers.includes(
              option
            );

          return {
            ...current,

            correctAnswers: exists
              ? current.correctAnswers.filter(
                  (answer) =>
                    answer !==
                    option
                )
              : [
                  ...current.correctAnswers,
                  option,
                ],
          };
        }
      );
    };

  // ====================================================
  // VALIDATE FORM
  // ====================================================

  const validateForm =
    (): string | null => {
      const questionText =
        form.questionText.trim();

      if (!questionText) {
        return "Question text is required.";
      }

      if (
        questionText.length <
        5
      ) {
        return "Question must contain at least 5 characters.";
      }

      const cleanedOptions =
        form.options.map(
          (option) =>
            option.trim()
        );

      if (
        cleanedOptions.some(
          (option) =>
            !option
        )
      ) {
        return "Please fill all four options.";
      }

      const uniqueOptions =
        new Set(
          cleanedOptions.map(
            (option) =>
              option.toLowerCase()
          )
        );

      if (
        uniqueOptions.size !==
        cleanedOptions.length
      ) {
        return "All options must be different.";
      }

      if (
        form.correctAnswers.length ===
        0
      ) {
        return "Please select at least one correct answer.";
      }

      if (
        form.type ===
          "single" &&
        form.correctAnswers.length !==
          1
      ) {
        return "A single-correct question must have exactly one correct answer.";
      }

      if (
        form.type ===
          "multi" &&
        form.correctAnswers.length <
          2
      ) {
        return "A multi-select question should have at least two correct answers.";
      }

      if (
        !Number.isFinite(
          form.marks
        ) ||
        form.marks <= 0
      ) {
        return "Marks must be greater than zero.";
      }

      return null;
    };

  // ====================================================
  // SAVE QUESTION
  // ====================================================

  const saveQuestion =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      setError("");

      setSuccess("");

      const validation =
        validateForm();

      if (validation) {
        setError(
          validation
        );

        return;
      }

      if (!examId) {
        setError(
          "Exam ID is missing."
        );

        return;
      }

      try {
        setSaving(true);

        const payload = {
          examId,

          questionText:
            form.questionText.trim(),

          type: form.type,

          options:
            form.options.map(
              (option) =>
                option.trim()
            ),

          correctAnswers:
            form.correctAnswers,

          marks:
            Number(form.marks),

          explanation:
            form.explanation.trim(),

          difficulty:
            form.difficulty,
        };

        const url =
          editingId
            ? `${API_URL}/questions/${editingId}`
            : `${API_URL}/questions`;

        const method =
          editingId
            ? "PUT"
            : "POST";

        const response =
          await fetch(
            url,
            {
              method,

              credentials:
                "include",

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

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Failed to save question"
          );
        }

        setSuccess(
          editingId
            ? "Question updated successfully."
            : "Question added to the question bank."
        );

        resetForm();

        await loadData();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to save question"
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // EDIT QUESTION
  // ====================================================

  const editQuestion =
    (
      question: Question
    ) => {
      setForm({
        questionText:
          question.questionText,

        type:
          question.type,

        options: [
          ...question.options,
        ],

        correctAnswers: [
          ...question.correctAnswers,
        ],

        marks:
          question.marks,

        explanation:
          question.explanation ||
          "",

        difficulty:
          question.difficulty ||
          "medium",
      });

      setEditingId(
        question._id
      );

      setShowForm(true);

      setError("");

      setSuccess("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // ====================================================
  // DELETE QUESTION
  // ====================================================

  const deleteQuestion =
    async (
      questionId: string
    ) => {
      const confirmed =
        window.confirm(
          "Delete this question from the question bank?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          questionId
        );

        setError("");

        const response =
          await fetch(
            `${API_URL}/questions/${questionId}`,
            {
              method: "DELETE",

              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Failed to delete question"
          );
        }

        setSuccess(
          "Question deleted successfully."
        );

        await loadData();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete question"
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  // ====================================================
  // FILTER QUESTIONS
  // ====================================================

  const filteredQuestions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return questions.filter(
        (question) => {
          const matchesSearch =
            !query ||
            question.questionText
              .toLowerCase()
              .includes(query);

          const matchesType =
            typeFilter ===
              "all" ||
            question.type ===
              typeFilter;

          const matchesDifficulty =
            difficultyFilter ===
              "all" ||
            question.difficulty ===
              difficultyFilter;

          return (
            matchesSearch &&
            matchesType &&
            matchesDifficulty
          );
        }
      );
    }, [
      questions,
      search,
      typeFilter,
      difficultyFilter,
    ]);

  // ====================================================
  // QUESTION STATS
  // ====================================================

  const singleCount =
    questions.filter(
      (question) =>
        question.type ===
        "single"
    ).length;

  const multiCount =
    questions.filter(
      (question) =>
        question.type ===
        "multi"
    ).length;

  const bankComplete =
    exam
      ? questions.length >=
        exam.questionCount
      : false;

  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-200">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading question bank...
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

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}

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
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
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

          {/* Back */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/instructor"
              )
            }
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:inline">
              Back to Dashboard
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </button>
        </div>
      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/instructor"
              )
            }
            className="font-semibold hover:text-indigo-600"
          >
            Instructor Dashboard
          </button>

          <span>/</span>

          <span className="font-semibold text-slate-900">
            Question Bank
          </span>
        </div>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 p-6 text-white shadow-xl shadow-indigo-200 sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
                  <ListChecks className="h-4 w-4" />

                  Question Bank
                </div>

                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Build your exam
                  question bank.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                  Add single-correct MCQs
                  and multi-select questions,
                  define the correct answers,
                  marks and difficulty, and
                  prepare the bank students
                  will receive from.
                </p>

                {exam && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold">
                      {exam.title}
                    </span>

                    {exam.subject && (
                      <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold">
                        {exam.subject}
                      </span>
                    )}

                    <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold">
                      {exam.questionCount} questions
                      per attempt
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <p className="text-2xl font-black">
                    {questions.length}
                  </p>

                  <p className="mt-1 text-[11px] font-semibold text-indigo-100">
                    Total
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <p className="text-2xl font-black">
                    {singleCount}
                  </p>

                  <p className="mt-1 text-[11px] font-semibold text-indigo-100">
                    Single
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <p className="text-2xl font-black">
                    {multiCount}
                  </p>

                  <p className="mt-1 text-[11px] font-semibold text-indigo-100">
                    Multi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
            <CircleHelp className="mt-0.5 h-5 w-5 shrink-0" />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
            BANK STATUS
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  bankComplete
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {bankComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <CircleHelp className="h-5 w-5" />
                )}
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  Question bank progress
                </p>

                <p className="text-sm text-slate-500">
                  {questions.length} of{" "}
                  {exam?.questionCount ||
                    0} required questions
                  configured
                </p>
              </div>
            </div>

            <div className="min-w-[220px]">
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">
                  Bank readiness
                </span>

                <span className="text-indigo-600">
                  {exam
                    ? Math.min(
                        100,
                        Math.round(
                          (questions.length /
                            Math.max(
                              exam.questionCount,
                              1
                            )) *
                            100
                        )
                      )
                    : 0}
                  %
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 transition-all"
                  style={{
                    width: `${
                      exam
                        ? Math.min(
                            100,
                            (questions.length /
                              Math.max(
                                exam.questionCount,
                                1
                              )) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            QUESTION FORM
        ================================================= */}

        {showForm && (
          <section className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      {editingId ? (
                        <Edit3 className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900">
                      {editingId
                        ? "Edit Question"
                        : "Add New Question"}
                    </h3>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Configure the question,
                    options and correct
                    answer(s).
                  </p>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </div>

            <form
              onSubmit={
                saveQuestion
              }
              className="space-y-6 p-5 sm:p-6"
            >
              {/* Question text */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Question
                </label>

                <textarea
                  value={
                    form.questionText
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        questionText:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={4}
                  placeholder="Enter the question students will see..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* Type + difficulty + marks */}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Question type
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        changeQuestionType(
                          "single"
                        )
                      }
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        form.type ===
                        "single"
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-bold">
                        Single
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        One correct
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeQuestionType(
                          "multi"
                        )
                      }
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        form.type ===
                        "multi"
                          ? "border-violet-300 bg-violet-50 text-violet-700 ring-2 ring-violet-100"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-bold">
                        Multi-select
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        Multiple correct
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Difficulty
                  </label>

                  <div className="relative">
                    <select
                      value={
                        form.difficulty
                      }
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            difficulty:
                              event
                                .target
                                .value as Difficulty,
                          })
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    >
                      <option value="easy">
                        Easy
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="hard">
                        Hard
                      </option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Marks
                  </label>

                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={
                      form.marks
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          marks:
                            Number(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </div>

              {/* Options */}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">
                      Answer options
                    </label>

                    <p className="mt-1 text-xs text-slate-400">
                      Click an option to
                      mark it as correct.
                    </p>
                  </div>

                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                    {form.correctAnswers.length}{" "}
                    correct
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {form.options.map(
                    (
                      option,
                      index
                    ) => {
                      const isCorrect =
                        form.correctAnswers.includes(
                          option
                        ) &&
                        option.trim() !==
                          "";

                      return (
                        <div
                          key={
                            index
                          }
                          className={`relative rounded-2xl border p-3 transition ${
                            isCorrect
                              ? "border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-100"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleCorrectAnswer(
                                  option
                                )
                              }
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition ${
                                isCorrect
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                              }`}
                              aria-label={`Mark option ${
                                index +
                                1
                              } as correct`}
                            >
                              {isCorrect ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                String.fromCharCode(
                                  65 +
                                    index
                                )
                              )}
                            </button>

                            <input
                              type="text"
                              value={
                                option
                              }
                              onChange={(
                                event
                              ) =>
                                updateOption(
                                  index,
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder={`Option ${
                                index +
                                1
                              }`}
                              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                            />
                          </div>

                          {isCorrect && (
                            <div className="mt-2 ml-12 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />

                              Correct answer
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Explanation */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Explanation{" "}
                  <span className="font-medium text-slate-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  value={
                    form.explanation
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        explanation:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Add an explanation for the instructor/result review..."
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* Actions */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                {editingId && (
                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Question"
                    : "Add Question"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* =================================================
            QUESTIONS TOOLBAR
        ================================================= */}

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
                Questions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Manage the questions
                available in this exam bank.
              </p>
            </div>

            <button
              type="button"
              onClick={
                openCreateForm
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />

              Add Question
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
              {/* Search */}

              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  value={
                    search
                  }
                  onChange={(event) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Search questions..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* Type */}

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

                <select
                  value={
                    typeFilter
                  }
                  onChange={(event) =>
                    setTypeFilter(
                      event
                        .target
                        .value as
                        | "all"
                        | QuestionType
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 py-2.5 pl-10 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="all">
                    All types
                  </option>

                  <option value="single">
                    Single-correct
                  </option>

                  <option value="multi">
                    Multi-select
                  </option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>

              {/* Difficulty */}

              <div className="relative">
                <select
                  value={
                    difficultyFilter
                  }
                  onChange={(event) =>
                    setDifficultyFilter(
                      event
                        .target
                        .value as
                        | "all"
                        | Difficulty
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="all">
                    All difficulty
                  </option>

                  <option value="easy">
                    Easy
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="hard">
                    Hard
                  </option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            QUESTION LIST
        ================================================= */}

        <section className="mt-5 space-y-4">
          {filteredQuestions.length ===
          0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileQuestion className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-lg font-extrabold text-slate-900">
                {questions.length ===
                0
                  ? "Your question bank is empty"
                  : "No questions found"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {questions.length ===
                0
                  ? "Start adding questions so ExamForge can build randomized student attempts from this bank."
                  : "Try changing your search or filters."}
              </p>

              {questions.length ===
                0 && (
                <button
                  type="button"
                  onClick={
                    openCreateForm
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />

                  Add First Question
                </button>
              )}
            </div>
          ) : (
            filteredQuestions.map(
              (
                question,
                index
              ) => {
                const questionNumber =
                  question.order ||
                  index + 1;

                return (
                  <article
                    key={
                      question._id
                    }
                    className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      {/* Number */}

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                          {questionNumber}
                        </div>

                        <div className="lg:hidden">
                          <QuestionBadges
                            question={
                              question
                            }
                          />
                        </div>
                      </div>

                      {/* Content */}

                      <div className="min-w-0 flex-1">
                        <div className="hidden lg:block">
                          <QuestionBadges
                            question={
                              question
                            }
                          />
                        </div>

                        <h4 className="mt-2 text-base font-extrabold leading-7 text-slate-900 sm:text-lg">
                          {
                            question.questionText
                          }
                        </h4>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {question.options.map(
                            (
                              option,
                              optionIndex
                            ) => {
                              const correct =
                                question.correctAnswers.includes(
                                  option
                                );

                              return (
                                <div
                                  key={
                                    optionIndex
                                  }
                                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                                    correct
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border-slate-100 bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                      correct
                                        ? "bg-emerald-500 text-white"
                                        : "bg-white text-slate-400 shadow-sm"
                                    }`}
                                  >
                                    {correct ? (
                                      <Check className="h-3.5 w-3.5" />
                                    ) : (
                                      String.fromCharCode(
                                        65 +
                                          optionIndex
                                      )
                                    )}
                                  </span>

                                  <span className="font-semibold">
                                    {
                                      option
                                    }
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>

                        {question.explanation && (
                          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Explanation
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {
                                question.explanation
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}

                      <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">
                        <button
                          type="button"
                          onClick={() =>
                            editQuestion(
                              question
                            )
                          }
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Edit3 className="h-4 w-4" />

                          <span className="hidden sm:inline">
                            Edit
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            question._id
                          }
                          onClick={() =>
                            void deleteQuestion(
                              question._id
                            )
                          }
                          className="flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId ===
                          question._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}

                          <span className="hidden sm:inline">
                            Delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )
          )}
        </section>
      </main>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <p>
            © 2026 ExamForge · Instructor
            Portal
          </p>

          <p className="font-medium">
            Build fair exams. Measure real
            knowledge.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ======================================================
// QUESTION BADGES
// ======================================================

function QuestionBadges({
  question,
}: {
  question: Question;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
          question.type ===
          "single"
            ? "bg-indigo-50 text-indigo-600"
            : "bg-violet-50 text-violet-600"
        }`}
      >
        {question.type ===
        "single"
          ? "Single-correct"
          : "Multi-select"}
      </span>

      {question.difficulty && (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-500">
          {question.difficulty}
        </span>
      )}

      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
        {question.marks}{" "}
        {question.marks ===
        1
          ? "mark"
          : "marks"}
      </span>
    </div>
  );
}

export default QuestionBank;
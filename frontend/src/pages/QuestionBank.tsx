import {

  useEffect,

  useMemo,

  useState,

  type FormEvent,

} from "react";

import { useNavigate, useParams } from "react-router-dom";



import {

  ArrowLeft,

  BookOpen,

  CheckCircle2,

  ChevronDown,

  CircleHelp,

  Edit3,

  FileQuestion,

  Loader2,

  Plus,

  Save,

  Search,

  Trash2,

  X,

} from "lucide-react";

import { API_URL } from "../apiConfig";

import QuestionPdfImport from "../components/QuestionPdfImport";



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

  negativeMarking?: boolean;

  negativePenalty?: number;

  published?: boolean;

}



type QuestionType = "single" | "multi";



interface Question {

  _id: string;

  examId: string;

  questionText: string;

  type: QuestionType;

  options: string[];

  correctAnswers: string[];

  marks: number;

  explanation?: string;

  difficulty?: "easy" | "medium" | "hard";

  order?: number;

}



interface FormState {

  questionText: string;

  type: QuestionType;

  options: string[];

  correctAnswers: string[];

  marks: number;

  explanation: string;

  difficulty: "easy" | "medium" | "hard";

}



const emptyForm: FormState = {

  questionText: "",

  type: "single",

  options: ["", "", "", ""],

  correctAnswers: [],

  marks: 1,

  explanation: "",

  difficulty: "medium",

};



function getYearLabel(year?: number) {

  if (!year) return "Year not set";

  return `${year}${year === 1 ? "st" : year === 2 ? "nd" : "rd"} Year`;

}



function getSemesterLabel(semester?: number) {

  if (!semester) return "Semester not set";

  return `Semester ${semester}`;

}



function QuestionBank() {

  const navigate = useNavigate();

  const { examId } = useParams<{ examId: string }>();



  const [exam, setExam] = useState<Exam | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);



  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);



  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);



  const [form, setForm] = useState<FormState>(emptyForm);



  const [search, setSearch] = useState("");

  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const [typeFilter, setTypeFilter] = useState("all");



  useEffect(() => {

    if (!examId) {

      navigate("/instructor");

      return;

    }



    loadData();

  }, [examId]);



  useEffect(() => {

    if (!success) return;



    const timer = setTimeout(() => {

      setSuccess("");

    }, 3000);



    return () => clearTimeout(timer);

  }, [success]);



  async function loadData() {

    if (!examId) return;



    setLoading(true);

    setError("");



    try {

      const [examResponse, questionsResponse] = await Promise.all([

        fetch(`${API_URL}/exams/${examId}`, {

          credentials: "include",

        }),

        fetch(`${API_URL}/questions/exam/${examId}`, {

          credentials: "include",

        }),

      ]);



      if (examResponse.status === 401 || questionsResponse.status === 401) {

        navigate("/");

        return;

      }



      if (!examResponse.ok) {

        const data = await examResponse.json().catch(() => ({}));

        throw new Error(data.message || "Failed to load exam");

      }



      if (!questionsResponse.ok) {

        const data = await questionsResponse.json().catch(() => ({}));

        throw new Error(data.message || "Failed to load questions");

      }



      const examData = await examResponse.json();

      const questionsData = await questionsResponse.json();



      setExam(examData.exam || examData);

      setQuestions(

        Array.isArray(questionsData.questions)

          ? questionsData.questions

          : []

      );

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Something went wrong while loading the question bank."

      );

    } finally {

      setLoading(false);

    }

  }



  function openCreateForm() {

    setEditingId(null);

    setForm(emptyForm);

    setError("");

    setSuccess("");

    setShowForm(true);

  }



  function openEditForm(question: Question) {

    setEditingId(question._id);



    setForm({

      questionText: question.questionText,

      type: question.type,

      options: [...question.options],

      correctAnswers: [...question.correctAnswers],

      marks: question.marks,

      explanation: question.explanation || "",

      difficulty: question.difficulty || "medium",

    });



    setError("");

    setSuccess("");

    setShowForm(true);



    window.scrollTo({

      top: 0,

      behavior: "smooth",

    });

  }



  function closeForm() {

    if (saving) return;



    setShowForm(false);

    setEditingId(null);

    setForm(emptyForm);

  }



  function updateOption(index: number, value: string) {

    setForm((current) => {

      const options = [...current.options];

      options[index] = value;



      const oldValue = current.options[index];



      const correctAnswers = current.correctAnswers.map((answer) =>

        answer === oldValue ? value : answer

      );



      return {

        ...current,

        options,

        correctAnswers,

      };

    });

  }



  function addOption() {

    if (form.options.length >= 6) return;



    setForm((current) => ({

      ...current,

      options: [...current.options, ""],

    }));

  }



  function removeOption(index: number) {

    if (form.options.length <= 2) return;



    setForm((current) => {

      const removedOption = current.options[index];



      const options = current.options.filter(

        (_, optionIndex) => optionIndex !== index

      );



      const correctAnswers = current.correctAnswers.filter(

        (answer) => answer !== removedOption

      );



      return {

        ...current,

        options,

        correctAnswers,

      };

    });

  }



  function toggleCorrectAnswer(option: string) {

    if (!option.trim()) return;



    setForm((current) => {

      if (current.type === "single") {

        return {

          ...current,

          correctAnswers: [option],

        };

      }



      const exists = current.correctAnswers.includes(option);



      return {

        ...current,

        correctAnswers: exists

          ? current.correctAnswers.filter((answer) => answer !== option)

          : [...current.correctAnswers, option],

      };

    });

  }



  function changeQuestionType(type: QuestionType) {

    setForm((current) => ({

      ...current,

      type,

      correctAnswers:

        type === "single"

          ? current.correctAnswers.slice(0, 1)

          : current.correctAnswers,

    }));

  }



  async function handleSubmit(event: FormEvent) {

    event.preventDefault();



    if (!examId) return;



    setError("");

    setSuccess("");



    const questionText = form.questionText.trim();



    const options = form.options

      .map((option) => option.trim())

      .filter(Boolean);



    const correctAnswers = form.correctAnswers

      .map((answer) => answer.trim())

      .filter(Boolean);



    if (!questionText) {

      setError("Please enter the question.");

      return;

    }



    if (options.length < 2) {

      setError("Please provide at least two options.");

      return;

    }



    if (new Set(options).size !== options.length) {

      setError("Options must be unique.");

      return;

    }



    if (correctAnswers.length === 0) {

      setError("Please select at least one correct answer.");

      return;

    }



    if (form.type === "single" && correctAnswers.length !== 1) {

      setError("A single-correct question must have exactly one correct answer.");

      return;

    }



    if (

      correctAnswers.some(

        (answer) => !options.some((option) => option === answer)

      )

    ) {

      setError("Every correct answer must match one of the options.");

      return;

    }



    if (!Number.isFinite(form.marks) || form.marks <= 0) {

      setError("Marks must be greater than zero.");

      return;

    }



    setSaving(true);



    try {

      const payload = {

        examId,

        questionText,

        type: form.type,

        options,

        correctAnswers,

        marks: Number(form.marks),

        explanation: form.explanation.trim(),

        difficulty: form.difficulty,

        order: editingId

          ? questions.find(

              (question) => question._id === editingId

            )?.order

          : questions.length > 0

            ? Math.max(

                ...questions.map(

                  (question) =>

                    Number(question.order) || 0

                )

              ) + 1

            : 1,

      };



      const response = await fetch(

        editingId

          ? `${API_URL}/questions/${editingId}`

          : `${API_URL}/questions`,

        {

          method: editingId ? "PUT" : "POST",

          headers: {

            "Content-Type": "application/json",

          },

          credentials: "include",

          body: JSON.stringify(payload),

        }

      );



      if (response.status === 401) {

        navigate("/");

        return;

      }



      const data = await response.json().catch(() => ({}));



      if (!response.ok) {

        throw new Error(

          data.message ||

            (editingId

              ? "Failed to update question."

              : "Failed to create question.")

        );

      }



      const savedQuestion = data.question;



      if (editingId) {

        setQuestions((current) =>

          current.map((question) =>

            question._id === editingId

              ? savedQuestion || { ...question, ...payload }

              : question

          )

        );



        setSuccess("Question updated successfully.");

      } else {

        if (savedQuestion) {

          setQuestions((current) => [...current, savedQuestion]);

        } else {

          await loadData();

        }



        setSuccess("Question added successfully.");

      }



      closeForm();

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Something went wrong while saving the question."

      );

    } finally {

      setSaving(false);

    }

  }



  function handleDelete(question: Question) {
    if (deletingId) return;

    setError("");
    setSuccess("");
    setDeleteTarget(question);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const questionId = deleteTarget._id;

    setDeletingId(questionId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/questions/${questionId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        navigate("/");
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete question.");
      }

      setQuestions((current) =>
        current.filter((question) => question._id !== questionId)
      );

      setDeleteTarget(null);
      setSuccess("Question deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the question."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredQuestions = useMemo(() => {

    const query = search.trim().toLowerCase();



    return [...questions]

      .sort((a, b) => (a.order || 0) - (b.order || 0))

      .filter((question) => {

        const matchesSearch =

          !query ||

          question.questionText.toLowerCase().includes(query) ||

          question.options.some((option) =>

            option.toLowerCase().includes(query)

          );



        const matchesDifficulty =

          difficultyFilter === "all" ||

          question.difficulty === difficultyFilter;



        const matchesType =

          typeFilter === "all" || question.type === typeFilter;



        return matchesSearch && matchesDifficulty && matchesType;

      });

  }, [questions, search, difficultyFilter, typeFilter]);



  const totalMarks = useMemo(

    () => questions.reduce((sum, question) => sum + question.marks, 0),

    [questions]

  );



  const progress =

    exam && exam.questionCount > 0

      ? Math.min((questions.length / exam.questionCount) * 100, 100)

      : 0;



  if (loading) {

    return (

      <div className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">

            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />

          </div>



          <h2 className="text-lg font-semibold text-slate-900">

            Loading Question Bank

          </h2>



          <p className="mt-1 text-sm text-slate-500">

            Preparing your questions...

          </p>

        </div>

      </div>

    );

  }



  if (!exam) {

    return (

      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">

        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">

            <CircleHelp className="h-7 w-7 text-red-600" />

          </div>



          <h2 className="text-xl font-bold text-slate-900">

            Exam not found

          </h2>



          <p className="mt-2 text-sm text-slate-500">

            We could not find the exam associated with this question bank.

          </p>



          <button

            onClick={() => navigate("/instructor")}

            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"

          >

            Back to Dashboard

          </button>

        </div>

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-slate-50 text-slate-900">
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-question-title"
          onClick={() => {
            if (!deletingId) setDeleteTarget(null);
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Trash2 className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="delete-question-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Delete question?
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    This question will be permanently removed from this exam.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="line-clamp-3 text-sm font-medium leading-6 text-slate-700">
                  {deleteTarget.questionText}
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={Boolean(deletingId)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={Boolean(deletingId)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {deletingId ? "Deleting..." : "Delete Question"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* Header */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button

              onClick={() => navigate("/instructor")}

              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"

              title="Back to dashboard"

            >

              <ArrowLeft className="h-5 w-5" />

            </button>



            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">

                  <BookOpen className="h-4 w-4 text-white" />

                </div>



                <span className="font-bold text-slate-900">

                  ExamForge

                </span>

              </div>



              <p className="mt-0.5 text-xs text-slate-500">

                Instructor • Question Bank

              </p>

            </div>

          </div>



          <button

            onClick={openCreateForm}

            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"

          >

            <Plus className="h-4 w-4" />

            <span className="hidden sm:inline">Add Question</span>

          </button>

        </div>

      </header>



      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <QuestionPdfImport examId={exam._id} onImported={() => void loadData()} />



        {/* Error */}

        {error && (

          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <CircleHelp className="mt-0.5 h-5 w-5 shrink-0" />



            <div className="flex-1">{error}</div>



            <button

              onClick={() => setError("")}

              className="text-red-500 transition hover:text-red-700"

            >

              <X className="h-4 w-4" />

            </button>

          </div>

        )}



        {/* Success */}

        {success && (

          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            <CheckCircle2 className="h-5 w-5" />

            <span>{success}</span>

          </div>

        )}



        {/* Exam Hero */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl sm:p-8">

          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">

            <div className="max-w-3xl">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">

                <FileQuestion className="h-4 w-4" />

                Question Bank

              </div>



              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

                {exam.title}

              </h1>



              <p className="mt-2 text-sm text-indigo-100 sm:text-base">

                Build and manage the questions students will receive in this

                assessment.

              </p>



              <div className="mt-5 flex flex-wrap gap-2">

                {exam.subject && (

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">

                    {exam.subject}

                  </span>

                )}



                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">

                  {getYearLabel(exam.yearOfStudy)}

                </span>



                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">

                  {getSemesterLabel(exam.semester)}

                </span>



                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">

                  {exam.duration} min

                </span>



                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">

                  {exam.published ? "Published" : "Draft"}

                </span>

              </div>

            </div>



            <div className="min-w-[220px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">

              <div className="flex items-center justify-between text-sm">

                <span className="text-indigo-100">

                  Question Progress

                </span>



                <span className="font-bold text-white">

                  {questions.length}/{exam.questionCount}

                </span>

              </div>



              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">

                <div

                  className="h-full rounded-full bg-white transition-all"

                  style={{ width: `${progress}%` }}

                />

              </div>



              <div className="mt-3 flex items-center justify-between text-xs text-indigo-100">

                <span>{totalMarks} marks added</span>

                <span>{Math.round(progress)}%</span>

              </div>

            </div>

          </div>

        </section>



        {/* Stats */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard

            icon={<FileQuestion className="h-5 w-5" />}

            label="Questions"

            value={questions.length}

            description={`Target: ${exam.questionCount}`}

          />



          <StatCard

            icon={<BookOpen className="h-5 w-5" />}

            label="Total Marks"

            value={totalMarks}

            description={`Passing: ${exam.passingMarks}`}

          />



          <StatCard

            icon={<CheckCircle2 className="h-5 w-5" />}

            label="Single Correct"

            value={

              questions.filter((question) => question.type === "single")

                .length

            }

            description="One correct answer"

          />



          <StatCard

            icon={<CircleHelp className="h-5 w-5" />}

            label="Multi Select"

            value={

              questions.filter((question) => question.type === "multi")

                .length

            }

            description="Multiple correct answers"

          />

        </section>



        {/* Form */}

        {showForm && (

          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">

                    {editingId ? "Edit Question" : "Add New Question"}

                  </h2>



                  <p className="mt-1 text-sm text-slate-500">

                    Create a question and define the correct answer for

                    automatic evaluation.

                  </p>

                </div>



                <button

                  onClick={closeForm}

                  disabled={saving}

                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"

                >

                  <X className="h-4 w-4" />

                </button>

              </div>

            </div>



            <form onSubmit={handleSubmit} className="p-5 sm:p-6">

              <div className="grid gap-6 lg:grid-cols-3">

                <div className="lg:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Question

                  </label>



                  <textarea

                    value={form.questionText}

                    onChange={(event) =>

                      setForm((current) => ({

                        ...current,

                        questionText: event.target.value,

                      }))

                    }

                    rows={4}

                    placeholder="Enter your question here..."

                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"

                  />

                </div>



                <div className="space-y-5">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Question Type

                    </label>



                    <div className="relative">

                      <select

                        value={form.type}

                        onChange={(event) =>

                          changeQuestionType(

                            event.target.value as QuestionType

                          )

                        }

                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"

                      >

                        <option value="single">

                          Single Correct

                        </option>

                        <option value="multi">

                          Multiple Correct

                        </option>

                      </select>



                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    </div>

                  </div>



                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Difficulty

                    </label>



                    <div className="relative">

                      <select

                        value={form.difficulty}

                        onChange={(event) =>

                          setForm((current) => ({

                            ...current,

                            difficulty: event.target.value as

                              | "easy"

                              | "medium"

                              | "hard",

                          }))

                        }

                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"

                      >

                        <option value="easy">Easy</option>

                        <option value="medium">Medium</option>

                        <option value="hard">Hard</option>

                      </select>



                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    </div>

                  </div>



                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      Marks

                    </label>



                    <input

                      type="number"

                      min="1"

                      step="1"

                      value={form.marks}

                      onChange={(event) =>

                        setForm((current) => ({

                          ...current,

                          marks: Number(event.target.value),

                        }))

                      }

                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"

                    />

                  </div>

                </div>

              </div>



              {/* Options */}

              <div className="mt-7">

                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">

                  <div>

                    <label className="block text-sm font-semibold text-slate-700">

                      Answer Options

                    </label>



                    <p className="mt-1 text-xs text-slate-500">

                      Select the correct answer

                      {form.type === "multi"

                        ? "s (multiple allowed)"

                        : ""}

                      .

                    </p>

                  </div>



                  {form.options.length < 6 && (

                    <button

                      type="button"

                      onClick={addOption}

                      className="inline-flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 sm:self-auto"

                    >

                      <Plus className="h-3.5 w-3.5" />

                      Add Option

                    </button>

                  )}

                </div>



                <div className="grid gap-3 sm:grid-cols-2">

                  {form.options.map((option, index) => {

                    const isCorrect =

                      option.trim() &&

                      form.correctAnswers.includes(option.trim());



                    return (

                      <div

                        key={index}

                        className={`flex items-center gap-3 rounded-2xl border p-3 transition ${

                          isCorrect

                            ? "border-emerald-300 bg-emerald-50"

                            : "border-slate-200 bg-slate-50"

                        }`}

                      >

                        <button

                          type="button"

                          onClick={() =>

                            toggleCorrectAnswer(option.trim())

                          }

                          disabled={!option.trim()}

                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${

                            isCorrect

                              ? "border-emerald-500 bg-emerald-500 text-white"

                              : "border-slate-300 bg-white text-slate-400 hover:border-indigo-400 hover:text-indigo-500"

                          }`}

                          title={

                            isCorrect

                              ? "Correct answer"

                              : "Mark as correct"

                          }

                        >

                          {isCorrect ? (

                            <CheckCircle2 className="h-5 w-5" />

                          ) : (

                            <span className="text-xs font-bold">

                              {String.fromCharCode(65 + index)}

                            </span>

                          )}

                        </button>



                        <input

                          value={option}

                          onChange={(event) =>

                            updateOption(index, event.target.value)

                          }

                          placeholder={`Option ${String.fromCharCode(

                            65 + index

                          )}`}

                          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"

                        />



                        {form.options.length > 2 && (

                          <button

                            type="button"

                            onClick={() => removeOption(index)}

                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500"

                            title="Remove option"

                          >

                            <Trash2 className="h-4 w-4" />

                          </button>

                        )}

                      </div>

                    );

                  })}

                </div>

              </div>



              {/* Explanation */}

              <div className="mt-7">

                <label className="mb-2 block text-sm font-semibold text-slate-700">

                  Explanation

                  <span className="ml-2 font-normal text-slate-400">

                    Optional

                  </span>

                </label>



                <textarea

                  value={form.explanation}

                  onChange={(event) =>

                    setForm((current) => ({

                      ...current,

                      explanation: event.target.value,

                    }))

                  }

                  rows={3}

                  placeholder="Add an explanation that can help students understand the answer..."

                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"

                />

              </div>



              {/* Form Actions */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

                <button

                  type="button"

                  onClick={closeForm}

                  disabled={saving}

                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"

                >

                  Cancel

                </button>



                <button

                  type="submit"

                  disabled={saving}

                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"

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

                    : "Save Question"}

                </button>

              </div>

            </form>

          </section>

        )}



        {/* Questions */}

        <section className="mt-6">

          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">

                Questions

              </h2>



              <p className="mt-1 text-sm text-slate-500">

                Manage the questions included in this exam.

              </p>

            </div>



            <button

              onClick={openCreateForm}

              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 lg:hidden"

            >

              <Plus className="h-4 w-4" />

              Add Question

            </button>

          </div>



          {/* Filters */}

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_180px]">

            <div className="relative">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />



              <input

                value={search}

                onChange={(event) => setSearch(event.target.value)}

                placeholder="Search questions or options..."

                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"

              />

            </div>



            <div className="relative">

              <select

                value={difficultyFilter}

                onChange={(event) =>

                  setDifficultyFilter(event.target.value)

                }

                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-9 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"

              >

                <option value="all">All Difficulty</option>

                <option value="easy">Easy</option>

                <option value="medium">Medium</option>

                <option value="hard">Hard</option>

              </select>



              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>



            <div className="relative">

              <select

                value={typeFilter}

                onChange={(event) => setTypeFilter(event.target.value)}

                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-9 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"

              >

                <option value="all">All Types</option>

                <option value="single">Single Correct</option>

                <option value="multi">Multiple Correct</option>

              </select>



              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>

          </div>



          {filteredQuestions.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">

                <FileQuestion className="h-7 w-7 text-indigo-600" />

              </div>



              <h3 className="mt-5 text-lg font-bold text-slate-900">

                {questions.length === 0

                  ? "No questions yet"

                  : "No matching questions"}

              </h3>



              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                {questions.length === 0

                  ? "Start building your question bank by adding the first question to this exam."

                  : "Try changing your search or filters to find the questions you are looking for."}

              </p>



              {questions.length === 0 && (

                <button

                  onClick={openCreateForm}

                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"

                >

                  <Plus className="h-4 w-4" />

                  Add First Question

                </button>

              )}

            </div>

          ) : (

            <div className="space-y-4">

              {filteredQuestions.map((question, index) => (

                <article

                  key={question._id}

                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"

                >

                  <div className="p-5 sm:p-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex min-w-0 gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">

                          {question.order || index + 1}

                        </div>



                        <div className="min-w-0">

                          <div className="mb-2 flex flex-wrap items-center gap-2">

                            <span

                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${

                                question.type === "multi"

                                  ? "bg-violet-100 text-violet-700"

                                  : "bg-indigo-100 text-indigo-700"

                              }`}

                            >

                              {question.type === "multi"

                                ? "Multiple Correct"

                                : "Single Correct"}

                            </span>



                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">

                              {question.difficulty || "medium"}

                            </span>



                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">

                              {question.marks}{" "}

                              {question.marks === 1 ? "mark" : "marks"}

                            </span>

                          </div>



                          <h3 className="text-base font-bold leading-6 text-slate-900 sm:text-lg">

                            {question.questionText}

                          </h3>

                        </div>

                      </div>



                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">

                        <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openEditForm(question);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >

                          <Edit3 className="h-3.5 w-3.5" />

                          Edit

                        </button>



                        <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleDelete(question);
                            }}
                            disabled={deletingId === question._id}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >

                          {deletingId === question._id ? (

                            <Loader2 className="h-3.5 w-3.5 animate-spin" />

                          ) : (

                            <Trash2 className="h-3.5 w-3.5" />

                          )}

                          Delete

                        </button>

                      </div>

                    </div>



                    <div className="mt-5 grid gap-2 sm:grid-cols-2">

                      {question.options.map((option, optionIndex) => {

                        const isCorrect =

                          question.correctAnswers.includes(option);



                        return (

                          <div

                            key={optionIndex}

                            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${

                              isCorrect

                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"

                                : "border-slate-100 bg-slate-50 text-slate-700"

                            }`}

                          >

                            <span

                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${

                                isCorrect

                                  ? "bg-emerald-500 text-white"

                                  : "bg-white text-slate-500 ring-1 ring-slate-200"

                              }`}

                            >

                              {String.fromCharCode(65 + optionIndex)}

                            </span>



                            <span className="min-w-0 flex-1">

                              {option}

                            </span>



                            {isCorrect && (

                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />

                            )}

                          </div>

                        );

                      })}

                    </div>



                    {question.explanation && (

                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">

                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">

                          Explanation

                        </p>



                        <p className="mt-1 text-sm leading-6 text-blue-900">

                          {question.explanation}

                        </p>

                      </div>

                    )}

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>

  );

}



interface StatCardProps {

  icon: React.ReactNode;

  label: string;

  value: number;

  description: string;

}



function StatCard({

  icon,

  label,

  value,

  description,

}: StatCardProps) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-1 text-2xl font-bold text-slate-900">

            {value}

          </p>

          <p className="mt-1 text-xs text-slate-400">

            {description}

          </p>

        </div>



        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

          {icon}

        </div>

      </div>

    </div>

  );

}



export default QuestionBank;

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  FileQuestion,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Target,
  User,
  XCircle,
} from "lucide-react";
import { API_URL } from "../../../config/apiConfig";

import { InfoItem, Legend, QuestionAnalysis, StatusBadge } from "./InstructorAttemptDetailsShared";
import { AttemptInformation, AttemptScoreSummary } from "./InstructorAttemptSummary";
import type { DetailResponse } from "./InstructorAttemptDetailsShared";

// InstructorAttemptDetails component
function InstructorAttemptDetails() {
  const navigate = useNavigate();
  const { attemptId } = useParams();

  const [data, setData] =
    useState<DetailResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedQuestion,
    setSelectedQuestion,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setError(
        "Attempt ID is missing."
      );
      setLoading(false);
      return;
    }

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/attempts/instructor/${attemptId}`,
            {
              credentials: "include",
            }
          );

        if (response.status === 401) {
          navigate("/", {
            replace: true,
          });
          return;
        }

        if (!response.ok) {
          const responseData =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            responseData?.message ||
              "Unable to load attempt details."
          );
        }

        const resultData: DetailResponse =
          await response.json();

        setData(resultData);

        if (
          resultData.questions.length >
          0
        ) {
          setSelectedQuestion(
            resultData.questions[0]._id
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the result."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [attemptId, navigate]);

  const selectedQuestionData =
    useMemo(() => {
      if (
        !data ||
        !selectedQuestion
      ) {
        return null;
      }

      return (
        data.questions.find(
          (question) =>
            question._id ===
            selectedQuestion
        ) || null
      );
    }, [
      data,
      selectedQuestion,
    ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Loading attempt details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="mt-6 text-2xl font-bold">
            Unable to load result
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "The requested attempt could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/instructor")
            }
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const {
    attempt,
    student,
    exam,
    result,
    questions,
  } = data;

  const studentInitial =
    student?.name
      ?.charAt(0)
      .toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="absolute right-0 top-1/3 h-[25rem] w-[25rem] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/instructor/exams/${exam._id}/results`
              )
            }
            className="flex items-center gap-3 text-slate-600 transition hover:text-indigo-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <ArrowLeft className="h-5 w-5" />
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold">
                Exam Results
              </p>

              <p className="text-xs text-slate-500">
                Back to all attempts
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <BarChart3 className="h-4 w-4 text-indigo-600" />

            <span className="text-sm font-semibold text-slate-600">
              Attempt Details
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 p-6 text-white shadow-xl shadow-indigo-100 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                <FileQuestion className="h-3.5 w-3.5" />
                Student Attempt
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {exam.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-indigo-100">
                {exam.subject && (
                  <span>
                    {exam.subject}
                  </span>
                )}

                {exam.degree && (
                  <span>
                    {exam.degree}
                  </span>
                )}

                {exam.yearOfStudy && (
                  <span>
                    Year{" "}
                    {exam.yearOfStudy}
                  </span>
                )}

                {exam.semester && (
                  <span>
                    Semester{" "}
                    {exam.semester}
                  </span>
                )}
              </div>
            </div>

            <StatusBadge
              status={attempt.status}
              passed={result.passed}
            />
          </div>
        </section>

        {/* Student + Score */}
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Student profile */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <User className="h-5 w-5 text-indigo-600" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Student Information
                </h2>

                <p className="text-xs text-slate-500">
                  Student details for this attempt
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 text-2xl font-bold text-indigo-700">
                {studentInitial}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold">
                  {student?.name ||
                    "Unknown Student"}
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    icon={
                      <Mail className="h-4 w-4" />
                    }
                    label="Email"
                    value={
                      student?.email ||
                      "—"
                    }
                  />

                  <InfoItem
                    icon={
                      <GraduationCap className="h-4 w-4" />
                    }
                    label="Student ID"
                    value={
                      student?.studentId ||
                      "—"
                    }
                  />

                  <InfoItem
                    icon={
                      <Target className="h-4 w-4" />
                    }
                    label="Academic Year"
                    value={
                      student?.yearOfStudy
                        ? `Year ${student.yearOfStudy}`
                        : "—"
                    }
                  />

                  <InfoItem
                    icon={
                      <BarChart3 className="h-4 w-4" />
                    }
                    label="Semester"
                    value={
                      student?.semester
                        ? `Semester ${student.semester}`
                        : "—"
                    }
                  />

                  {student?.phone && (
                    <InfoItem
                      icon={
                        <Phone className="h-4 w-4" />
                      }
                      label="Phone"
                      value={
                        student.phone
                      }
                    />
                  )}

                  {student?.city && (
                    <InfoItem
                      icon={
                        <User className="h-4 w-4" />
                      }
                      label="City"
                      value={
                        student.city
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </section>


        <AttemptScoreSummary result={result} questionCount={questions.length} />
        </div>



        <AttemptInformation attempt={attempt} exam={exam} />

        {/* Question analysis */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                  Question-wise Analysis
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Review the student's answers and
                  correct answers.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                {questions.length} Questions
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr]">
            {/* Question navigation */}
            <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
              <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Questions
              </p>

              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
                {questions.map(
                  (
                    question,
                    index
                  ) => (
                    <button
                      key={
                        question._id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedQuestion(
                          question._id
                        )
                      }
                      className={`relative flex h-11 items-center justify-center rounded-xl text-xs font-semibold transition ${
                        selectedQuestion ===
                        question._id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                          : question.isCorrect
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : question.isAnswered
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {index + 1}

                      <span
                        className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${
                          question.isCorrect
                            ? "bg-emerald-400"
                            : question.isAnswered
                              ? "bg-red-400"
                            : "bg-slate-300"
                        }`}
                      />
                    </button>
                  )
                )}
              </div>

              <div className="mt-5 space-y-2 border-t border-slate-100 pt-5">
                <Legend
                  className="bg-emerald-500"
                  label="Correct"
                />

                <Legend
                  className="bg-red-500"
                  label="Incorrect"
                />

                <Legend
                  className="bg-slate-300"
                  label="Unanswered"
                />
              </div>
            </div>

            {/* Question detail */}
            <div className="p-5 sm:p-6">
              {selectedQuestionData ? (
                <QuestionAnalysis
                  question={
                    selectedQuestionData
                  }
                />
              ) : (
                <div className="py-16 text-center text-sm text-slate-500">
                  Select a question to view
                  its details.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   QUESTION ANALYSIS
========================================================= */

export default InstructorAttemptDetails;

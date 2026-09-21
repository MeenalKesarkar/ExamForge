import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  LoaderCircle,
} from "lucide-react";

interface Attempt {
  _id: string;
  studentId: string;
  examId: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  startTime: string;
  endTime: string;
  status: string;
}

interface Question {
  _id: string;
  questionText: string;
  type: "single" | "multi";
  options: string[];
  marks: number;
}

const API_URL = "http://localhost:5000/api";

function ExamPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch attempt and questions
  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        if (!attemptId) {
          throw new Error("Attempt ID is missing");
        }

        const response = await fetch(
          `${API_URL}/attempts/${attemptId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load exam"
          );
        }

        setAttempt(data.attempt);
        setQuestions(data.questions);
        setAnswers(data.attempt.answers || {});
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load exam";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  // Save answer to backend
  const saveAnswer = async (
    questionId: string,
    selectedAnswers: string[]
  ) => {
    try {
      if (!attemptId) {
        return;
      }

      // Update the UI immediately
      setAnswers((previous) => ({
        ...previous,
        [questionId]: selectedAnswers,
      }));

      const response = await fetch(
        `${API_URL}/attempts/${attemptId}/answer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId,
            selectedAnswers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save answer"
        );
      }
    } catch (err) {
      console.error("Error saving answer:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span>Loading exam...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!attempt) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              ExamForge
            </h1>

            <p className="text-sm text-slate-500">
              JavaScript Fundamentals Test
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3">
            <Clock className="h-5 w-5 text-indigo-600" />

            <span className="font-semibold text-indigo-700">
              Timer coming next
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Exam information */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                JavaScript Fundamentals Test
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {questions.length} questions
              </p>
            </div>

            <div className="rounded-xl bg-green-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />

                <span className="font-semibold text-green-700">
                  {attempt.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={question._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">
                    Question {index + 1}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {question.questionText}
                  </h3>
                </div>

                <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {question.marks} mark
                </span>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <input
                      type={
                        question.type === "multi"
                          ? "checkbox"
                          : "radio"
                      }
                      name={`question-${question._id}`}
                      checked={
                        answers[question._id]?.includes(option) ||
                        false
                      }
                      onChange={() => {
                        const currentAnswers =
                          answers[question._id] || [];

                        // Single-select question
                        if (question.type === "single") {
                          saveAnswer(question._id, [option]);
                          return;
                        }

                        // Multi-select question
                        const alreadySelected =
                          currentAnswers.includes(option);

                        const updatedAnswers = alreadySelected
                          ? currentAnswers.filter(
                              (answer) => answer !== option
                            )
                          : [...currentAnswers, option];

                        saveAnswer(
                          question._id,
                          updatedAnswers
                        );
                      }}
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <span className="text-slate-700">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ExamPage;
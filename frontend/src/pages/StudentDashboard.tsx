import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Clock, FileQuestion, MinusCircle, Play } from "lucide-react";
import { useAppSelector } from "../redux/hooks";

interface Exam {
  _id: string;
  title: string;
  duration: number;
  questionCount: number;
  negativeMarking: boolean;
  negativePenalty: number;
}

const API_URL = "http://localhost:5000/api";

function StudentDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPublishedExams = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/exams/published`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch exams");
        }

        setExams(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedExams();
  }, []);

  // Start Exam
  const handleStartExam = async (examId: string) => {
    if (!user?.id) {
      setError("Student information not found. Please login again.");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/exams/${examId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to start exam"
        );
      }

      // Navigate to the exam page
      navigate(`/exam/${data.attempt._id}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to start exam";

      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              ExamForge
            </h1>

            <p className="text-sm text-slate-500">
              Student Dashboard
            </p>
          </div>

          <div className="text-right">
            <p className="font-semibold text-slate-800">
              {user?.name || "Student"}
            </p>

            <p className="text-sm text-slate-500">
              {user?.email}
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Available Exams
          </h2>

          <p className="mt-2 text-slate-500">
            Choose an exam below to begin your assessment.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Loading exams...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {/* No exams */}
        {!loading && !error && exams.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">
              No exams available
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              There are currently no published exams.
            </p>
          </div>
        )}

        {/* Exam Cards */}
        {!loading && !error && exams.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Title */}
                <div className="mb-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                    <FileQuestion className="h-6 w-6 text-indigo-600" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {exam.title}
                  </h3>
                </div>

                {/* Exam Information */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <span>
                      {exam.duration} minutes
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <FileQuestion className="h-5 w-5 text-slate-400" />
                    <span>
                      {exam.questionCount} questions
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <MinusCircle className="h-5 w-5 text-slate-400" />

                    <span>
                      {exam.negativeMarking
                        ? `Negative marking: -${exam.negativePenalty}`
                        : "No negative marking"}
                    </span>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  type="button"
                  onClick={() => handleStartExam(exam._id)}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Play className="h-5 w-5" />
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
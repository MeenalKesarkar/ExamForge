import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { API_URL } from "../../../config/apiConfig";

interface QuestionDraft {
  questionNumber: string;
  questionText: string;
  type: "single" | "multi";
  options: string[];
  correctAnswers: string[];
  marks: number;
  explanation: string;
  difficulty: "medium";
}

interface ImportIssue {
  questionNumber?: string;
  questionText?: string;
  reason: string;
}

interface PreviewResponse {
  validQuestions: QuestionDraft[];
  issues: ImportIssue[];
}

interface QuestionPdfImportProps {
  examId: string;
  onImported: () => void;
}

// QuestionPdfImport component
export default function QuestionPdfImport({ examId, onImported }: QuestionPdfImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  async function readPdf(file?: File) {
    if (!file) return;

    setError("");
    setSuccess("");
    setPreview(null);
    setLoading(true);

    try {
      const body = new FormData();
      body.append("pdf", file);

      const response = await fetch(
        API_URL + "/questions/exam/" + examId + "/import-pdf",
        {
          method: "POST",
          credentials: "include",
          body,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not read this PDF.");
      }

      setPreview({
        validQuestions: Array.isArray(data.validQuestions)
          ? data.validQuestions
          : [],
        issues: Array.isArray(data.issues) ? data.issues : [],
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not read this PDF."
      );
    } finally {
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function confirmImport() {
    if (!preview || !preview.validQuestions.length) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(
        API_URL + "/questions/exam/" + examId + "/import-pdf/confirm",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: preview.validQuestions }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serverIssues: ImportIssue[] = Array.isArray(data.issues)
          ? data.issues.map((issue: unknown, index: number) => ({
              questionNumber: String(index + 1),
              reason:
                typeof issue === "string"
                  ? issue
                  : "This question could not be imported.",
            }))
          : [];

        if (serverIssues.length) {
          setPreview((current) =>
            current
              ? {
                  ...current,
                  issues: [...current.issues, ...serverIssues],
                }
              : current
          );
        }

        throw new Error(
          data.message || "Could not import these questions."
        );
      }

      const count = Number(data.importedCount || 0);

      setSuccess(
        "Imported " +
          count +
          " question" +
          (count === 1 ? "" : "s") +
          " into the question bank."
      );

      setPreview(null);
      onImported();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not import these questions."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => void readPdf(event.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">
            Import questions from a PDF
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review extracted questions and answers before adding them to this bank.
          </p>
        </div>

        <button
          type="button"
          disabled={loading || saving}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {loading ? "Reading PDF..." : "Upload PDF"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </p>
      )}

      {preview && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                Review extracted questions
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {preview.validQuestions.length} ready to import · {preview.issues.length} need correction
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {preview.issues.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" />
                Questions skipped for review
              </p>

              <ul className="mt-2 space-y-1">
                {preview.issues.map((issue, index) => (
                  <li key={(issue.questionNumber || "pdf") + "-" + index}>
                    {(issue.questionNumber
                      ? "Question " + issue.questionNumber + ": "
                      : "") + issue.reason}
                    {issue.questionText && (
                      <p className="ml-4 mt-1 text-amber-800">
                        {issue.questionText}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.validQuestions.length > 0 && (
            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {preview.validQuestions.map((question, index) => (
                <article
                  key={question.questionNumber + "-" + index}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {question.questionNumber}. {question.questionText}
                  </p>

                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <p
                        key={optionIndex + "-" + option}
                        className={
                          question.correctAnswers.includes(option)
                            ? "text-sm font-semibold text-emerald-700"
                            : "text-sm text-slate-600"
                        }
                      >
                        {String.fromCharCode(65 + optionIndex)}. {option}
                        {question.correctAnswers.includes(option)
                          ? " · Correct"
                          : ""}
                      </p>
                    ))}
                  </div>

                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-indigo-700">
                    {question.type === "multi"
                      ? "Multiple choice"
                      : "Single choice"}
                  </p>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={saving || preview.validQuestions.length === 0}
            onClick={() => void confirmImport()}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving
              ? "Importing..."
              : "Import " +
                preview.validQuestions.length +
                " valid question" +
                (preview.validQuestions.length === 1 ? "" : "s")}
          </button>
        </div>
      )}
    </section>
  );
}

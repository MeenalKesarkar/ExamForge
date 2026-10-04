import { useState } from "react";
import { ArrowLeft, Check, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { FilterType } from "../features/student/types";

const PREFERENCE_KEY = "examforge:student-exam-filter";

const options: { value: FilterType; label: string; description: string }[] = [
  {
    value: "all",
    label: "All exams",
    description: "Show all eligible exams in your feed.",
  },
  {
    value: "negative",
    label: "Negative marking",
    description: "Show exams that use negative marking.",
  },
  {
    value: "no-negative",
    label: "No negative marking",
    description: "Show exams that do not use negative marking.",
  },
];

function getSavedPreference(): FilterType {
  const saved = localStorage.getItem(PREFERENCE_KEY);
  return saved === "negative" || saved === "no-negative" ? saved : "all";
}

export default function StudentPreferences() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<FilterType>(getSavedPreference);
  const [saved, setSaved] = useState(false);

  const savePreference = () => {
    localStorage.setItem(PREFERENCE_KEY, selected);
    setSaved(true);
    window.setTimeout(() => navigate("/student"), 450);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/student")}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-7 text-white sm:p-9">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Settings className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">Exam preferences</h1>
            <p className="mt-2 max-w-xl text-sm text-indigo-100 sm:text-base">
              Choose which eligible exams you want to see first on your dashboard.
            </p>
          </div>

          <div className="space-y-3 p-5 sm:p-8">
            {options.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                  selected === option.value
                    ? "border-indigo-300 bg-indigo-50/70 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="exam-filter"
                  value={option.value}
                  checked={selected === option.value}
                  onChange={() => {
                    setSelected(option.value);
                    setSaved(false);
                  }}
                  className="mt-1 h-4 w-4 accent-indigo-600"
                />
                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">{option.label}</span>
                  <span className="mt-1 block text-sm text-slate-500">{option.description}</span>
                </span>
                {selected === option.value && <Check className="mt-0.5 h-5 w-5 text-indigo-600" />}
              </label>
            ))}

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/student")}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePreference}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
              >
                {saved ? "Saved" : "Save preference"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

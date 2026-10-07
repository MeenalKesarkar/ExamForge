import { BarChart3, CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { Attempt } from "../results";
import { statusLabel } from "../results";

// StatCard component
export function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>

        <BarChart3 className="h-4 w-4 text-slate-300" />
      </div>

      <p className="mt-5 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}

// StatusBadge component
export function StatusBadge({
  status,
  passed,
}: {
  status: Attempt["status"];
  passed?: boolean;
}) {
  if (
    status === "SUBMITTED" ||
    status === "EVALUATED"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium ${
          passed
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
        }`}
      >
        {passed ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}

        {passed
          ? "Passed"
          : "Failed"}
      </span>
    );
  }

  if (status === "TIMED_OUT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700">
        <Clock3 className="h-3.5 w-3.5" />

        {statusLabel(status)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700">
      <Clock3 className="h-3.5 w-3.5" />

      {statusLabel(status)}
    </span>
  );
}

// MobileMetric component
export function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

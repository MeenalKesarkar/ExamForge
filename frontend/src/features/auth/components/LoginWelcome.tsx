import { AlertCircle, GraduationCap } from "lucide-react";

interface LoginWelcomeProps {
  error: string;
}

// LoginWelcome component
export default function LoginWelcome({ error }: LoginWelcomeProps) {
  return (
    <>
      <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-xl bg-[#f5f0ff] px-3 py-2 text-sm font-semibold text-[#7942c5]">
        <GraduationCap className="h-4 w-4 shrink-0" />
        <span>BCA Assessment Portal</span>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#211a2d] sm:text-[34px]">
          Welcome back <span>👋</span>
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Sign in to access your academic assessment dashboard.
        </p>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <span className="min-w-0 break-words leading-5">{error}</span>
        </div>
      )}
    </>
  );
}

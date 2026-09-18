import React, { useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../redux/hooks";
import { login } from "../redux/slices/authSlice";
import { loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState(() => {
    return localStorage.getItem("examforge_remembered_email") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem("examforge_remembered_email"));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser({
        email: trimmedEmail.toLowerCase(),
        password,
      });

      // Save or clear remembered email
      if (rememberMe) {
        localStorage.setItem("examforge_remembered_email", trimmedEmail);
      } else {
        localStorage.removeItem("examforge_remembered_email");
      }

      // Store user + JWT in Redux
      dispatch(
        login({
          user: data.user,
          token: data.token,
        })
      );

      // Redirect according to role
      if (data.user.role === "student") {
        navigate("/student");
      } else if (data.user.role === "instructor") {
        navigate("/instructor");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glow effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-[128px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/20 blur-[128px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[140px]"
      />

      {/* Decorative technical grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      {/* Main Glassmorphic Card Container */}
      <div className="relative z-10 w-full max-w-5xl min-h-[560px] grid lg:grid-cols-12 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-[0_25px_70px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        
        {/* Left Side: Brand Showcase (5 cols on lg) */}
        <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 text-white flex-col justify-between">
          {/* Subtle decorative circles and ambient overlays */}
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-purple-400/20 blur-2xl"
          />

          {/* Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  ExamForge
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/20 tracking-wider">
                    v1.0
                  </span>
                </h1>
                <p className="text-xs text-indigo-100/80">Next-Gen Assessment Cloud</p>
              </div>
            </div>
          </div>

          {/* Central Hero Pitch & Feature Badges */}
          <div className="relative z-10 my-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wide text-indigo-100 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              TEST • LEARN • ACHIEVE
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white mb-4">
              Forge knowledge. <br />
              <span className="text-indigo-200">Master every exam.</span>
            </h2>

            <p className="text-sm text-indigo-100/90 leading-relaxed mb-8">
              A tamper-proof, intelligent exam ecosystem built for seamless evaluations, deep analytics, and role-based test workflows.
            </p>

            {/* Feature Micro-Cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition hover:bg-white/15">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">AI-Assisted Proctoring</h3>
                  <p className="text-[11px] text-indigo-100/80">Secure browser locks & tamper detection</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition hover:bg-white/15">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Real-Time Evaluation</h3>
                  <p className="text-[11px] text-indigo-100/80">Instant scoring & comprehensive rank reports</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition hover:bg-white/15">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Dedicated Role Portals</h3>
                  <p className="text-[11px] text-indigo-100/80">Tailored tools for students & instructors</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Banner / Social Proof */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-indigo-100">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={15} className="text-emerald-300" />
              99.9% Platform Integrity
            </span>
            <span className="text-indigo-200/80">256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Right Side: Authentication Form (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">ExamForge</h1>
                <p className="text-xs text-slate-500">Online Exam Platform</p>
              </div>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Welcome back 👋
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Sign in to continue to your ExamForge portal.
              </p>
            </div>


            {/* Error Message with Icon */}
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700 animate-in fade-in"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                <div className="flex-1 font-medium leading-snug">{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Email Address
                </label>

                <div className="relative group">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck="false"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="name@institution.edu"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Please contact your exam coordinator or institute administrator to reset your password.");
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative group">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600">
                    Remember my email
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 py-3.5 px-6 font-semibold text-sm text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Help / Institutional Registration Notice */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Don't have an institutional account?{" "}
                <span className="font-semibold text-slate-700">
                  Contact your instructor or campus admin.
                </span>
              </p>
            </div>

            {/* Footer Bottom Credentials / Security Notice */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-500" />
                <span>TLS 256-bit encrypted session</span>
              </div>
              <p>© {new Date().getFullYear()} ExamForge. All rights reserved.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
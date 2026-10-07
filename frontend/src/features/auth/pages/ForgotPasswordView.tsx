import React, { type Dispatch, type SetStateAction } from "react";
import ForgotPasswordProgress from "./ForgotPasswordProgress";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

export type Step = "email" | "otp" | "password" | "success";
type FormSubmitHandler = (event: React.FormEvent) => void;
interface ForgotPasswordViewProps {
  step: Step; email: string; setEmail: Dispatch<SetStateAction<string>>;
  otp: string; setOtp: Dispatch<SetStateAction<string>>; otpExpiryMinutes: number;
  newPassword: string; setNewPassword: Dispatch<SetStateAction<string>>;
  confirmPassword: string; setConfirmPassword: Dispatch<SetStateAction<string>>;
  showPassword: boolean; setShowPassword: Dispatch<SetStateAction<boolean>>;
  showConfirmPassword: boolean; setShowConfirmPassword: Dispatch<SetStateAction<boolean>>;
  loading: boolean; resending: boolean; error: string; success: string;
  clearMessages: () => void;
  onBack: () => void; handleSendOTP: FormSubmitHandler; handleVerifyOTP: FormSubmitHandler;
  handleResendOTP: () => void; handleResetPassword: FormSubmitHandler;
}

// ForgotPasswordView component
export default function ForgotPasswordView({
  step, email, setEmail, otp, setOtp, otpExpiryMinutes,
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
  loading, resending, error, success, clearMessages, onBack,
  handleSendOTP, handleVerifyOTP, handleResendOTP, handleResetPassword,
}: ForgotPasswordViewProps) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">

      <div className="mx-auto w-full max-w-xl">

        {/* Header */}

        <div className="mb-8 flex items-center justify-between">

          <button
            type="button"
            onClick={() =>
              onBack()
            }
            className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft
              size={17}
            />

            Back to sign in
          </button>

          <div className="flex items-center gap-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles
                size={21}
                className="text-white"
              />
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-bold text-white">
                ExamForge
              </p>

              <p className="text-xs text-white/50">
                Online Exam Platform
              </p>

            </div>

          </div>

        </div>

        {/* Card */}

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">

          <div className="h-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" />

          <div className="p-6 sm:p-10">

            {/* Icon */}

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">

              {step === "email" && (
                <Mail
                  size={27}
                  className="text-indigo-600"
                />
              )}

              {step === "otp" && (
                <KeyRound
                  size={27}
                  className="text-indigo-600"
                />
              )}

              {step === "password" && (
                <Lock
                  size={27}
                  className="text-indigo-600"
                />
              )}

            </div>

            {/* Title */}

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">

              {step === "email" &&
                "Forgot your password?"}

              {step === "otp" &&
                "Verify your email"}

              {step === "password" &&
                "Create new password"}

            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">

              {step === "email" &&
                "Enter your registered email address and we'll send you a secure OTP."}

              {step === "otp" &&
                `Enter the 6-digit OTP sent to ${email}.`}

              {step === "password" &&
                "Choose a strong password for your ExamForge account."}

            </p>

            <ForgotPasswordProgress step={step} />

            {/* Error */}

            {error && (
              <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <AlertCircle
                  size={19}
                  className="shrink-0"
                />

                <span>
                  {error}
                </span>

              </div>
            )}

            {/* Success */}

            {success && (
              <div className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

                <CheckCircle2
                  size={19}
                  className="shrink-0"
                />

                <span>
                  {success}
                </span>

              </div>
            )}

            {/* Email */}

            {step === "email" && (
              <form
                onSubmit={
                  handleSendOTP
                }
                className="space-y-5"
              >

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(
                          event.target.value
                        );

                        clearMessages();
                      }}
                      placeholder="rahul.student@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP

                      <ArrowRight
                        size={18}
                      />
                    </>
                  )}

                </button>

              </form>
            )}

            {/* OTP */}

            {step === "otp" && (
              <form
                onSubmit={
                  handleVerifyOTP
                }
                className="space-y-5"
              >

                <div>

                  <label
                    htmlFor="otp"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Verification OTP
                  </label>

                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => {
                      setOtp(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      );

                      clearMessages();
                    }}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-xl font-bold tracking-[0.5em] outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    The OTP is valid for {otpExpiryMinutes} minutes.
                  </p>

                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    otp.length !== 6
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify OTP

                      <ArrowRight
                        size={18}
                      />
                    </>
                  )}

                </button>

                <button
                  type="button"
                  onClick={
                    handleResendOTP
                  }
                  disabled={
                    resending
                  }
                  className="mx-auto flex items-center gap-2 text-sm font-semibold text-indigo-600"
                >

                  {resending ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw
                      size={16}
                    />
                  )}

                  Resend OTP

                </button>

              </form>
            )}

            {/* New Password */}

            {step === "password" && (
              <form
                onSubmit={
                  handleResetPassword
                }
                className="space-y-5"
              >

                <div>

                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    New Password
                  </label>

                  <div className="relative">

                    <Lock
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="newPassword"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(
                          event.target.value
                        );

                        clearMessages();
                      }}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={19}
                        />
                      ) : (
                        <Eye
                          size={19}
                        />
                      )}
                    </button>

                  </div>

                </div>

                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">

                    <Lock
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );

                        clearMessages();
                      }}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          size={19}
                        />
                      ) : (
                        <Eye
                          size={19}
                        />
                      )}
                    </button>

                  </div>

                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">

                  <ShieldCheck
                    size={17}
                    className="text-emerald-500"
                  />

                  Password must contain at least 8 characters.

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Updating password...
                    </>
                  ) : (
                    <>
                      Reset Password

                      <ArrowRight
                        size={18}
                      />
                    </>
                  )}

                </button>

              </form>
            )}

            <div className="mt-7 flex items-start gap-3 rounded-xl bg-slate-50 p-4">

              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-indigo-500"
              />

              <p className="text-xs leading-5 text-slate-500">
                Your password is securely hashed on the server.
                ExamForge never stores your password in plain text.
              </p>

            </div>

          </div>

        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          © 2026 ExamForge • Secure Online Examination Platform
        </p>

      </div>
    </div>
  );
}

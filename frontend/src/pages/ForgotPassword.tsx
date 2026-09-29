import React, {
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
} from "../services/authService";

type Step =
  | "email"
  | "otp"
  | "password"
  | "success";

function ForgotPassword() {
  const navigate =
    useNavigate();

  const [step, setStep] =
    useState<Step>("email");

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [resetToken, setResetToken] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // HELPERS
  // ====================================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ====================================================
  // SEND OTP
  // ====================================================

  const handleSendOTP =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      clearMessages();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (!normalizedEmail) {
        setError(
          "Please enter your email address."
        );

        return;
      }

      try {
        setLoading(true);

        await sendForgotPasswordOTP(
          normalizedEmail
        );

        setSuccess(
          "If an account exists with this email, an OTP has been sent."
        );

        setStep("otp");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to send OTP."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // VERIFY OTP
  // ====================================================

  const handleVerifyOTP =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      clearMessages();

      const cleanOTP =
        otp.trim();

      if (
        !/^\d{6}$/.test(
          cleanOTP
        )
      ) {
        setError(
          "Please enter the 6-digit OTP."
        );

        return;
      }

      try {
        setLoading(true);

        const result =
          await verifyForgotPasswordOTP(
            email,
            cleanOTP
          );

        setResetToken(
          result.resetToken
        );

        setSuccess(
          "OTP verified successfully."
        );

        setStep("password");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify OTP."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // RESEND OTP
  // ====================================================

  const handleResendOTP =
    async () => {
      clearMessages();

      try {
        setResending(true);

        await sendForgotPasswordOTP(
          email
        );

        setSuccess(
          "A new OTP has been sent."
        );

        setOtp("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to resend OTP."
        );
      } finally {
        setResending(false);
      }
    };

  // ====================================================
  // RESET PASSWORD
  // ====================================================

  const handleResetPassword =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      clearMessages();

      if (
        newPassword.length < 8
      ) {
        setError(
          "Password must be at least 8 characters long."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match."
        );

        return;
      }

      if (!resetToken) {
        setError(
          "Your password reset session has expired. Please request a new OTP."
        );

        setStep("email");

        return;
      }

      try {
        setLoading(true);

        await resetPassword(
          email,
          resetToken,
          newPassword
        );

        setStep("success");

        setSuccess(
          "Your password has been reset successfully."
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to reset password."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // SUCCESS
  // ====================================================

  if (
    step === "success"
  ) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8">

        <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">

          <div className="w-full rounded-3xl bg-white p-8 text-center shadow-2xl sm:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">

              <CheckCircle2
                size={34}
                className="text-emerald-600"
              />

            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Password reset successfully
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your ExamForge password has been updated.
              You can now sign in using your new password.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white"
            >
              Back to Sign In

              <ArrowRight
                size={18}
              />
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ====================================================
  // MAIN
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">

      <div className="mx-auto w-full max-w-xl">

        {/* Header */}

        <div className="mb-8 flex items-center justify-between">

          <button
            type="button"
            onClick={() =>
              navigate("/")
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

            {/* Progress */}

            <div className="my-7 flex items-center gap-2">

              {[
                "email",
                "otp",
                "password",
              ].map(
                (
                  item,
                  index
                ) => {

                  const active =
                    item === step;

                  const completed =
                    (
                      step === "otp" &&
                      index === 0
                    ) ||
                    (
                      step === "password" &&
                      index < 2
                    );

                  return (
                    <React.Fragment
                      key={item}
                    >

                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          active ||
                          completed
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2
                            size={16}
                          />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {index < 2 && (
                        <div
                          className={`h-1 flex-1 rounded-full ${
                            completed
                              ? "bg-indigo-600"
                              : "bg-slate-100"
                          }`}
                        />
                      )}

                    </React.Fragment>
                  );
                }
              )}

            </div>

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
                    The OTP is valid for 10 minutes.
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

export default ForgotPassword;
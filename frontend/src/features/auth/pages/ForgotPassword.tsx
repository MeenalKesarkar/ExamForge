import React, {
  useState,
} from "react";
import ForgotPasswordView, { type Step } from "./ForgotPasswordView";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
} from "../../../services/authService";

// ForgotPassword component
function ForgotPassword() {
  const navigate =
    useNavigate();

  const [step, setStep] =
    useState<Step>("email");

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [otpExpiryMinutes, setOtpExpiryMinutes] =
    useState(10);

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

        const result = await sendForgotPasswordOTP(
          normalizedEmail
        );

        setOtpExpiryMinutes(result.otpExpiresInMinutes || 10);

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

        const result = await sendForgotPasswordOTP(
          email
        );

        setOtpExpiryMinutes(result.otpExpiresInMinutes || 10);

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
    <ForgotPasswordView
      step={step} email={email} setEmail={setEmail} otp={otp} setOtp={setOtp}
      otpExpiryMinutes={otpExpiryMinutes} newPassword={newPassword} setNewPassword={setNewPassword}
      confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
      showPassword={showPassword} setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
      loading={loading} resending={resending} error={error} success={success}
      clearMessages={clearMessages}
      onBack={() => navigate("/")} handleSendOTP={handleSendOTP}
      handleVerifyOTP={handleVerifyOTP} handleResendOTP={handleResendOTP}
      handleResetPassword={handleResetPassword}
    />
  );
}

export default ForgotPassword;

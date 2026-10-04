import { useState } from "react";
import type {
  FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";
import LoginBrandPanel from "../components/LoginBrandPanel";
import LoginPanel from "../components/LoginPanel";

import { useAppDispatch } from "../redux/hooks";
import { login } from "../redux/slices/authSlice";

import {
  loginUser,
} from "../services/authService";

// ======================================================
// LOGIN PAGE
// ======================================================

export default function Login() {
  const navigate =
    useNavigate();

  const dispatch =
    useAppDispatch();

  // ====================================================
  // FORM STATE
  // ====================================================

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // LOGIN
  // ====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // --------------------------------------------------
    // Required field validation
    // --------------------------------------------------

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Email and password are required."
      );

      return;
    }

    // --------------------------------------------------
    // Email validation
    // --------------------------------------------------

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        normalizedEmail
      )
    ) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    try {
      setLoading(true);

      // ------------------------------------------------
      // BACKEND LOGIN
      // ------------------------------------------------

      const result =
        await loginUser({
          email:
            normalizedEmail,

          password,

          rememberMe,
        });

      // ------------------------------------------------
      // ACCOUNT STATUS
      // ------------------------------------------------
      // Only approved accounts can access ExamForge.
      // The backend is the final security layer, while
      // this check keeps the frontend state consistent.
      // ------------------------------------------------

      if (
        result.user.accountStatus !==
        "approved"
      ) {
        if (
          result.user.accountStatus ===
          "pending"
        ) {
          setError(
            "Your account is pending approval. Please wait for an administrator to approve your account."
          );
        } else if (
          result.user.accountStatus ===
          "rejected"
        ) {
          setError(
            "Your account registration was rejected. Please contact your administrator."
          );
        } else if (
          result.user.accountStatus ===
          "suspended"
        ) {
          setError(
            "Your account has been suspended. Please contact your administrator."
          );
        } else {
          setError(
            "Your account is not approved for ExamForge access."
          );
        }

        return;
      }

      // ------------------------------------------------
      // REDIRECT BASED ON ROLE
      // ------------------------------------------------

      if (
        result.user.role ===
        "student"
      ) {
        dispatch(
          login({
            user: result.user,
            sessionExpiresAt: result.sessionExpiresAt,
          })
        );

        navigate(
          "/student",
          {
            replace: true,
          }
        );
      } else if (
        result.user.role ===
        "instructor"
      ) {
        dispatch(
          login({
            user: result.user,
            sessionExpiresAt: result.sessionExpiresAt,
          })
        );

        navigate(
          "/instructor",
          {
            replace: true,
          }
        );
      } else if (result.user.role === "admin") {
        dispatch(
          login({
            user: result.user,
            sessionExpiresAt: result.sessionExpiresAt,
          })
        );

        navigate("/admin", { replace: true });
      } else {
        setError(
          "Your account does not have access to this portal."
        );
      }
    } catch (err) {
      // ------------------------------------------------
      // ERROR HANDLING
      // ------------------------------------------------

      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";

      setError(
        message
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // FORGOT PASSWORD
  // ====================================================

  const handleForgotPassword =
    () => {
      navigate(
        "/forgot-password"
      );
    };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[#130f1c]
      "
    >

      <div
        className="
          min-h-screen
          w-full
        "
      >

        <div
          className="
            mx-auto
            flex
            min-h-screen
            w-full
            max-w-[1600px]
            flex-col
            lg:flex-row
          "
        >

          {/* =================================================
              LEFT BRAND PANEL
              ================================================= */}

          <LoginBrandPanel />

          {/* =================================================
              RIGHT LOGIN PANEL
              ================================================= */}

          <LoginPanel
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onForgotPassword={handleForgotPassword}
            onRegister={() => navigate("/register")}
          />

        </div>

      </div>

    </main>
  );
}

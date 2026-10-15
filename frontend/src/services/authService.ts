import type { ForgotPasswordResponse, LoginRequest, LoginResponse, RefreshResponse, RegisterRequest, RegisterResponse, ResetPasswordResponse, VerifyOTPResponse } from "../features/auth/types";
import { API_URL } from "../config/apiConfig";
export type { AccountStatus, AuthUser, ForgotPasswordResponse, LoginRequest, LoginResponse, RefreshResponse, RegisterRequest, RegisterResponse, ResetPasswordResponse, TeachingAssignment, UserRole, VerifyOTPResponse } from "../features/auth/types";

// ======================================================
// EXAMFORGE - AUTH SERVICE
// ======================================================

// ======================================================
// PARSE RESPONSE
// ======================================================

type ApiPayload = {
  message?: string;
  user?: unknown;
  [key: string]: unknown;
};

const parseResponse =
  async <T = ApiPayload>(
    response: Response
  ): Promise<T> => {
    const contentType =
      response.headers.get(
        "content-type"
      );

    if (
      contentType?.includes(
        "application/json"
      )
    ) {
      return await response.json() as T;
    }

    const text =
      await response.text();

    return {
      message:
        text ||
        "Unexpected server response",
    } as T;
  };

// ======================================================
// LOGIN
// ======================================================

export const loginUser =
  async (
    data: LoginRequest
  ): Promise<LoginResponse> => {
    try {
      const email =
        data.email
          .trim()
          .toLowerCase();

      if (!email) {
        throw new Error(
          "Please enter your email address."
        );
      }

      if (!data.password) {
        throw new Error(
          "Please enter your password."
        );
      }

      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: "POST",
            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              email,

              password:
                data.password,

              rememberMe:
                Boolean(
                  data.rememberMe
                ),
            }),
          }
        );

      const result =
        await parseResponse<LoginResponse>(
          response
        );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Invalid email or password."
        );
      }

      if (!result?.user) {
        throw new Error(
          "Login response did not contain user information."
        );
      }

      return result as LoginResponse;
    } catch (error) {
      if (
        error instanceof TypeError
      ) {
        throw new Error(
          "Unable to connect to ExamForge. Make sure the backend is running on port 5000.",
          { cause: error }
        );
      }

      throw error;
    }
  };

// ======================================================
// REGISTER
// ======================================================

export const registerUser =
  async (
    data: RegisterRequest
  ): Promise<RegisterResponse> => {
    try {
      const response =
        await fetch(
          `${API_URL}/auth/register`,
          {
            method: "POST",

            /*
             * Keep credentials enabled because
             * this API uses cookie authentication.
             *
             * The backend now intentionally does
             * NOT create login cookies during
             * registration because the account
             * starts as pending.
             */
            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              ...data,

              name:
                data.name.trim(),

              email:
                data.email
                  .trim()
                  .toLowerCase(),

              institution:
                data.institution
                  ?.trim(),
            }),
          }
        );

      const result =
        await parseResponse<RegisterResponse>(
          response
        );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to complete registration."
        );
      }

      if (!result?.user) {
        throw new Error(
          "Registration response did not contain user information."
        );
      }

      return result as RegisterResponse;
    } catch (error) {
      if (
        error instanceof TypeError
      ) {
        throw new Error(
          "Unable to connect to ExamForge. Make sure the backend is running on port 5000.",
          { cause: error }
        );
      }

      throw error;
    }
  };

// ======================================================
// REFRESH
// ======================================================

export const refreshSession =
  async (): Promise<RefreshResponse> => {
    const response =
      await fetch(
        `${API_URL}/auth/refresh`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    const result =
      await parseResponse<RefreshResponse>(
        response
      );

    if (!response.ok) {
      const error = new Error(
        result?.message ||
          "Session expired."
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    if (!result?.user) {
      throw new Error(
        "Refresh response did not contain user information."
      );
    }

    return result as RefreshResponse;
  };

// ======================================================
// LOGOUT
// ======================================================

export const logoutUser =
  async (): Promise<void> => {
    try {
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            Accept:
              "application/json",
          },
        }
      );
    } catch {
      // Clear frontend state anyway.
    }
  };

// Finish the server logout before leaving the protected route, then load a clean
// login page. This prevents ProtectedRoute from starting session restoration
// between clearing Redux state and navigating away.
export const logoutAndReload = async (): Promise<void> => {
  await logoutUser();
  window.location.replace("/");
};

// ======================================================
// SEND OTP
// ======================================================

export const sendForgotPasswordOTP =
  async (
    email: string
  ): Promise<ForgotPasswordResponse> => {
    const response =
      await fetch(
        `${API_URL}/auth/forgot-password/send-otp`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),
          }),
        }
      );

    const result =
      await parseResponse<ForgotPasswordResponse>(
        response
      );

    if (!response.ok) {
      throw new Error(
        result?.message ||
          "Unable to send OTP."
      );
    }

    return result;
  };

// ======================================================
// VERIFY OTP
// ======================================================

export const verifyForgotPasswordOTP =
  async (
    email: string,
    otp: string
  ): Promise<VerifyOTPResponse> => {
    const response =
      await fetch(
        `${API_URL}/auth/forgot-password/verify-otp`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),

            otp:
              otp.trim(),
          }),
        }
      );

    const result =
      await parseResponse<VerifyOTPResponse>(
        response
      );

    if (!response.ok) {
      throw new Error(
        result?.message ||
          "Invalid OTP."
      );
    }

    if (!result?.resetToken) {
      throw new Error(
        "Reset token was not returned."
      );
    }

    return result;
  };

// ======================================================
// RESET PASSWORD
// ======================================================

export const resetPassword =
  async (
    email: string,
    resetToken: string,
    newPassword: string
  ): Promise<ResetPasswordResponse> => {
    const response =
      await fetch(
        `${API_URL}/auth/forgot-password/reset`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),

            resetToken,

            newPassword,
          }),
        }
      );

    const result =
      await parseResponse<ResetPasswordResponse>(
        response
      );

    if (!response.ok) {
      throw new Error(
        result?.message ||
          "Unable to reset password."
      );
    }

    return result;
  };

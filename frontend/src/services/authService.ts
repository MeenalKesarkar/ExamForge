// ======================================================
// EXAMFORGE - AUTH SERVICE
// ======================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/$/, "");

// ======================================================
// TYPES
// ======================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;

  role:
    | "student"
    | "instructor";

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  studentId?: string;

  phone?: string;
  city?: string;
  bio?: string;

  profilePicture?: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  rememberMe?: boolean;
}

export interface RefreshResponse {
  message: string;
  user: AuthUser;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyOTPResponse {
  message: string;
  resetToken: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// ======================================================
// PARSE RESPONSE
// ======================================================

const parseResponse =
  async (
    response: Response
  ): Promise<any> => {
    const contentType =
      response.headers.get(
        "content-type"
      );

    if (
      contentType?.includes(
        "application/json"
      )
    ) {
      return response.json();
    }

    const text =
      await response.text();

    return {
      message:
        text ||
        "Unexpected server response",
    };
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
        await parseResponse(
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
          "Unable to connect to ExamForge. Make sure the backend is running on port 5000."
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
      await parseResponse(
        response
      );

    if (!response.ok) {
      throw new Error(
        result?.message ||
          "Session expired."
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
      await parseResponse(
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
      await parseResponse(
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
      await parseResponse(
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
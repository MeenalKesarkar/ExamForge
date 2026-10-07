export type UserRole =
  | "student"
  | "instructor"
  | "admin";

export type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export interface TeachingAssignment {
  subject: string;
  degree: string;
  yearOfStudy: number;
  semesters: number[];
  classSections: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;

  // Public registration is only for
  // student and instructor.
  role: "student" | "instructor";

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  studentId?: string;
  classSection?: string;

  institution?: string;

  teachingAssignments?:
    TeachingAssignment[];

  phone?: string;
  city?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;

  role: UserRole;

  accountStatus:
    AccountStatus;

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  studentId?: string;
  classSection?: string;

  institution?: string;

  teachingAssignments?:
    TeachingAssignment[];

  phone?: string;
  city?: string;
  bio?: string;
  profilePicture?: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  sessionExpiresAt: number;
  rememberMe?: boolean;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export interface RefreshResponse {
  message: string;
  user: AuthUser;
  sessionExpiresAt: number;
}

export interface ForgotPasswordResponse {
  message: string;
  otpExpiresInMinutes?: number;
}

export interface VerifyOTPResponse {
  message: string;
  resetToken: string;
}

export interface ResetPasswordResponse {
  message: string;
}

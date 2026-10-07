import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import User from "../../models/User";
import PasswordReset from "../../models/PasswordReset";

// =========================================================
// Constants
// =========================================================

export const ACCESS_TOKEN_COOKIE = "examforge_access_token";
export const REFRESH_TOKEN_COOKIE = "examforge_refresh_token";

export const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "";

export const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  process.env.ACCESS_TOKEN_SECRET ||
  "";

export const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

export const SESSION_LIFETIME_MS =
  24 * 60 * 60 * 1000;

export const configuredOtpExpiry = Number(process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES);
export const OTP_EXPIRY_MINUTES = Number.isInteger(configuredOtpExpiry) && configuredOtpExpiry >= 1 && configuredOtpExpiry <= 60
  ? configuredOtpExpiry
  : 10;
export const MAX_OTP_ATTEMPTS = 5;
export const smtpPort = Number(process.env.SMTP_PORT || 587);
export const smtpHost = process.env.SMTP_HOST?.trim() || "";
export const smtpUser = process.env.SMTP_USER?.trim() || "";
export const smtpPassword = process.env.SMTP_PASS?.trim() || "";
export const smtpFrom = process.env.SMTP_FROM?.trim() || smtpUser;
export const smtpSecure = process.env.SMTP_SECURE?.trim().toLowerCase() === "true" || smtpPort === 465;
export const isPlaceholder = (value: string) => /^(your_|replace|changeme|example|<|\$\{)/i.test(value);
export const smtpConfigured = Boolean(
  smtpHost && Number.isInteger(smtpPort) && smtpPort > 0 && smtpPort <= 65535 &&
  smtpUser && smtpPassword && smtpFrom &&
  ![smtpHost, smtpUser, smtpPassword, smtpFrom].some(isPlaceholder)
);

// =========================================================
// Types
// =========================================================

export type UserRole =
  | "student"
  | "instructor"
  | "admin";

export type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export interface TokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
  sessionExpiresAt?: number;
}

// =========================================================
// Cookie options
// =========================================================

export const isProduction =
  process.env.NODE_ENV === "production";

export const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction
    ? ("none" as const)
    : ("lax" as const),
  path: "/",
};

// =========================================================
// Helpers
// =========================================================

export const createAccessToken = (
  userId: string,
  role: UserRole,
  sessionExpiresAt: number
) => {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error(
      "ACCESS_TOKEN_SECRET is not configured"
    );
  }

  return jwt.sign(
    {
      userId,
      role,
      sessionExpiresAt,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn:
        ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    }
  );
};

export const createRefreshToken = (
  userId: string,
  role: UserRole,
  sessionExpiresAt: number
) => {
  if (!REFRESH_TOKEN_SECRET) {
    throw new Error(
      "REFRESH_TOKEN_SECRET is not configured"
    );
  }

  return jwt.sign(
    {
      userId,
      role,
      sessionExpiresAt,
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: Math.max(
        1,
        sessionExpiresAt -
          Math.floor(Date.now() / 1000)
      ),
    }
  );
};

export const setAuthCookies = (
  res: Response,
  userId: string,
  role: UserRole,
  requestedSessionExpiresAt?: number
): number => {
  const now = Math.floor(Date.now() / 1000);
  const sessionExpiresAt =
    requestedSessionExpiresAt ??
    now + SESSION_LIFETIME_MS / 1000;
  const remainingSeconds =
    sessionExpiresAt - now;

  if (remainingSeconds <= 0) {
    throw new Error("Session has expired");
  }

  const accessToken =
    createAccessToken(
      userId,
      role,
      sessionExpiresAt
    );

  const refreshToken =
    createRefreshToken(
      userId,
      role,
      sessionExpiresAt
    );

  res.cookie(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    {
      ...baseCookieOptions,
      maxAge: Math.min(
        15 * 60 * 1000,
        remainingSeconds * 1000
      ),
    }
  );

  res.cookie(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    {
      ...baseCookieOptions,
      maxAge:
        remainingSeconds * 1000,
    }
  );

  return sessionExpiresAt * 1000;
};

export const clearAuthCookies = (
  res: Response
) => {
  res.clearCookie(
    ACCESS_TOKEN_COOKIE,
    baseCookieOptions
  );

  res.clearCookie(
    REFRESH_TOKEN_COOKIE,
    baseCookieOptions
  );
};

export const sanitizeUser = (
  user: any
) => {
  return {
    id: user._id.toString(),

    name: user.name,

    email: user.email,

    role: user.role,

    accountStatus:
      user.accountStatus ??
      "approved",

    degree: user.degree,

    yearOfStudy:
      user.yearOfStudy,

    semester:
      user.semester,

    studentId:
      user.studentId,

    phone: user.phone,

    city: user.city,

    bio: user.bio,

    profilePicture:
      user.profilePicture ||
      null,

    institution:
      user.institution,

    classSection:
      user.classSection,

    teachingAssignments:
      user.teachingAssignments ||
      [],
  };
};

export const normalizeEmail = (
  email: unknown
) => {
  return typeof email === "string"
    ? email
        .trim()
        .toLowerCase()
    : "";
};

export const generateOTP = () => {
  return crypto
    .randomInt(
      100000,
      1000000
    )
    .toString();
};

export const hashOTP = (
  otp: string
) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

// =========================================================
// REGISTER
// POST /api/auth/register
// =========================================================

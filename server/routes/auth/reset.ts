import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../../models/User";
import PasswordReset from "../../models/PasswordReset";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  SESSION_LIFETIME_MS,
  configuredOtpExpiry,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
  smtpPort,
  smtpHost,
  smtpUser,
  smtpPassword,
  smtpFrom,
  smtpSecure,
  isPlaceholder,
  smtpConfigured,
  type UserRole,
  type AccountStatus,
  type TokenPayload,
  isProduction,
  baseCookieOptions,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  sanitizeUser,
  normalizeEmail,
  generateOTP,
  hashOTP,
} from "./helpers";

const router = Router();

router.post(
  "/login",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const email =
        normalizeEmail(
          req.body.email
        );

      const password =
        typeof req.body.password ===
        "string"
          ? req.body.password
          : "";

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Email and password are required",
        });
      }

      const user =
        await User.findOne({
          email,
        });

      /*
       * Do not reveal whether
       * the email exists.
       */

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message:
            "Your account has been disabled. Please contact your campus administrator.",
        });
      }

      // --------------------------------------------------
      // Check account approval status
      // --------------------------------------------------

      const accountStatus =
        user.accountStatus ??
        "approved";

      if (
        accountStatus ===
        "pending"
      ) {
        return res.status(403).json({
          message:
            "Your account is awaiting administrator approval. You will be able to login once your account is approved.",
          accountStatus:
            "pending",
        });
      }

      if (
        accountStatus ===
        "rejected"
      ) {
        return res.status(403).json({
          message:
            "Your account registration was rejected by the administrator.",
          accountStatus:
            "rejected",
        });
      }

      if (
        accountStatus ===
        "suspended"
      ) {
        return res.status(403).json({
          message:
            "Your account has been suspended by the administrator.",
          accountStatus:
            "suspended",
        });
      }

      // --------------------------------------------------
      // Password verification
      // --------------------------------------------------

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!passwordMatches) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      // --------------------------------------------------
      // Only approved users reach this point.
      // --------------------------------------------------

      const sessionExpiresAt = setAuthCookies(
        res,
        user._id.toString(),
        user.role
      );

      return res.status(200).json({
        message:
          "Login successful",

        user:
          sanitizeUser(user),

        sessionExpiresAt,
      });
    } catch (error) {
      console.error(
        "POST /api/auth/login error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to complete login",
      });
    }
  }
);

router.post(
  "/refresh",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const refreshToken =
        req.cookies?.[
          REFRESH_TOKEN_COOKIE
        ];

      if (!refreshToken) {
        return res.status(401).json({
          message:
            "Refresh session not found",
        });
      }

      if (!REFRESH_TOKEN_SECRET) {
        console.error(
          "REFRESH_TOKEN_SECRET is not configured"
        );

        return res.status(500).json({
          message:
            "Authentication configuration error",
        });
      }

      let decoded: TokenPayload;

      try {
        decoded =
          jwt.verify(
            refreshToken,
            REFRESH_TOKEN_SECRET
          ) as TokenPayload;
      } catch {
        clearAuthCookies(res);

        return res.status(401).json({
          message:
            "Refresh session is invalid or expired",
        });
      }

      if (
        !decoded.userId ||
        !decoded.role ||
        !decoded.iat ||
        !decoded.exp
      ) {
        clearAuthCookies(res);

        return res.status(401).json({
          message:
            "Invalid refresh session",
        });
      }

      const maximumSessionExpiry =
        decoded.iat +
        SESSION_LIFETIME_MS / 1000;
      const sessionExpiresAt = Math.min(
        decoded.sessionExpiresAt ?? maximumSessionExpiry,
        maximumSessionExpiry,
        decoded.exp
      );

      if (
        sessionExpiresAt <=
        Math.floor(Date.now() / 1000)
      ) {
        clearAuthCookies(res);
        return res.status(401).json({
          message: "Session expired",
        });
      }

      // --------------------------------------------------
      // Validate role
      // --------------------------------------------------

      if (
        decoded.role !== "student" &&
        decoded.role !==
          "instructor" &&
        decoded.role !== "admin"
      ) {
        clearAuthCookies(res);

        return res.status(401).json({
          message:
            "Invalid refresh session role",
        });
      }

      const user =
        await User.findById(
          decoded.userId
        ).select(
          "_id name email role accountStatus degree yearOfStudy semester studentId classSection institution phone city bio profilePicture teachingAssignments isActive"
        );

      if (!user) {
        clearAuthCookies(res);

        return res.status(401).json({
          message:
            "User not found",
        });
      }

      if (!user.isActive) {
        clearAuthCookies(res);

        return res.status(403).json({
          message:
            "Your account has been disabled",
        });
      }

      // --------------------------------------------------
      // Check current database role
      // --------------------------------------------------

      if (
        user.role !==
        decoded.role
      ) {
        clearAuthCookies(res);

        return res.status(401).json({
          message:
            "Authentication role mismatch",
        });
      }

      // --------------------------------------------------
      // Check current account status
      // --------------------------------------------------

      const accountStatus =
        user.accountStatus ??
        "approved";

      if (
        accountStatus !==
        "approved"
      ) {
        clearAuthCookies(res);

        if (
          accountStatus ===
          "pending"
        ) {
          return res.status(403).json({
            message:
              "Your account is awaiting administrator approval.",
            accountStatus:
              "pending",
          });
        }

        if (
          accountStatus ===
          "rejected"
        ) {
          return res.status(403).json({
            message:
              "Your account registration was rejected by the administrator.",
            accountStatus:
              "rejected",
          });
        }

        if (
          accountStatus ===
          "suspended"
        ) {
          return res.status(403).json({
            message:
              "Your account has been suspended by the administrator.",
            accountStatus:
              "suspended",
          });
        }

        return res.status(403).json({
          message:
            "Your account is not approved.",
        });
      }

      /* Rotate both cookies while preserving the original one-day expiry. */

      const sessionExpiry = setAuthCookies(
        res,
        user._id.toString(),
        user.role,
        sessionExpiresAt
      );

      return res.status(200).json({
        message:
          "Session refreshed successfully",

        user:
          sanitizeUser(user),

        sessionExpiresAt:
          sessionExpiry,
      });
    } catch (error) {
      console.error(
        "POST /api/auth/refresh error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to refresh session",
      });
    }
  }
);

export default router;

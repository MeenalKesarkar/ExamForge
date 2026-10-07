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
  "/forgot-password/reset",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const email =
        normalizeEmail(
          req.body.email
        );

      const resetToken =
        typeof req.body.resetToken ===
        "string"
          ? req.body.resetToken.trim()
          : "";

      const newPassword =
        typeof req.body.newPassword ===
        "string"
          ? req.body.newPassword
          : "";

      if (
        !email ||
        !resetToken ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            "Email, reset token and new password are required",
        });
      }

      if (
        newPassword.length < 8
      ) {
        return res.status(400).json({
          message:
            "Password must contain at least 8 characters",
        });
      }

      const resetRequest =
        await PasswordReset.findOne({
          email,

          resetToken,

          verified: true,
        });

      if (!resetRequest) {
        return res.status(400).json({
          message:
            "Invalid or expired password reset session",
        });
      }

      if (
        !resetRequest.resetTokenExpiresAt ||
        resetRequest
          .resetTokenExpiresAt
          .getTime() <
          Date.now()
      ) {
        return res.status(400).json({
          message:
            "Password reset session has expired. Please start again.",
        });
      }

      if (!resetRequest.userId) {
        return res.status(400).json({
          message:
            "Invalid password reset request",
        });
      }

      const user =
        await User.findById(
          resetRequest.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message:
            "Your account has been disabled",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      user.passwordHash =
        passwordHash;

      await user.save();

      /*
       * Delete the reset request after
       * successful password change so
       * the same token cannot be reused.
       */

      await PasswordReset.deleteOne({
        _id:
          resetRequest._id,
      });

      /*
       * Clear any existing login session.
       * User must log in again with the new password.
       */

      clearAuthCookies(res);

      return res.status(200).json({
        message:
          "Password reset successfully. Please log in with your new password.",
      });
    } catch (error) {
      console.error(
        "POST /api/auth/forgot-password/reset error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to reset password",
      });
    }
  }
);

export default router;

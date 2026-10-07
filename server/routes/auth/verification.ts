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
  "/logout",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      clearAuthCookies(res);

      return res.status(200).json({
        message:
          "Logged out successfully",
      });
    } catch (error) {
      console.error(
        "POST /api/auth/logout error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to complete logout",
      });
    }
  }
);

router.post(
  "/forgot-password/send-otp",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const email =
        normalizeEmail(
          req.body.email
        );

      if (!email) {
        return res.status(400).json({
          message:
            "Email is required",
        });
      }

      if (!smtpConfigured) {
        return res.status(503).json({ message: "Password reset email is not configured. Please contact support." });
      }

      const user =
        await User.findOne({
          email,
        });

      /*
       * Do not expose whether
       * an account exists.
       */

      if (
        !user ||
        !user.isActive
      ) {
        return res.status(200).json({
          message:
            "If an account exists for this email, an OTP has been sent.",
        });
      }

      /*
       * Remove previous password-reset
       * requests for this email.
       */

      await PasswordReset.deleteMany({
        email,
      });

      const otp =
        generateOTP();

      const otpHash =
        hashOTP(otp);

      const expiresAt =
        new Date(
          Date.now() +
            OTP_EXPIRY_MINUTES *
              60 *
              1000
        );

      const resetRequest = await PasswordReset.create({
        userId:
          user._id,

        email,

        otpHash,

        expiresAt,

        attempts: 0,

        verified: false,

        verifiedAt: null,

        resetToken: null,

        resetTokenExpiresAt:
          null,
      });

      if (smtpConfigured) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: { user: smtpUser, pass: smtpPassword },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });
        try {
          await transporter.sendMail({
            from: smtpFrom,
            to: user.email,
            subject: "Your ExamForge password reset code",
            text: `Your ExamForge verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, ignore this email.`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#211a2d"><h2>Reset your ExamForge password</h2><p>Enter this one-time code to continue:</p><p style="font-size:30px;font-weight:700;letter-spacing:8px;color:#7942c5">${otp}</p><p>This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request it, you can ignore this email.</p></div>`,
          });
        } catch (mailError) {
          await PasswordReset.deleteOne({ _id: resetRequest._id });
          console.error("Password reset email delivery failed:", mailError instanceof Error ? mailError.message : "Unknown SMTP error");
          return res.status(502).json({ message: "Could not deliver the reset email. Check the SMTP settings and try again." });
        }
      }

      return res.status(200).json({
        message: "If an account exists for this email, an OTP has been sent.",
        otpExpiresInMinutes: OTP_EXPIRY_MINUTES,
      });
    } catch (error) {
      console.error(
        "POST /api/auth/forgot-password/send-otp error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to send password reset OTP",
      });
    }
  }
);

router.post(
  "/forgot-password/verify-otp",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const email =
        normalizeEmail(
          req.body.email
        );

      const otp =
        typeof req.body.otp ===
        "string"
          ? req.body.otp.trim()
          : "";

      if (
        !email ||
        !otp
      ) {
        return res.status(400).json({
          message:
            "Email and OTP are required",
        });
      }

      if (
        !/^\d{6}$/.test(
          otp
        )
      ) {
        return res.status(400).json({
          message:
            "OTP must contain exactly 6 digits",
        });
      }

      const resetRequest =
        await PasswordReset.findOne({
          email,
        }).sort({
          createdAt: -1,
        });

      if (!resetRequest) {
        return res.status(400).json({
          message:
            "Invalid or expired OTP",
        });
      }

      if (
        resetRequest.expiresAt.getTime() <
        Date.now()
      ) {
        await PasswordReset.deleteOne({
          _id:
            resetRequest._id,
        });

        return res.status(400).json({
          message:
            "OTP has expired. Please request a new OTP.",
        });
      }

      if (
        resetRequest.attempts >=
        MAX_OTP_ATTEMPTS
      ) {
        return res.status(429).json({
          message:
            "Too many incorrect OTP attempts. Please request a new OTP.",
        });
      }

      if (
        resetRequest.verified
      ) {
        return res.status(200).json({
          message:
            "OTP has already been verified",

          verified: true,

          resetToken:
            resetRequest.resetToken,
        });
      }

      const incomingHash =
        hashOTP(otp);

      if (
        incomingHash !==
        resetRequest.otpHash
      ) {
        resetRequest.attempts +=
          1;

        await resetRequest.save();

        return res.status(400).json({
          message:
            "Invalid OTP",

          attemptsRemaining:
            Math.max(
              0,
              MAX_OTP_ATTEMPTS -
                resetRequest.attempts
            ),
        });
      }

      const resetToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      resetRequest.verified =
        true;

      resetRequest.verifiedAt =
        new Date();

      resetRequest.resetToken =
        resetToken;

      resetRequest.resetTokenExpiresAt =
        new Date(
          Date.now() +
            10 * 60 * 1000
        );

      await resetRequest.save();

      return res.status(200).json({
        message:
          "OTP verified successfully",

        verified: true,

        resetToken,
      });
    } catch (error) {
      console.error(
        "POST /api/auth/forgot-password/verify-otp error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to verify OTP",
      });
    }
  }
);

export default router;

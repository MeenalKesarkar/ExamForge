import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User";
import PasswordReset from "../models/PasswordReset";

const router = Router();

/* =========================================================
   Constants
========================================================= */

const ACCESS_TOKEN_COOKIE = "examforge_access_token";
const REFRESH_TOKEN_COOKIE = "examforge_refresh_token";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "";

const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  process.env.ACCESS_TOKEN_SECRET ||
  "";

const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

const REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/* =========================================================
   Types
========================================================= */

interface TokenPayload extends JwtPayload {
  userId: string;
  role: "student" | "instructor";
}

/* =========================================================
   Cookie options
========================================================= */

const isProduction =
  process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
};

/* =========================================================
   Helpers
========================================================= */

const createAccessToken = (
  userId: string,
  role: "student" | "instructor"
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
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    }
  );
};

const createRefreshToken = (
  userId: string,
  role: "student" | "instructor"
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
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn:
        REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    }
  );
};

const setAuthCookies = (
  res: Response,
  userId: string,
  role: "student" | "instructor"
) => {
  const accessToken = createAccessToken(
    userId,
    role
  );

  const refreshToken = createRefreshToken(
    userId,
    role
  );

  res.cookie(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    {
      ...baseCookieOptions,
      maxAge: 15 * 60 * 1000,
    }
  );

  res.cookie(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    {
      ...baseCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }
  );
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie(
    ACCESS_TOKEN_COOKIE,
    baseCookieOptions
  );

  res.clearCookie(
    REFRESH_TOKEN_COOKIE,
    baseCookieOptions
  );
};

const sanitizeUser = (user: any) => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,

    degree: user.degree,
    yearOfStudy: user.yearOfStudy,
    semester: user.semester,
    studentId: user.studentId,

    phone: user.phone,
    city: user.city,
    bio: user.bio,
    profilePicture: user.profilePicture || null,
  };
};

const normalizeEmail = (email: unknown) => {
  return typeof email === "string"
    ? email.trim().toLowerCase()
    : "";
};

const generateOTP = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

const hashOTP = (otp: string) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

/* =========================================================
   LOGIN
   POST /api/auth/login
========================================================= */

router.post(
  "/login",
  async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(
        req.body.email
      );

      const password =
        typeof req.body.password === "string"
          ? req.body.password
          : "";

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required",
        });
      }

      const user = await User.findOne({
        email,
      });

      /*
       * Do not reveal whether the email exists.
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
            "Your account has been disabled. Please contact your instructor or campus administrator.",
        });
      }

      /*
       * Only approved users exist in the system.
       * There is intentionally no public registration route.
       */
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

      setAuthCookies(
        res,
        user._id.toString(),
        user.role
      );

      return res.status(200).json({
        message: "Login successful",
        user: sanitizeUser(user),
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

/* =========================================================
   REFRESH SESSION
   POST /api/auth/refresh
========================================================= */

router.post(
  "/refresh",
  async (req: Request, res: Response) => {
    try {
      const refreshToken =
        req.cookies?.[REFRESH_TOKEN_COOKIE];

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
        decoded = jwt.verify(
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
        !decoded.role
      ) {
        clearAuthCookies(res);

        return res.status(401).json({
          message:
            "Invalid refresh session",
        });
      }

      const user = await User.findById(
        decoded.userId
      ).select(
        "_id name email role degree yearOfStudy semester studentId phone city bio profilePicture isActive"
      );

      if (!user) {
        clearAuthCookies(res);

        return res.status(401).json({
          message: "User not found",
        });
      }

      if (!user.isActive) {
        clearAuthCookies(res);

        return res.status(403).json({
          message:
            "Your account has been disabled",
        });
      }

      /*
       * Rotate both tokens.
       *
       * This extends the active session while the
       * refresh token itself is still valid.
       */
      setAuthCookies(
        res,
        user._id.toString(),
        user.role
      );

      return res.status(200).json({
        message:
          "Session refreshed successfully",
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error(
        "POST /api/auth/refresh error:",
        error
      );

      clearAuthCookies(res);

      return res.status(500).json({
        message:
          "Unable to refresh session",
      });
    }
  }
);

/* =========================================================
   LOGOUT
   POST /api/auth/logout
========================================================= */

router.post(
  "/logout",
  async (_req: Request, res: Response) => {
    try {
      clearAuthCookies(res);

      return res.status(200).json({
        message: "Logged out successfully",
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

/* =========================================================
   SEND FORGOT PASSWORD OTP
   POST /api/auth/forgot-password/send-otp
========================================================= */

router.post(
  "/forgot-password/send-otp",
  async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(
        req.body.email
      );

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      const user = await User.findOne({
        email,
      });

      /*
       * Do not expose whether an account exists.
       */
      if (!user || !user.isActive) {
        return res.status(200).json({
          message:
            "If an account exists for this email, an OTP has been sent.",
        });
      }

      /*
       * Remove previous password-reset requests
       * for this email.
       */
      await PasswordReset.deleteMany({
        email,
      });

      const otp = generateOTP();

      const otpHash = hashOTP(otp);

      const expiresAt = new Date(
        Date.now() +
          OTP_EXPIRY_MINUTES * 60 * 1000
      );

      await PasswordReset.create({
        userId: user._id,
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        verified: false,
        verifiedAt: null,
        resetToken: null,
        resetTokenExpiresAt: null,
      });

      /*
       * DEVELOPMENT MODE
       *
       * We don't have an email provider connected yet.
       * Therefore the OTP is logged on the backend.
       *
       * In production, replace this with an email service.
       */
      console.log(
        `ExamForge password reset OTP for ${email}: ${otp}`
      );

      return res.status(200).json({
        message:
          "If an account exists for this email, an OTP has been sent.",
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

/* =========================================================
   VERIFY FORGOT PASSWORD OTP
   POST /api/auth/forgot-password/verify-otp
========================================================= */

router.post(
  "/forgot-password/verify-otp",
  async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(
        req.body.email
      );

      const otp =
        typeof req.body.otp === "string"
          ? req.body.otp.trim()
          : "";

      if (!email || !otp) {
        return res.status(400).json({
          message:
            "Email and OTP are required",
        });
      }

      if (!/^\d{6}$/.test(otp)) {
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
          _id: resetRequest._id,
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

      if (resetRequest.verified) {
        return res.status(200).json({
          message:
            "OTP has already been verified",
          verified: true,
          resetToken:
            resetRequest.resetToken,
        });
      }

      const incomingHash = hashOTP(otp);

      if (
        incomingHash !== resetRequest.otpHash
      ) {
        resetRequest.attempts += 1;

        await resetRequest.save();

        return res.status(400).json({
          message:
            "Invalid OTP",
          attemptsRemaining: Math.max(
            0,
            MAX_OTP_ATTEMPTS -
              resetRequest.attempts
          ),
        });
      }

      const resetToken =
        crypto.randomBytes(32).toString("hex");

      resetRequest.verified = true;
      resetRequest.verifiedAt = new Date();
      resetRequest.resetToken =
        resetToken;
      resetRequest.resetTokenExpiresAt =
        new Date(
          Date.now() + 10 * 60 * 1000
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

/* =========================================================
   RESET PASSWORD
   POST /api/auth/forgot-password/reset
========================================================= */

router.post(
  "/forgot-password/reset",
  async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(
        req.body.email
      );

      const resetToken =
        typeof req.body.resetToken === "string"
          ? req.body.resetToken.trim()
          : "";

      const newPassword =
        typeof req.body.newPassword === "string"
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

      if (newPassword.length < 8) {
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
        resetRequest.resetTokenExpiresAt.getTime() <
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

      const user = await User.findById(
        resetRequest.userId
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
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

      user.passwordHash = passwordHash;

      await user.save();

      /*
       * Delete the reset request after successful
       * password change so the same token cannot
       * be reused.
       */
      await PasswordReset.deleteOne({
        _id: resetRequest._id,
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
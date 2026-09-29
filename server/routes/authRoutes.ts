// ======================================================
// EXAMFORGE - AUTH ROUTES
// ======================================================

import express, {
  Request,
  Response,
} from "express";

import bcrypt from "bcryptjs";

import jwt, {
  JwtPayload,
  SignOptions,
} from "jsonwebtoken";

import crypto from "crypto";

import nodemailer from "nodemailer";

import User from "../models/User";
import PasswordReset from "../models/PasswordReset";

const router = express.Router();

// ======================================================
// CONFIG
// ======================================================

const ACCESS_TOKEN_COOKIE =
  "examforge_access_token";

const REFRESH_TOKEN_COOKIE =
  "examforge_refresh_token";

const isProduction =
  process.env.NODE_ENV === "production";

const accessSecret =
  process.env.ACCESS_TOKEN_SECRET;

const refreshSecret =
  process.env.REFRESH_TOKEN_SECRET;

if (!accessSecret) {
  console.error(
    "❌ ACCESS_TOKEN_SECRET is missing from .env"
  );
}

if (!refreshSecret) {
  console.error(
    "❌ REFRESH_TOKEN_SECRET is missing from .env"
  );
}

// ======================================================
// SMTP
// ======================================================

const transporter =
  nodemailer.createTransport({
    host:
      process.env.SMTP_HOST ||
      "smtp.gmail.com",

    port: Number(
      process.env.SMTP_PORT ||
        587
    ),

    secure:
      process.env.SMTP_SECURE ===
      "true",

    auth: {
      user:
        process.env.SMTP_USER,
      pass:
        process.env.SMTP_PASS,
    },
  });

// ======================================================
// TOKEN TYPE
// ======================================================

interface TokenPayload
  extends JwtPayload {
  userId: string;
  role:
    | "student"
    | "instructor";
}

// ======================================================
// USER RESPONSE
// ======================================================

const serializeUser = (
  user: any
) => {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,

    degree:
      user.degree || "BCA",

    yearOfStudy:
      user.yearOfStudy,

    semester:
      user.semester,

    studentId:
      user.studentId || "",

    phone:
      user.phone || "",

    city:
      user.city || "",

    bio:
      user.bio || "",

    profilePicture:
      user.profilePicture || "",
  };
};

// ======================================================
// ACCESS TOKEN
// ======================================================

const createAccessToken =
  (user: any): string => {
    if (!accessSecret) {
      throw new Error(
        "ACCESS_TOKEN_SECRET is not configured."
      );
    }

    return jwt.sign(
      {
        userId: String(
          user._id
        ),
        role: user.role,
      },

      accessSecret,

      {
        expiresIn:
          (process.env
            .ACCESS_TOKEN_EXPIRES_IN ||
            "1d") as SignOptions["expiresIn"],
      }
    );
  };

// ======================================================
// REFRESH TOKEN
// ======================================================

const createRefreshToken =
  (user: any): string => {
    if (!refreshSecret) {
      throw new Error(
        "REFRESH_TOKEN_SECRET is not configured."
      );
    }

    return jwt.sign(
      {
        userId: String(
          user._id
        ),
        role: user.role,
      },

      refreshSecret,

      {
        expiresIn:
          (process.env
            .REFRESH_TOKEN_EXPIRES_IN ||
            "3d") as SignOptions["expiresIn"],
      }
    );
  };

// ======================================================
// OTP
// ======================================================

const generateOTP =
  (): string => {
    return crypto
      .randomInt(
        100000,
        1000000
      )
      .toString();
  };

const generateResetToken =
  (): string => {
    return crypto
      .randomBytes(32)
      .toString("hex");
  };

// ======================================================
// LOGIN
// ======================================================

router.post(
  "/login",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        email,
        password,
        rememberMe = false,
      } = req.body;

      if (
        typeof email !==
          "string" ||
        typeof password !==
          "string"
      ) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        });

      // --------------------------------------------------
      // Do not reveal which part is wrong
      // --------------------------------------------------

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message:
            "Your account is inactive. Please contact your instructor or campus administrator.",
        });
      }

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!passwordMatches) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      const accessToken =
        createAccessToken(user);

      const refreshToken =
        createRefreshToken(user);

      // --------------------------------------------------
      // ACCESS COOKIE
      // --------------------------------------------------

      res.cookie(
        ACCESS_TOKEN_COOKIE,
        accessToken,
        {
          httpOnly: true,
          secure: isProduction,

          sameSite:
            isProduction
              ? "strict"
              : "lax",

          maxAge:
            24 *
            60 *
            60 *
            1000,

          path: "/",
        }
      );

      // --------------------------------------------------
      // REFRESH COOKIE
      // --------------------------------------------------

      const refreshOptions: any = {
        httpOnly: true,
        secure: isProduction,

        sameSite:
          isProduction
            ? "strict"
            : "lax",

        path: "/api/auth",
      };

      if (rememberMe) {
        refreshOptions.maxAge =
          3 *
          24 *
          60 *
          60 *
          1000;
      }

      res.cookie(
        REFRESH_TOKEN_COOKIE,
        refreshToken,
        refreshOptions
      );

      return res.status(200).json({
        message:
          "Login successful.",

        user:
          serializeUser(user),

        rememberMe:
          Boolean(rememberMe),
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to complete login. Please try again.",
      });
    }
  }
);

// ======================================================
// REFRESH
// ======================================================

router.post(
  "/refresh",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      if (!refreshSecret) {
        return res.status(500).json({
          message:
            "Authentication configuration is missing.",
        });
      }

      const token =
        req.cookies?.[
          REFRESH_TOKEN_COOKIE
        ];

      if (!token) {
        return res.status(401).json({
          message:
            "No active session.",
        });
      }

      let decoded:
        TokenPayload;

      try {
        decoded =
          jwt.verify(
            token,
            refreshSecret
          ) as TokenPayload;
      } catch {
        return res.status(401).json({
          message:
            "Your session has expired.",
        });
      }

      const user =
        await User.findById(
          decoded.userId
        );

      if (!user) {
        return res.status(401).json({
          message:
            "User account no longer exists.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message:
            "Your account is inactive.",
        });
      }

      const accessToken =
        createAccessToken(user);

      res.cookie(
        ACCESS_TOKEN_COOKIE,
        accessToken,
        {
          httpOnly: true,
          secure: isProduction,

          sameSite:
            isProduction
              ? "strict"
              : "lax",

          maxAge:
            24 *
            60 *
            60 *
            1000,

          path: "/",
        }
      );

      return res.status(200).json({
        message:
          "Session refreshed.",

        user:
          serializeUser(user),
      });
    } catch (error) {
      console.error(
        "Refresh error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to refresh session.",
      });
    }
  }
);

// ======================================================
// LOGOUT
// ======================================================

router.post(
  "/logout",
  async (
    _req: Request,
    res: Response
  ) => {
    res.clearCookie(
      ACCESS_TOKEN_COOKIE,
      {
        httpOnly: true,
        secure: isProduction,

        sameSite:
          isProduction
            ? "strict"
            : "lax",

        path: "/",
      }
    );

    res.clearCookie(
      REFRESH_TOKEN_COOKIE,
      {
        httpOnly: true,
        secure: isProduction,

        sameSite:
          isProduction
            ? "strict"
            : "lax",

        path: "/api/auth",
      }
    );

    return res.status(200).json({
      message:
        "Logged out successfully.",
    });
  }
);

// ======================================================
// FORGOT PASSWORD - SEND OTP
// ======================================================

router.post(
  "/forgot-password/send-otp",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      if (!email) {
        return res.status(400).json({
          message:
            "Email address is required.",
        });
      }

      const user =
        await User.findOne({
          email,
        });

      if (!user) {
        return res.status(200).json({
          message:
            "If an account exists with this email, an OTP has been sent.",
        });
      }

      await PasswordReset.deleteMany({
        email,
      });

      const otp =
        generateOTP();

      const otpHash =
        await bcrypt.hash(
          otp,
          10
        );

      const expiryMinutes =
        Number(
          process.env
            .PASSWORD_RESET_OTP_EXPIRES_MINUTES ||
            10
        );

      await PasswordReset.create({
        userId: user._id,
        email,
        otpHash,

        expiresAt:
          new Date(
            Date.now() +
              expiryMinutes *
                60 *
                1000
          ),

        attempts: 0,
        verified: false,
      });

      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER,

        to: email,

        subject:
          "ExamForge Password Reset OTP",

        text:
          `Your ExamForge password reset OTP is ${otp}. It expires in ${expiryMinutes} minutes.`,

        html: `
          <div style="font-family:Arial,sans-serif;background:#f1f5f9;padding:40px">
            <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:20px;padding:32px">
              <h1 style="color:#4f46e5">ExamForge</h1>
              <p>Password reset verification</p>

              <div style="font-size:34px;font-weight:bold;letter-spacing:10px;text-align:center;background:#eef2ff;padding:20px;border-radius:14px;color:#4338ca">
                ${otp}
              </div>

              <p style="color:#64748b">
                This OTP expires in ${expiryMinutes} minutes.
              </p>
            </div>
          </div>
        `,
      });

      return res.status(200).json({
        message:
          "If an account exists with this email, an OTP has been sent.",
      });
    } catch (error) {
      console.error(
        "Send OTP error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to send OTP.",
      });
    }
  }
);

// ======================================================
// VERIFY OTP
// ======================================================

router.post(
  "/forgot-password/verify-otp",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      const otp =
        req.body.otp?.trim();

      if (!email || !otp) {
        return res.status(400).json({
          message:
            "Email and OTP are required.",
        });
      }

      const reset =
        await PasswordReset.findOne({
          email,
        });

      if (!reset) {
        return res.status(400).json({
          message:
            "OTP is invalid or expired.",
        });
      }

      if (
        new Date() >
        reset.expiresAt
      ) {
        await PasswordReset.deleteOne({
          _id: reset._id,
        });

        return res.status(400).json({
          message:
            "OTP has expired. Request a new one.",
        });
      }

      if (
        reset.attempts >= 5
      ) {
        await PasswordReset.deleteOne({
          _id: reset._id,
        });

        return res.status(429).json({
          message:
            "Too many incorrect attempts. Request a new OTP.",
        });
      }

      const valid =
        await bcrypt.compare(
          otp,
          reset.otpHash
        );

      if (!valid) {
        reset.attempts += 1;

        await reset.save();

        return res.status(400).json({
          message:
            "Invalid OTP.",
          attemptsRemaining:
            Math.max(
              5 -
                reset.attempts,
              0
            ),
        });
      }

      const resetToken =
        generateResetToken();

      reset.verified =
        true;

      reset.verifiedAt =
        new Date();

      reset.resetToken =
        await bcrypt.hash(
          resetToken,
          10
        );

      reset.resetTokenExpiresAt =
        new Date(
          Date.now() +
            10 *
              60 *
              1000
        );

      await reset.save();

      return res.status(200).json({
        message:
          "OTP verified successfully.",
        resetToken,
      });
    } catch (error) {
      console.error(
        "Verify OTP error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to verify OTP.",
      });
    }
  }
);

// ======================================================
// RESET PASSWORD
// ======================================================

router.post(
  "/forgot-password/reset",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      const resetToken =
        req.body.resetToken;

      const newPassword =
        req.body.newPassword;

      if (
        !email ||
        !resetToken ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            "All password reset fields are required.",
        });
      }

      if (
        newPassword.length < 8
      ) {
        return res.status(400).json({
          message:
            "Password must contain at least 8 characters.",
        });
      }

      const reset =
        await PasswordReset.findOne({
          email,
          verified: true,
        });

      if (!reset) {
        return res.status(400).json({
          message:
            "Password reset session is invalid or expired.",
        });
      }

      if (
        !reset.resetTokenExpiresAt ||
        new Date() >
          reset.resetTokenExpiresAt
      ) {
        await PasswordReset.deleteOne({
          _id: reset._id,
        });

        return res.status(400).json({
          message:
            "Password reset session has expired.",
        });
      }

      if (!reset.resetToken) {
        return res.status(400).json({
          message:
            "Invalid password reset session.",
        });
      }

      const valid =
        await bcrypt.compare(
          resetToken,
          reset.resetToken
        );

      if (!valid) {
        return res.status(400).json({
          message:
            "Invalid password reset session.",
        });
      }

      const user =
        await User.findOne({
          email,
        });

      if (!user) {
        return res.status(400).json({
          message:
            "Unable to reset password.",
        });
      }

      user.passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      await user.save();

      await PasswordReset.deleteOne({
        _id: reset._id,
      });

      res.clearCookie(
        ACCESS_TOKEN_COOKIE,
        {
          httpOnly: true,
          secure: isProduction,
          sameSite:
            isProduction
              ? "strict"
              : "lax",
          path: "/",
        }
      );

      res.clearCookie(
        REFRESH_TOKEN_COOKIE,
        {
          httpOnly: true,
          secure: isProduction,
          sameSite:
            isProduction
              ? "strict"
              : "lax",
          path: "/api/auth",
        }
      );

      return res.status(200).json({
        message:
          "Password reset successfully.",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to reset password.",
      });
    }
  }
);

export default router;
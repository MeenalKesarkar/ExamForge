import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User";
import PasswordReset from "../models/PasswordReset";

const router = Router();

// =========================================================
// Constants
// =========================================================

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

const SESSION_LIFETIME_MS =
  24 * 60 * 60 * 1000;

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// =========================================================
// Types
// =========================================================

type UserRole =
  | "student"
  | "instructor"
  | "admin";

type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

interface TokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
  sessionExpiresAt?: number;
}

// =========================================================
// Cookie options
// =========================================================

const isProduction =
  process.env.NODE_ENV === "production";

const baseCookieOptions = {
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

const createAccessToken = (
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

const createRefreshToken = (
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

const setAuthCookies = (
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

const clearAuthCookies = (
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

const sanitizeUser = (
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

const normalizeEmail = (
  email: unknown
) => {
  return typeof email === "string"
    ? email
        .trim()
        .toLowerCase()
    : "";
};

const generateOTP = () => {
  return crypto
    .randomInt(
      100000,
      1000000
    )
    .toString();
};

const hashOTP = (
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

router.post(
  "/register",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const name =
        typeof req.body.name ===
        "string"
          ? req.body.name.trim()
          : "";

      const email =
        normalizeEmail(
          req.body.email
        );

      const password =
        typeof req.body.password ===
        "string"
          ? req.body.password
          : "";

      // --------------------------------------------------
      // Only student and instructor can register publicly.
      // Admin accounts must be created/approved separately.
      // --------------------------------------------------

      const role =
        req.body.role ===
        "instructor"
          ? "instructor"
          : req.body.role ===
            "student"
            ? "student"
            : "";

      if (
        !name ||
        !email ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          message:
            "Name, email, password and role are required",
        });
      }

      if (
        name.length < 2 ||
        name.length > 100
      ) {
        return res.status(400).json({
          message:
            "Name must contain between 2 and 100 characters",
        });
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid email address",
        });
      }

      if (
        password.length < 8
      ) {
        return res.status(400).json({
          message:
            "Password must contain at least 8 characters",
        });
      }

      const existingUser =
        await User.findOne({
          email,
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "An account is already registered with this email. Please login instead.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      // --------------------------------------------------
      // IMPORTANT:
      //
      // Publicly registered users are NOT approved
      // automatically.
      //
      // Admin must approve them first.
      // --------------------------------------------------

      const userData: Record<
        string,
        unknown
      > = {
        name,

        email,

        passwordHash,

        role,

        accountStatus:
          "pending",

        isActive: true,
      };

      // ==================================================
      // STUDENT REGISTRATION
      // ==================================================

      if (
        role === "student"
      ) {
        const degree =
          typeof req.body.degree ===
          "string"
            ? req.body.degree.trim()
            : "BCA";

        const yearOfStudy =
          Number(
            req.body.yearOfStudy
          );

        const semester =
          Number(
            req.body.semester
          );

        const studentId =
          typeof req.body.studentId ===
          "string"
            ? req.body.studentId.trim()
            : "";

        const classSection =
          typeof req.body.classSection ===
          "string"
            ? req.body.classSection.trim()
            : "";

        const institution =
          typeof req.body.institution ===
          "string"
            ? req.body.institution.trim()
            : "ExamForge Academy";

        const phone =
          typeof req.body.phone ===
          "string"
            ? req.body.phone.trim()
            : "";

        const city =
          typeof req.body.city ===
          "string"
            ? req.body.city.trim()
            : "";

        if (
          !degree ||
          ![1, 2, 3].includes(
            yearOfStudy
          ) ||
          ![
            1,
            2,
            3,
            4,
            5,
            6,
          ].includes(semester) ||
          !studentId ||
          !classSection
        ) {
          return res.status(400).json({
            message:
              "Degree, year, semester, student ID and class section are required for student registration",
          });
        }

        const expectedSemesters:
          Record<
            number,
            number[]
          > = {
          1: [1, 2],
          2: [3, 4],
          3: [5, 6],
        };

        if (
          !expectedSemesters[
            yearOfStudy
          ].includes(semester)
        ) {
          return res.status(400).json({
            message:
              "Please select a semester that belongs to the selected year",
          });
        }

        const existingStudentId =
          await User.findOne({
            studentId,
          });

        if (existingStudentId) {
          return res.status(409).json({
            message:
              "This student ID is already registered. Please use a different student ID.",
          });
        }

        userData.degree =
          degree;

        userData.yearOfStudy =
          yearOfStudy;

        userData.semester =
          semester;

        userData.studentId =
          studentId;

        userData.classSection =
          classSection;

        userData.institution =
          institution ||
          "ExamForge Academy";

        if (phone) {
          userData.phone =
            phone;
        }

        if (city) {
          userData.city =
            city;
        }
      }

      // ==================================================
      // INSTRUCTOR REGISTRATION
      // ==================================================

      if (
        role === "instructor"
      ) {
        const institution =
          typeof req.body.institution ===
          "string"
            ? req.body.institution.trim()
            : "";

        const phone =
          typeof req.body.phone ===
          "string"
            ? req.body.phone.trim()
            : "";

        const city =
          typeof req.body.city ===
          "string"
            ? req.body.city.trim()
            : "";

        const teachingAssignments =
          Array.isArray(
            req.body
              .teachingAssignments
          )
            ? req.body
                .teachingAssignments
            : [];

        if (
          !institution ||
          teachingAssignments.length ===
            0
        ) {
          return res.status(400).json({
            message:
              "Institution and at least one teaching assignment are required for instructor registration",
          });
        }

        const normalizedAssignments:
          Array<{
            subject: string;
            degree: string;
            yearOfStudy: number;
            semesters: number[];
            classSections: string[];
          }> =
          teachingAssignments.map(
            (
              assignment: unknown
            ) => {
              const item =
                assignment as Record<
                  string,
                  unknown
                >;

              return {
                subject:
                  typeof item.subject ===
                  "string"
                    ? item.subject.trim()
                    : "",

                degree:
                  typeof item.degree ===
                  "string"
                    ? item.degree.trim()
                    : "BCA",

                yearOfStudy:
                  Number(
                    item.yearOfStudy
                  ),

                semesters:
                  Array.isArray(
                    item.semesters
                  )
                    ? item.semesters
                        .map(
                          Number
                        )
                        .filter(
                          (
                            value: number
                          ) =>
                            [
                              1,
                              2,
                              3,
                              4,
                              5,
                              6,
                            ].includes(
                              value
                            )
                        )
                    : [],

                classSections:
                  Array.isArray(
                    item.classSections
                  )
                    ? item.classSections
                        .map(
                          (
                            value: unknown
                          ) =>
                            String(
                              value
                            ).trim()
                        )
                        .filter(
                          Boolean
                        )
                    : [],
              };
            }
          );

        const invalidAssignment =
          normalizedAssignments.some(
            (
              assignment
            ) =>
              !assignment.subject ||
              !assignment.degree ||
              ![
                1,
                2,
                3,
              ].includes(
                assignment.yearOfStudy
              ) ||
              assignment.semesters
                .length === 0 ||
              assignment.classSections
                .length === 0
          );

        if (
          invalidAssignment
        ) {
          return res.status(400).json({
            message:
              "Every teaching assignment must contain subject, degree, year, at least one semester and at least one class section",
          });
        }

        userData.institution =
          institution;

        userData.teachingAssignments =
          normalizedAssignments;

        if (phone) {
          userData.phone =
            phone;
        }

        if (city) {
          userData.city =
            city;
        }
      }

      // ==================================================
      // CREATE USER
      // ==================================================

      const user =
        await User.create(
          userData
        );

      // --------------------------------------------------
      // IMPORTANT:
      //
      // DO NOT create authentication cookies here.
      //
      // The account is pending and must be approved
      // by an administrator first.
      // --------------------------------------------------

      return res.status(201).json({
        message:
          "Registration submitted successfully. Your account is pending administrator approval.",
        user:
          sanitizeUser(user),
      });
    } catch (error: any) {
      console.error(
        "POST /api/auth/register error:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          message:
            "An account is already registered with these details. Please login instead.",
        });
      }

      return res.status(500).json({
        message:
          "Unable to complete registration",
      });
    }
  }
);

// =========================================================
// LOGIN
// POST /api/auth/login
// =========================================================

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

// =========================================================
// REFRESH SESSION
// POST /api/auth/refresh
// =========================================================

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

      clearAuthCookies(res);

      return res.status(500).json({
        message:
          "Unable to refresh session",
      });
    }
  }
);

// =========================================================
// LOGOUT
// POST /api/auth/logout
// =========================================================

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

// =========================================================
// SEND FORGOT PASSWORD OTP
// POST /api/auth/forgot-password/send-otp
// =========================================================

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

      await PasswordReset.create({
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

// =========================================================
// VERIFY FORGOT PASSWORD OTP
// POST /api/auth/forgot-password/verify-otp
// =========================================================

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

// =========================================================
// RESET PASSWORD
// POST /api/auth/forgot-password/reset
// =========================================================

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

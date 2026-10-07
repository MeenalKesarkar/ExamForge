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

export default router;

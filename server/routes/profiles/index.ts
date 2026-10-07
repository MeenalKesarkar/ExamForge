import { Router, Response } from "express";

import User, { type TeachingAssignment } from "../../models/User";
import { normalizeTeachingAssignments, normalizeString, sanitizeUser } from "./validation";
import Exam from "../../models/Exam";
import Attempt from "../../models/Attempt";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../../middleware/authMiddleware";

const router = Router();

/* =========================================================
   GET CURRENT PROFILE
   GET /api/profile/me
========================================================= */

router.get(
  "/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const user = await User.findById(
        req.user.userId
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

      return res.status(200).json({
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error(
        "GET /api/profile/me error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load your profile",
      });
    }
  }
);

/* =========================================================
   UPDATE CURRENT PROFILE
   PUT /api/profile/me
========================================================= */

router.put(
  "/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const user = await User.findById(
        req.user.userId
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

      /*
       * Name
       */
      if (req.body.name !== undefined) {
        const name = normalizeString(
          req.body.name
        );

        if (!name) {
          return res.status(400).json({
            message: "Name cannot be empty",
          });
        }

        if (name.length < 2) {
          return res.status(400).json({
            message:
              "Name must contain at least 2 characters",
          });
        }

        if (name.length > 100) {
          return res.status(400).json({
            message:
              "Name cannot exceed 100 characters",
          });
        }

        user.name = name;
      }

      /*
       * Phone
       */
      if (req.body.phone !== undefined) {
        const phone =
          normalizeString(
            req.body.phone
          );

        if (
          phone &&
          phone.length > 20
        ) {
          return res.status(400).json({
            message:
              "Phone number is too long",
          });
        }

        user.phone = phone;
      }

      /*
       * City
       */
      if (req.body.city !== undefined) {
        const city =
          normalizeString(
            req.body.city
          );

        if (
          city &&
          city.length > 100
        ) {
          return res.status(400).json({
            message:
              "City name is too long",
          });
        }

        user.city = city;
      }

      /*
       * Bio
       */
      if (req.body.bio !== undefined) {
        const bio =
          normalizeString(
            req.body.bio
          );

        if (
          bio &&
          bio.length > 500
        ) {
          return res.status(400).json({
            message:
              "Bio cannot exceed 500 characters",
          });
        }

        user.bio = bio;
      }

      /*
       * Profile picture
       *
       * The picture is stored separately so the existing Mongoose
       * validation cannot reject a long image data URL.
       */
      let profilePictureToSave:
        | string
        | null
        | undefined;

      if (
        req.body.profilePicture !==
        undefined
      ) {
        const profilePicture =
          normalizeString(
            req.body.profilePicture
          );

        if (
          profilePicture &&
          !profilePicture.startsWith(
            "data:image/"
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid profile picture format",
          });
        }

        if (
          profilePicture &&
          profilePicture.length >
            3_000_000
        ) {
          return res.status(400).json({
            message:
              "Profile picture is too large. Please choose a smaller image.",
          });
        }

        profilePictureToSave =
          profilePicture || null;
      }

      /*
       * Year of study
       */
      if (req.body.yearOfStudy !== undefined) {
        const yearOfStudy = Number(
          req.body.yearOfStudy
        );

        if (
          user.role === "student" &&
          user.yearOfStudy != null &&
          yearOfStudy !== user.yearOfStudy
        ) {
          return res.status(400).json({
            message: "Year of study cannot be changed after registration",
          });
        }

        if (
          !Number.isInteger(yearOfStudy) ||
          yearOfStudy < 1 ||
          yearOfStudy > 3
        ) {
          return res.status(400).json({
            message:
              "Please select a valid BCA year",
          });
        }

        user.yearOfStudy = yearOfStudy;
      }

      /*
       * Semester
       */
      if (req.body.semester !== undefined) {
        const semester = Number(
          req.body.semester
        );

        if (
          user.role === "student" &&
          user.semester != null &&
          semester !== user.semester
        ) {
          return res.status(400).json({
            message: "Semester cannot be changed after registration",
          });
        }

        if (
          !Number.isInteger(semester) ||
          semester < 1 ||
          semester > 6
        ) {
          return res.status(400).json({
            message:
              "Please select a valid semester",
          });
        }

        user.semester = semester;
      }

      /*
       * Instructor institution
       */
      if (
        user.role === "instructor" &&
        req.body.institution !== undefined
      ) {
        const institution =
          normalizeString(
            req.body.institution
          );

        if (!institution) {
          return res.status(400).json({
            message:
              "Institution cannot be empty",
          });
        }

        if (institution.length > 150) {
          return res.status(400).json({
            message:
              "Institution cannot exceed 150 characters",
          });
        }

        user.institution = institution;
      }

      /*
       * Instructor teaching assignments
       */
      if (
        user.role === "instructor" &&
        req.body.teachingAssignments !==
          undefined
      ) {
        const assignments =
          normalizeTeachingAssignments(
            req.body.teachingAssignments
          );

        if (!assignments) {
          return res.status(400).json({
            message:
              "Please provide valid teaching assignments with subject, degree, year, semester and class section.",
          });
        }

        if (assignments.length === 0) {
          return res.status(400).json({
            message:
              "At least one teaching assignment is required.",
          });
        }

        user.teachingAssignments =
          assignments;
      }

      /*
       * Email is intentionally NOT changed here.
       */
      if (
        req.body.email !== undefined &&
        req.body.email !== user.email
      ) {
        return res.status(400).json({
          message:
            "Email changes require OTP verification",
        });
      }

      /*
       * Save all normal profile fields first.
       */
      await user.save({
        validateModifiedOnly: true,
      });

      if (
        profilePictureToSave !==
        undefined
      ) {
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              profilePicture:
                profilePictureToSave,
            },
          }
        );

        user.profilePicture =
          profilePictureToSave;
      }

      return res.status(200).json({
        message:
          "Profile updated successfully",
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error(
        "PUT /api/profile/me error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update your profile",
      });
    }
  }
);

/* =========================================================
   INSTRUCTOR STUDENT DIRECTORY
   GET /api/profile/instructor/students
========================================================= */

router.get(
  "/instructor/students",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user || req.user.role !== "instructor") {
        return res.status(403).json({
          message: "Instructor access required",
        });
      }

      const instructor = await User.findById(req.user.userId)
        .select("teachingAssignments isActive");

      if (!instructor) {
        return res.status(404).json({
          message: "Instructor not found",
        });
      }

      if (!instructor.isActive) {
        return res.status(403).json({
          message: "Your account has been disabled",
        });
      }

      const assignments: TeachingAssignment[] = instructor.teachingAssignments || [];
      const studentGroups = assignments.flatMap((assignment) => {
        if (
          !assignment.degree ||
          !assignment.yearOfStudy ||
          assignment.semesters.length === 0 ||
          assignment.classSections.length === 0
        ) {
          return [];
        }

        return [{
          degree: assignment.degree,
          yearOfStudy: assignment.yearOfStudy,
          semester: { $in: assignment.semesters },
          classSection: { $in: assignment.classSections },
        }];
      });

      if (studentGroups.length === 0) {
        return res.status(200).json({ students: [] });
      }

      const students = await User.find({
        role: "student",
        accountStatus: "approved",
        $or: studentGroups,
      })
        .select("name email studentId degree yearOfStudy semester classSection isActive")
        .sort({ yearOfStudy: 1, semester: 1, name: 1 });

      const exams = await Exam.find({
        createdBy: instructor._id,
        published: true,
      }).select("_id degree yearOfStudy semester");

      const attempts = exams.length && students.length
        ? await Attempt.find({
            examId: { $in: exams.map((exam) => exam._id) },
            studentId: { $in: students.map((student) => student._id) },
          }).select("studentId examId status")
        : [];

      const responseStudents = students.map((student) => {
        const eligibleExamIds = new Set(
          exams
            .filter((exam) =>
              (!exam.degree || exam.degree.trim().toLowerCase() === (student.degree || "").trim().toLowerCase()) &&
              (!exam.yearOfStudy || exam.yearOfStudy === student.yearOfStudy) &&
              (!exam.semester || exam.semester === student.semester)
            )
            .map((exam) => exam._id.toString())
        );

        const studentAttempts = attempts.filter(
          (attempt) =>
            attempt.studentId.toString() === student._id.toString() &&
            eligibleExamIds.has(attempt.examId.toString())
        );

        const attendedExamIds = new Set(
          studentAttempts
            .filter((attempt) => attempt.status !== "IN_PROGRESS")
            .map((attempt) => attempt.examId.toString())
        );

        const inProgressExamIds = new Set(
          studentAttempts
            .filter((attempt) => attempt.status === "IN_PROGRESS")
            .map((attempt) => attempt.examId.toString())
        );

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          degree: student.degree,
          yearOfStudy: student.yearOfStudy,
          semester: student.semester,
          classSection: student.classSection,
          isActive: student.isActive,
          eligibleExamCount: eligibleExamIds.size,
          attemptCount: studentAttempts.length,
          attendedExamCount: attendedExamIds.size,
          inProgressExamCount: inProgressExamIds.size,
        };
      });

      return res.status(200).json({ students: responseStudents });
    } catch (error) {
      console.error("Get instructor students error:", error);
      return res.status(500).json({
        message: "Failed to fetch students",
      });
    }
  }
);

export default router;

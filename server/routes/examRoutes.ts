import express, {
  Request,
  Response,
} from "express";

import mongoose from "mongoose";

import Exam from "../models/Exam";
import Question from "../models/Question";
import Attempt from "../models/Attempt";

import {
  requireAuth,
  requireRole,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = express.Router();

// ======================================================
// TYPES
// ======================================================

interface CreateExamBody {
  title?: string;
  subject?: string;
  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  duration?: number;
  questionCount?: number;
  totalMarks?: number;
  passingMarks?: number;
  allowedAttempts?: number;
  negativeMarking?: boolean;
  negativePenalty?: number;
  instructions?: string;
  published?: boolean;
}

// ======================================================
// HELPER
// ======================================================

const isValidObjectId = (
  value: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

// ======================================================
// GET ALL EXAMS FOR INSTRUCTOR
// ======================================================
//
// Used by the Instructor Dashboard.
//
// GET:
// /api/exams/instructor
//
// ======================================================

router.get(
  "/instructor",
  requireAuth,
  requireRole("instructor"),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const instructorId =
        req.user?.userId;

      if (!instructorId) {
        return res.status(401).json({
          message:
            "Instructor authentication required",
        });
      }

      const exams =
        await Exam.find({
          createdBy:
            instructorId,
        })
          .select(
            [
              "_id",
              "title",
              "subject",
              "degree",
              "yearOfStudy",
              "semester",
              "duration",
              "questionCount",
              "totalMarks",
              "passingMarks",
              "negativeMarking",
              "negativePenalty",
              "allowedAttempts",
              "instructions",
              "published",
              "startDate",
              "endDate",
              "createdBy",
              "createdAt",
              "updatedAt",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json(
        exams
      );
    } catch (error) {
      console.error(
        "Error fetching instructor exams:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch instructor exams",
      });
    }
  }
);

// ======================================================
// CREATE EXAM
// ======================================================
//
// POST:
// /api/exams
//
// Only instructors can create exams.
//
// ======================================================

router.post(
  "/",
  requireAuth,
  requireRole("instructor"),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const instructorId =
        req.user?.userId;

      if (!instructorId) {
        return res.status(401).json({
          message:
            "Instructor authentication required",
        });
      }

      const body =
        req.body as CreateExamBody;

      // --------------------------------------------------
      // Extract values
      // --------------------------------------------------

      const title =
        body.title?.trim() || "";

      const subject =
        body.subject?.trim() || "";

      const degree =
        body.degree?.trim() || "BCA";

      const yearOfStudy =
        Number(body.yearOfStudy);

      const semester =
        Number(body.semester);

      const duration =
        Number(body.duration);

      const questionCount =
        Number(body.questionCount);

      const totalMarks =
        Number(body.totalMarks);

      const passingMarks =
        Number(body.passingMarks);

      const allowedAttempts =
        Number(
          body.allowedAttempts
        );

      const negativeMarking =
        Boolean(
          body.negativeMarking
        );

      const negativePenalty =
        Number(
          body.negativePenalty ?? 0
        );

      const instructions =
        body.instructions?.trim() || "";

      const published =
        Boolean(body.published);

      // --------------------------------------------------
      // Required fields
      // --------------------------------------------------

      if (!title) {
        return res.status(400).json({
          message:
            "Exam title is required",
        });
      }

      if (title.length > 200) {
        return res.status(400).json({
          message:
            "Exam title cannot exceed 200 characters",
        });
      }

      if (!subject) {
        return res.status(400).json({
          message:
            "Subject is required",
        });
      }

      if (subject.length > 150) {
        return res.status(400).json({
          message:
            "Subject cannot exceed 150 characters",
        });
      }

      // --------------------------------------------------
      // Degree validation
      // --------------------------------------------------

      if (
        degree.toUpperCase() !==
        "BCA"
      ) {
        return res.status(400).json({
          message:
            "ExamForge currently supports BCA examinations only",
        });
      }

      // --------------------------------------------------
      // Academic validation
      // --------------------------------------------------

      if (
        !Number.isInteger(
          yearOfStudy
        ) ||
        yearOfStudy < 1 ||
        yearOfStudy > 3
      ) {
        return res.status(400).json({
          message:
            "Year of study must be 1, 2, or 3",
        });
      }

      if (
        !Number.isInteger(
          semester
        ) ||
        semester < 1 ||
        semester > 6
      ) {
        return res.status(400).json({
          message:
            "Semester must be between 1 and 6",
        });
      }

      // --------------------------------------------------
      // Exam configuration validation
      // --------------------------------------------------

      if (
        !Number.isFinite(
          duration
        ) ||
        duration <= 0
      ) {
        return res.status(400).json({
          message:
            "Duration must be greater than 0 minutes",
        });
      }

      if (duration > 600) {
        return res.status(400).json({
          message:
            "Exam duration cannot exceed 600 minutes",
        });
      }

      if (
        !Number.isInteger(
          questionCount
        ) ||
        questionCount <= 0
      ) {
        return res.status(400).json({
          message:
            "Question count must be a positive whole number",
        });
      }

      if (questionCount > 500) {
        return res.status(400).json({
          message:
            "Question count cannot exceed 500",
        });
      }

      if (
        !Number.isFinite(
          totalMarks
        ) ||
        totalMarks <= 0
      ) {
        return res.status(400).json({
          message:
            "Total marks must be greater than 0",
        });
      }

      if (
        !Number.isFinite(
          passingMarks
        ) ||
        passingMarks < 0
      ) {
        return res.status(400).json({
          message:
            "Passing marks cannot be negative",
        });
      }

      if (
        passingMarks >
        totalMarks
      ) {
        return res.status(400).json({
          message:
            "Passing marks cannot exceed total marks",
        });
      }

      // --------------------------------------------------
      // Attempts
      // --------------------------------------------------

      if (
        !Number.isInteger(
          allowedAttempts
        ) ||
        allowedAttempts < 1 ||
        allowedAttempts > 3
      ) {
        return res.status(400).json({
          message:
            "Allowed attempts must be between 1 and 3",
        });
      }

      // --------------------------------------------------
      // Negative marking
      // --------------------------------------------------

      if (
        negativeMarking &&
        (
          !Number.isFinite(
            negativePenalty
          ) ||
          negativePenalty <= 0
        )
      ) {
        return res.status(400).json({
          message:
            "Negative marking penalty must be greater than 0",
        });
      }

      if (
        !negativeMarking &&
        negativePenalty < 0
      ) {
        return res.status(400).json({
          message:
            "Negative penalty cannot be negative",
        });
      }

      // --------------------------------------------------
      // Instructions
      // --------------------------------------------------

      if (
        instructions.length > 3000
      ) {
        return res.status(400).json({
          message:
            "Instructions cannot exceed 3000 characters",
        });
      }

      // --------------------------------------------------
      // Create exam
      // --------------------------------------------------

      const exam =
        await Exam.create({
          title,

          subject,

          degree: "BCA",

          yearOfStudy,

          semester,

          duration,

          questionCount,

          totalMarks,

          passingMarks,

          negativeMarking,

          negativePenalty:
            negativeMarking
              ? negativePenalty
              : 0,

          instructions,

          published,

          allowedAttempts,

          shuffleQuestions:
            false,

          shuffleOptions:
            false,

          createdBy:
            new mongoose.Types.ObjectId(
              instructorId
            ),
        });

      // --------------------------------------------------
      // Response
      // --------------------------------------------------

      return res.status(201).json({
        message: published
          ? "Exam created and published successfully"
          : "Exam saved as draft successfully",

        exam: {
          _id: exam._id,
          title: exam.title,
          subject: exam.subject,
          degree: exam.degree,
          yearOfStudy:
            exam.yearOfStudy,
          semester:
            exam.semester,
          duration:
            exam.duration,
          questionCount:
            exam.questionCount,
          totalMarks:
            exam.totalMarks,
          passingMarks:
            exam.passingMarks,
          allowedAttempts:
            exam.allowedAttempts,
          negativeMarking:
            exam.negativeMarking,
          negativePenalty:
            exam.negativePenalty,
          instructions:
            exam.instructions,
          published:
            exam.published,
          createdBy:
            exam.createdBy,
          createdAt:
            exam.createdAt,
        },
      });
    } catch (error: any) {
      console.error(
        "Error creating exam:",
        error
      );

      // ------------------------------------------------
      // Mongoose validation
      // ------------------------------------------------

      if (
        error?.name ===
        "ValidationError"
      ) {
        const messages =
          Object.values(
            error.errors || {}
          ).map(
            (item: any) =>
              item.message
          );

        return res.status(400).json({
          message:
            messages.join(", ") ||
            "Invalid exam information",
        });
      }

      // ------------------------------------------------
      // Duplicate key
      // ------------------------------------------------

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          message:
            "An exam with this information already exists",
        });
      }

      return res.status(500).json({
        message:
          "Failed to create exam",
      });
    }
  }
);

// ======================================================
// GET PUBLISHED EXAMS
// ======================================================
//
// Used by students.
//
// GET:
// /api/exams/published
//
// Correct answers are intentionally NOT returned.
//
// ======================================================

router.get(
  "/published",
  requireAuth,
  requireRole("student"),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const exams =
        await Exam.find({
          published: true,
        })
          .select(
            [
              "_id",
              "title",
              "subject",
              "degree",
              "yearOfStudy",
              "semester",
              "duration",
              "questionCount",
              "totalMarks",
              "passingMarks",
              "negativeMarking",
              "negativePenalty",
              "allowedAttempts",
              "instructions",
              "startDate",
              "endDate",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json(
        exams
      );
    } catch (error) {
      console.error(
        "Error fetching published exams:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch published exams",
      });
    }
  }
);

// ======================================================
// START EXAM
// ======================================================
//
// POST:
// /api/exams/:examId/start
//
// IMPORTANT:
// The student ID is taken from the authenticated
// session, NOT from the request body.
//
// ======================================================

router.post(
  "/:examId/start",
  requireAuth,
  requireRole("student"),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const {
        examId,
      } = req.params;

      const studentId =
        req.user?.userId;

      if (!studentId) {
        return res.status(401).json({
          message:
            "Student authentication required",
        });
      }

      if (
        !isValidObjectId(
          examId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      // ------------------------------------------------
      // Find published exam
      // ------------------------------------------------

      const exam =
        await Exam.findOne({
          _id: examId,
          published: true,
        });

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found or not published",
        });
      }

      // ------------------------------------------------
      // Academic eligibility
      // ------------------------------------------------

      const User =
        mongoose.model("User");

      const student =
        await User.findById(
          studentId
        ).select(
          "_id role isActive degree yearOfStudy semester"
        );

      if (!student) {
        return res.status(404).json({
          message:
            "Student account not found",
        });
      }

      if (
        student.role !==
        "student"
      ) {
        return res.status(403).json({
          message:
            "Only students can start examinations",
        });
      }

      if (
        !student.isActive
      ) {
        return res.status(403).json({
          message:
            "Your account has been disabled",
        });
      }

      if (
        exam.degree &&
        student.degree &&
        exam.degree.toUpperCase() !==
          student.degree.toUpperCase()
      ) {
        return res.status(403).json({
          message:
            "You are not eligible for this degree-level exam",
        });
      }

      if (
        exam.yearOfStudy &&
        student.yearOfStudy &&
        exam.yearOfStudy !==
          student.yearOfStudy
      ) {
        return res.status(403).json({
          message:
            "This exam is not assigned to your year of study",
        });
      }

      if (
        exam.semester &&
        student.semester &&
        exam.semester !==
          student.semester
      ) {
        return res.status(403).json({
          message:
            "This exam is not assigned to your semester",
        });
      }

      // ------------------------------------------------
      // Check exam schedule
      // ------------------------------------------------

      const now =
        new Date();

      if (
        exam.startDate &&
        now < exam.startDate
      ) {
        return res.status(403).json({
          message:
            "This exam has not started yet",
          startDate:
            exam.startDate,
        });
      }

      if (
        exam.endDate &&
        now > exam.endDate
      ) {
        return res.status(403).json({
          message:
            "This exam is no longer available",
          endDate:
            exam.endDate,
        });
      }

      // ------------------------------------------------
      // Maximum attempts
      // ------------------------------------------------

      const allowedAttempts =
        Math.max(
          1,
          exam.allowedAttempts ||
            1
        );

      const attemptCount =
        await Attempt.countDocuments({
          studentId,
          examId:
            exam._id,
        });

      if (
        attemptCount >=
        allowedAttempts
      ) {
        return res.status(409).json({
          message:
            `You have already used all ${allowedAttempts} attempts for this exam`,
          attemptsUsed:
            attemptCount,
          allowedAttempts,
        });
      }

      // ------------------------------------------------
      // Random question selection
      // ------------------------------------------------

      const questions =
        await Question.aggregate([
          {
            $match: {
              examId:
                exam._id,
            },
          },

          {
            $sample: {
              size:
                exam.questionCount,
            },
          },

          {
            $project: {
              _id: 1,
            },
          },
        ]);

      // ------------------------------------------------
      // Make sure enough questions exist
      // ------------------------------------------------

      if (
        questions.length <
        exam.questionCount
      ) {
        return res.status(400).json({
          message:
            `This exam requires ${exam.questionCount} questions, but only ${questions.length} are available in the question bank`,
        });
      }

      // ------------------------------------------------
      // Store fixed question set
      // ------------------------------------------------

      const questionIds =
        questions.map(
          (question) =>
            question._id
        );

      // ------------------------------------------------
      // Server-side timer
      // ------------------------------------------------

      const startTime =
        new Date();

      const endTime =
        new Date(
          startTime.getTime() +
            exam.duration *
              60 *
              1000
        );

      // ------------------------------------------------
      // Create attempt
      // ------------------------------------------------

      const attempt =
        await Attempt.create({
          studentId,
          examId:
            exam._id,
          questionIds,
          answers: {},
          startTime,
          endTime,
          status:
            "IN_PROGRESS",
        });

      // ------------------------------------------------
      // Response
      // ------------------------------------------------

      return res.status(201).json({
        message:
          "Exam started successfully",

        attempt,

        attemptsUsed:
          attemptCount + 1,

        allowedAttempts,

        attemptsRemaining:
          allowedAttempts -
          (attemptCount + 1),
      });
    } catch (error: any) {
      console.error(
        "Error starting exam:",
        error
      );

      if (
        error?.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          message:
            "Invalid exam or student information",
        });
      }

      return res.status(500).json({
        message:
          "Failed to start exam",
      });
    }
  }
);

// ======================================================
// GET SINGLE EXAM
// ======================================================
//
// Useful for the instructor's exam-management page.
//
// GET:
// /api/exams/:examId
//
// ======================================================

router.get(
  "/:examId",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const {
        examId,
      } = req.params;

      if (
        !isValidObjectId(
          examId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      const exam =
        await Exam.findById(
          examId
        )
          .select(
            [
              "_id",
              "title",
              "subject",
              "degree",
              "yearOfStudy",
              "semester",
              "duration",
              "questionCount",
              "totalMarks",
              "passingMarks",
              "negativeMarking",
              "negativePenalty",
              "allowedAttempts",
              "instructions",
              "published",
              "startDate",
              "endDate",
              "createdBy",
              "createdAt",
              "updatedAt",
            ].join(" ")
          )
          .lean();

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      // ------------------------------------------------
      // Instructor can only view own exam
      // ------------------------------------------------

      if (
        req.user?.role ===
        "instructor"
      ) {
        if (
          exam.createdBy?.toString() !==
          req.user.userId
        ) {
          return res.status(403).json({
            message:
              "You are not authorized to access this exam",
          });
        }
      }

      // ------------------------------------------------
      // Students may view only published exams
      // ------------------------------------------------

      if (
        req.user?.role ===
          "student" &&
        !exam.published
      ) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      return res.status(200).json(
        exam
      );
    } catch (error) {
      console.error(
        "Error fetching exam:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch exam",
      });
    }
  }
);

// ======================================================
// EXPORT
// ======================================================

export default router;
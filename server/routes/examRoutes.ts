import express, {
  Request,
  Response,
} from "express";

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
// GET PUBLISHED EXAMS
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
      const exams = await Exam.find({
        published: true,
      })
        .select(
          [
            "title",
            "duration",
            "questionCount",
            "totalMarks",
            "passingMarks",
            "negativeMarking",
            "negativePenalty",
            "allowedAttempts",
            "degree",
            "yearOfStudy",
            "semester",
            "subject",
            "startDate",
            "endDate",
            "instructions",
          ].join(" ")
        )
        .sort({
          createdAt: -1,
        });

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

router.post(
  "/:examId/start",
  requireAuth,
  requireRole("student"),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------
      // IMPORTANT:
      // Student identity comes from the authenticated
      // HttpOnly JWT cookie.
      // We DO NOT trust studentId from req.body.
      // --------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      const studentId =
        req.user.userId;

      const { examId } =
        req.params;

      // --------------------------------------------------
      // Find published exam
      // --------------------------------------------------

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

      // --------------------------------------------------
      // Check exam schedule
      // --------------------------------------------------

      const now =
        new Date();

      if (
        exam.startDate &&
        now < exam.startDate
      ) {
        return res.status(400).json({
          message:
            "This exam has not started yet",
        });
      }

      if (
        exam.endDate &&
        now > exam.endDate
      ) {
        return res.status(400).json({
          message:
            "This exam is no longer available",
        });
      }

      // --------------------------------------------------
      // Maximum attempts
      // --------------------------------------------------

      const maxAttempts =
        Math.max(
          1,
          exam.allowedAttempts ||
            1
        );

      // --------------------------------------------------
      // Existing attempts
      // --------------------------------------------------

      const attemptCount =
        await Attempt.countDocuments({
          studentId,
          examId:
            exam._id,
        });

      if (
        attemptCount >=
        maxAttempts
      ) {
        return res.status(409).json({
          message:
            `You have used all ${maxAttempts} attempts for this exam`,
          attemptsUsed:
            attemptCount,
          maxAttempts,
        });
      }

      // --------------------------------------------------
      // Random question selection
      // --------------------------------------------------

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

      // --------------------------------------------------
      // Enough questions?
      // --------------------------------------------------

      if (
        questions.length <
        exam.questionCount
      ) {
        return res.status(400).json({
          message:
            "Not enough questions available for this exam",
        });
      }

      // --------------------------------------------------
      // Store fixed question set
      // --------------------------------------------------

      const questionIds =
        questions.map(
          (question) =>
            question._id
        );

      // --------------------------------------------------
      // SERVER-SIDE TIME
      // --------------------------------------------------

      const startTime =
        new Date();

      const endTime =
        new Date(
          startTime.getTime() +
            exam.duration *
              60 *
              1000
        );

      // --------------------------------------------------
      // CREATE ATTEMPT
      // --------------------------------------------------

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

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(201).json({
        message:
          "Exam started successfully",

        attempt,

        attemptsUsed:
          attemptCount + 1,

        maxAttempts,
      });
    } catch (error: any) {
      console.error(
        "Error starting exam:",
        error
      );

      // Mongo duplicate key
      if (
        error?.code ===
        11000
      ) {
        return res.status(409).json({
          message:
            "Unable to create another attempt for this exam",
        });
      }

      return res.status(500).json({
        message:
          "Failed to start exam",
      });
    }
  }
);

export default router;
import express, {
  Response,
} from "express";

import Attempt from "../models/Attempt";
import Question from "../models/Question";
import Exam from "../models/Exam";

import {
  requireAuth,
  requireRole,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router =
  express.Router();

// ======================================================
// EVALUATE ATTEMPT
// ======================================================

const evaluateAttempt =
  async (
    attempt: any,
    exam: any
  ) => {
    const questions =
      await Question.find({
        _id: {
          $in:
            attempt.questionIds,
        },
      });

    let score = 0;
    let totalMarks = 0;

    for (
      const question of questions
    ) {
      totalMarks +=
        question.marks;

      const studentAnswer =
        attempt.answers?.[
          question._id.toString()
        ] || [];

      const correctAnswer =
        question.correctAnswers ||
        [];

      // ------------------------------------------------
      // SINGLE
      // ------------------------------------------------

      if (
        question.type ===
        "single"
      ) {
        const isCorrect =
          studentAnswer.length ===
            1 &&
          correctAnswer.length ===
            1 &&
          studentAnswer[0] ===
            correctAnswer[0];

        if (isCorrect) {
          score +=
            question.marks;
        } else if (
          exam.negativeMarking &&
          studentAnswer.length > 0
        ) {
          score -=
            exam.negativePenalty ||
            0;
        }
      }

      // ------------------------------------------------
      // MULTI
      // ------------------------------------------------

      if (
        question.type ===
        "multi"
      ) {
        const studentSorted =
          [
            ...studentAnswer,
          ].sort();

        const correctSorted =
          [
            ...correctAnswer,
          ].sort();

        const isCorrect =
          studentSorted.length ===
            correctSorted.length &&
          studentSorted.every(
            (
              answer,
              index
            ) =>
              answer ===
              correctSorted[
                index
              ]
          );

        if (isCorrect) {
          score +=
            question.marks;
        } else if (
          exam.negativeMarking &&
          studentAnswer.length > 0
        ) {
          score -=
            exam.negativePenalty ||
            0;
        }
      }
    }

    // Never allow negative final score
    score =
      Math.max(
        0,
        score
      );

    const percentage =
      totalMarks > 0
        ? (score /
            totalMarks) *
          100
        : 0;

    const passed =
      score >=
      (exam.passingMarks ||
        0);

    return {
      questions,
      score,
      totalMarks,
      percentage,
      passed,
    };
  };

// ======================================================
// GET ATTEMPT
// ======================================================

router.get(
  "/:attemptId",
  requireAuth,
  requireRole("student"),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      const attempt =
        await Attempt.findById(
          req.params.attemptId
        );

      if (!attempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
        });
      }

      // ------------------------------------------------
      // Ownership
      // ------------------------------------------------

      if (
        attempt.studentId.toString() !==
        req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You cannot access this attempt",
        });
      }

      // ------------------------------------------------
      // Exam
      // ------------------------------------------------

      const exam =
        await Exam.findById(
          attempt.examId
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      // ------------------------------------------------
      // Server-side expiry
      // ------------------------------------------------

      const now =
        new Date();

      if (
        attempt.status ===
          "IN_PROGRESS" &&
        attempt.endTime &&
        now >=
          attempt.endTime
      ) {
        const result =
          await evaluateAttempt(
            attempt,
            exam
          );

        attempt.score =
          result.score;

        attempt.totalMarks =
          result.totalMarks;

        attempt.percentage =
          result.percentage;

        attempt.passed =
          result.passed;

        attempt.status =
          "TIMED_OUT";

        attempt.submittedAt =
          now;

        await attempt.save();
      }

      // ------------------------------------------------
      // Get assigned questions
      // ------------------------------------------------

      const questions =
        await Question.find({
          _id: {
            $in:
              attempt.questionIds,
          },
        }).select(
          "_id questionText type options marks"
        );

      return res.status(200).json({
        message:
          "Attempt fetched successfully",

        serverNow:
          new Date().toISOString(),

        attempt,

        exam: {
          _id:
            exam._id,

          title:
            exam.title,

          duration:
            exam.duration,

          questionCount:
            exam.questionCount,

          totalMarks:
            exam.totalMarks,

          passingMarks:
            exam.passingMarks,

          negativeMarking:
            exam.negativeMarking,

          negativePenalty:
            exam.negativePenalty,
        },

        questions,
      });
    } catch (error) {
      console.error(
        "Error fetching attempt:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch attempt",
      });
    }
  }
);

// ======================================================
// SAVE ANSWER
// ======================================================

router.patch(
  "/:attemptId/answer",
  requireAuth,
  requireRole("student"),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      const {
        questionId,
        selectedAnswers,
      } = req.body as {
        questionId?: string;
        selectedAnswers?: string[];
      };

      if (
        !questionId ||
        !Array.isArray(
          selectedAnswers
        )
      ) {
        return res.status(400).json({
          message:
            "Question ID and selected answers are required",
        });
      }

      const attempt =
        await Attempt.findById(
          req.params.attemptId
        );

      if (!attempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
        });
      }

      // ------------------------------------------------
      // Ownership
      // ------------------------------------------------

      if (
        attempt.studentId.toString() !==
        req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You cannot modify this attempt",
        });
      }

      // ------------------------------------------------
      // Status
      // ------------------------------------------------

      if (
        attempt.status !==
        "IN_PROGRESS"
      ) {
        return res.status(400).json({
          message:
            "This exam is no longer in progress",
        });
      }

      // ------------------------------------------------
      // Server-side timer
      // ------------------------------------------------

      if (
        attempt.endTime &&
        new Date() >=
          attempt.endTime
      ) {
        return res.status(400).json({
          message:
            "Time is over. The exam has ended.",
        });
      }

      // ------------------------------------------------
      // Question belongs to attempt
      // ------------------------------------------------

      const belongs =
        attempt.questionIds.some(
          (id) =>
            id.toString() ===
            questionId
        );

      if (!belongs) {
        return res.status(400).json({
          message:
            "This question does not belong to this attempt",
        });
      }

      // ------------------------------------------------
      // Save answer
      // ------------------------------------------------

      attempt.answers = {
        ...(attempt.answers ||
          {}),

        [questionId]:
          selectedAnswers,
      };

      attempt.markModified(
        "answers"
      );

      await attempt.save();

      return res.status(200).json({
        message:
          "Answer saved successfully",

        answers:
          attempt.answers,
      });
    } catch (error) {
      console.error(
        "Error saving answer:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to save answer",
      });
    }
  }
);

// ======================================================
// SUBMIT EXAM
// ======================================================

router.post(
  "/:attemptId/submit",
  requireAuth,
  requireRole("student"),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      const attempt =
        await Attempt.findById(
          req.params.attemptId
        );

      if (!attempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
        });
      }

      // ------------------------------------------------
      // Ownership
      // ------------------------------------------------

      if (
        attempt.studentId.toString() !==
        req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You cannot submit this attempt",
        });
      }

      // ------------------------------------------------
      // Already completed
      // ------------------------------------------------

      if (
        attempt.status !==
        "IN_PROGRESS"
      ) {
        return res.status(400).json({
          message:
            "This exam has already been completed",

          result: {
            attemptId:
              attempt._id,

            score:
              attempt.score ||
              0,

            totalMarks:
              attempt.totalMarks ||
              0,

            percentage:
              attempt.percentage ||
              0,

            passed:
              attempt.passed ||
              false,

            status:
              attempt.status,
          },
        });
      }

      // ------------------------------------------------
      // Exam
      // ------------------------------------------------

      const exam =
        await Exam.findById(
          attempt.examId
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      // ------------------------------------------------
      // Server-side timeout
      // ------------------------------------------------

      const now =
        new Date();

      const timedOut =
        Boolean(
          attempt.endTime &&
            now >=
              attempt.endTime
        );

      // ------------------------------------------------
      // Evaluate
      // ------------------------------------------------

      const result =
        await evaluateAttempt(
          attempt,
          exam
        );

      attempt.score =
        result.score;

      attempt.totalMarks =
        result.totalMarks;

      attempt.percentage =
        result.percentage;

      attempt.passed =
        result.passed;

      attempt.submittedAt =
        now;

      attempt.status =
        timedOut
          ? "TIMED_OUT"
          : "SUBMITTED";

      await attempt.save();

      return res.status(200).json({
        message: timedOut
          ? "Time is over. Exam submitted automatically."
          : "Exam submitted successfully",

        result: {
          attemptId:
            attempt._id,

          score:
            result.score,

          totalMarks:
            result.totalMarks,

          percentage:
            result.percentage,

          passed:
            result.passed,

          status:
            attempt.status,
        },
      });
    } catch (error) {
      console.error(
        "Error submitting exam:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to submit exam",
      });
    }
  }
);

export default router;
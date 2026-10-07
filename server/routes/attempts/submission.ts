import { Router, Response } from "express";
import mongoose from "mongoose";
import Attempt, { IAttempt } from "../../models/Attempt";
import Exam from "../../models/Exam";
import Question, { IQuestion } from "../../models/Question";
import { requireAuth, AuthenticatedRequest } from "../../middleware/authMiddleware";

import {
  MAX_PROCTORING_FOCUS_LOSSES,
  type AnswerMap,
  type ScoreResult,
  isValidObjectId,
  getParam,
  normalizeAnswers,
  sameAnswerSet,
  calculateScore,
  getEffectiveEndTime,
  areResultsAvailable,
  closeExpiredAttempt,
  requireStudentOwnership,
  requireInstructorExamAccess,
} from "./helpers";

const router = Router();

router.patch(
  "/:attemptId/answer",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const attemptId =
        getParam(
          req.params.attemptId
        );

      if (!isValidObjectId(attemptId)) {
        return res.status(400).json({
          message:
            "Invalid attempt ID",
        });
      }

      const attempt =
        await Attempt.findById(
          attemptId
        );

      if (!attempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
        });
      }

      if (
        !req.user ||
        req.user.userId !==
          attempt.studentId.toString()
      ) {
        return res.status(403).json({
          message:
            "You do not have access to this attempt",
        });
      }

      if (
        attempt.status !==
        "IN_PROGRESS"
      ) {
        return res.status(409).json({
          message:
            "This attempt is no longer active",
          status:
            attempt.status,
        });
      }

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

      const expired =
        await closeExpiredAttempt(
          attempt,
          exam
        );

      if (expired) {
        return res.status(409).json({
          message:
            "Exam time has expired",
          status:
            "TIMED_OUT",
        });
      }

      const questionId =
        typeof req.body?.questionId ===
        "string"
          ? req.body.questionId
          : "";

      const selectedAnswers =
        normalizeAnswers(
          req.body?.answers
        );

      if (
        !isValidObjectId(
          questionId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid question ID",
        });
      }

      const questionBelongsToAttempt =
        attempt.questionIds.some(
          (
            id: mongoose.Types.ObjectId
          ) =>
            id.toString() ===
            questionId
        );

      if (!questionBelongsToAttempt) {
        return res.status(400).json({
          message:
            "This question does not belong to the attempt",
        });
      }

      const question =
        await Question.findById(
          questionId
        );

      if (!question) {
        return res.status(404).json({
          message:
            "Question not found",
        });
      }

      if (
        question.type ===
          "single" &&
        selectedAnswers.length > 1
      ) {
        return res.status(400).json({
          message:
            "A single-choice question can have only one answer",
        });
      }

      const invalidOption =
        selectedAnswers.some(
          (
            answer: string
          ) =>
            !question.options.includes(
              answer
            )
        );

      if (invalidOption) {
        return res.status(400).json({
          message:
            "One or more selected options are invalid",
        });
      }

      const currentAnswers =
        (attempt.answers ||
          {}) as AnswerMap;

      currentAnswers[
        questionId
      ] = selectedAnswers;

      attempt.answers =
        currentAnswers;

      attempt.markModified(
        "answers"
      );

      await attempt.save();

      return res.status(200).json({
        message:
          "Answer saved",

        answers:
          attempt.answers,
      });
    } catch (error) {
      console.error(
        "Save answer error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to save answer",
      });
    }
  }
);

router.patch(
  "/:attemptId/tab-switch",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const attemptId =
        getParam(
          req.params.attemptId
        );

      if (!isValidObjectId(attemptId)) {
        return res.status(400).json({
          message:
            "Invalid attempt ID",
        });
      }

      const attempt =
        await Attempt.findById(
          attemptId
        );

      if (!attempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
        });
      }

      if (
        !req.user ||
        req.user.userId !==
          attempt.studentId.toString()
      ) {
        return res.status(403).json({
          message:
            "Access denied",
        });
      }

      if (
        attempt.status !==
        "IN_PROGRESS"
      ) {
        return res.status(409).json({
          message:
            "Attempt is no longer active",
          status:
            attempt.status,
        });
      }

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

      const expired =
        await closeExpiredAttempt(
          attempt,
          exam
        );

      if (expired) {
        return res.status(409).json({
          message:
            "Exam time has expired",
          status:
            "TIMED_OUT",
        });
      }

      attempt.tabSwitchCount += 1;

      const terminated =
        attempt.tabSwitchCount >=
          MAX_PROCTORING_FOCUS_LOSSES;

      if (terminated) {
        attempt.proctoringDisqualified = true;
        attempt.status = "SUBMITTED";
        attempt.submissionReason = "SECURITY_VIOLATION";
        attempt.submittedAt = new Date();

        const result = await calculateScore(attempt, exam);
        attempt.score = result.score;
        attempt.totalMarks = result.totalMarks;
        attempt.percentage = result.percentage;
        attempt.passed = result.passed;
      }

      await attempt.save();

      return res.status(200).json({
        message: terminated
          ? "The attempt ended after too many focus losses"
          : "Tab switch recorded",
        tabSwitchCount: attempt.tabSwitchCount,
        terminated,
      });
    } catch (error) {
      console.error(
        "Tab switch error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to record tab switch",
      });
    }
  }
);

router.post(
  "/:attemptId/submit",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const attemptId =
        getParam(
          req.params.attemptId
        );

      if (!isValidObjectId(attemptId)) {
        return res.status(400).json({
          message:
            "Invalid attempt ID",
        });
      }

      const attempt =
        await Attempt.findById(
          attemptId
        );

      if (!attempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
        });
      }

      if (
        !req.user ||
        req.user.userId !==
          attempt.studentId.toString()
      ) {
        return res.status(403).json({
          message:
            "You do not have access to this attempt",
        });
      }

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

      if (
        attempt.status !==
        "IN_PROGRESS"
      ) {
        return res.status(409).json({
          message:
            "This attempt has already been completed",

          status:
            attempt.status,

          score:
            attempt.score ?? 0,

          totalMarks:
            attempt.totalMarks ??
            exam.totalMarks,

          percentage:
            attempt.percentage ?? 0,

          passed:
            attempt.passed ?? false,
        });
      }

      const now = new Date();

      const effectiveEndTime =
        getEffectiveEndTime(
          attempt,
          exam
        );

      const isExpired =
        now >= effectiveEndTime;

      const result =
        await calculateScore(
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
        isExpired
          ? effectiveEndTime
          : now;

      attempt.status =
        isExpired
          ? "TIMED_OUT"
          : "SUBMITTED";

      await attempt.save();

      return res.status(200).json({
        message:
          isExpired
            ? "Exam time expired and attempt was submitted automatically"
            : "Exam submitted successfully",

        attempt: {
          _id: attempt._id,
          status:
            attempt.status,
          submittedAt:
            attempt.submittedAt,
        },

        result: areResultsAvailable(
          exam,
          now
        )
          ? {
              score:
                result.score,
              totalMarks:
                result.totalMarks,
              percentage:
                result.percentage,
              passed:
                result.passed,
              correctCount:
                result.correctCount,
              incorrectCount:
                result.incorrectCount,
              unansweredCount:
                result.unansweredCount,
              answeredCount:
                result.answeredCount,
              passingMarks:
                result.passingMarks,
            }
          : null,

        resultsAvailable:
          areResultsAvailable(
            exam,
            now
          ),
      });
    } catch (error) {
      console.error(
        "Submit attempt error:",
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

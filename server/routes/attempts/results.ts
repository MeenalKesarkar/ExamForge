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

router.get(
  "/:attemptId/result",
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
        attempt.status ===
        "IN_PROGRESS"
      ) {
        const expired =
          await closeExpiredAttempt(
            attempt,
            exam
          );

        if (!expired) {
          return res.status(409).json({
            message:
              "Exam is still in progress",
          });
        }
      }

      const now = new Date();

      const resultsAvailable =
        areResultsAvailable(
          exam,
          now
        );

      const result =
        resultsAvailable
          ? await calculateScore(
              attempt,
              exam
            )
          : null;

      return res.status(200).json({
        attempt: {
          _id: attempt._id,
          status:
            attempt.status,
          startTime:
            attempt.startTime,
          endTime:
            attempt.endTime,
          submittedAt:
            attempt.submittedAt,
          tabSwitchCount:
            attempt.tabSwitchCount,
        },

        exam: {
          _id: exam._id,
          title: exam.title,
          subject: exam.subject,
          totalMarks:
            exam.totalMarks,
          passingMarks:
            exam.passingMarks,
        },

        result,
        resultsAvailable,
      });
    } catch (error) {
      console.error(
        "Get result error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load result",
      });
    }
  }
);

router.get(
  "/exam/:examId/results",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const examId =
        getParam(
          req.params.examId
        );

      const exam =
        await requireInstructorExamAccess(
          req,
          res,
          examId
        );

      if (!exam) {
        return;
      }

      /*
       * First close all attempts whose
       * server-side time has expired.
       */
      const activeAttempts =
        await Attempt.find({
          examId: exam._id,
          status:
            "IN_PROGRESS",
        });

      for (
        const attempt of activeAttempts
      ) {
        await closeExpiredAttempt(attempt, exam);
      }

      /*
       * Fetch the latest attempt data
       * after updating expired attempts.
       */
      const attempts =
        await Attempt.find({
          examId: exam._id,
        })
          .populate(
            "studentId",
            "name email studentId degree yearOfStudy semester"
          )
          .sort({
            createdAt: -1,
          });

      const formattedAttempts =
        await Promise.all(
          attempts.map(
            async (
              attempt: IAttempt
            ) => {
              const result =
                await calculateScore(
                  attempt,
                  exam
                );

              return {
                _id: attempt._id,

                student:
                  attempt.studentId,

                examId:
                  attempt.examId,

                status:
                  attempt.status,

                score:
                  attempt.score ??
                  result.score,

                totalMarks:
                  attempt.totalMarks ??
                  result.totalMarks,

                percentage:
                  attempt.percentage ??
                  result.percentage,

                passed:
                  attempt.passed ??
                  result.passed,

                correctCount:
                  result.correctCount,

                incorrectCount:
                  result.incorrectCount,

                unansweredCount:
                  result.unansweredCount,

                startTime:
                  attempt.startTime,

                endTime:
                  attempt.endTime,

                submittedAt:
                  attempt.submittedAt,

                tabSwitchCount:
                  attempt.tabSwitchCount,

                createdAt:
                  attempt.createdAt,

                updatedAt:
                  attempt.updatedAt,
              };
            }
          )
        );

      return res.status(200).json({
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
        },

        resultsAvailable: true,

        attempts:
          formattedAttempts,
      });
    } catch (error) {
      console.error(
        "Get instructor exam results error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch exam results",
      });
    }
  }
);

router.get(
  "/exam/:examId",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const examId =
        getParam(
          req.params.examId
        );

      const exam =
        await requireInstructorExamAccess(
          req,
          res,
          examId
        );

      if (!exam) {
        return;
      }

      const attempts =
        await Attempt.find({
          examId: exam._id,
        })
          .populate(
            "studentId",
            "name email studentId degree yearOfStudy semester"
          )
          .sort({
            createdAt: -1,
          });

      for (
        const attempt of attempts
      ) {
        if (
          attempt.status ===
            "IN_PROGRESS" &&
          new Date() >=
            new Date(
              attempt.endTime
            )
        ) {
          await closeExpiredAttempt(
            attempt,
            exam
          );
        }
      }

      const updatedAttempts =
        await Attempt.find({
          examId: exam._id,
        })
          .populate(
            "studentId",
            "name email studentId degree yearOfStudy semester"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        attempts:
          updatedAttempts,
        resultsAvailable: true,
      });
    } catch (error) {
      console.error(
        "Get instructor attempts error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch attempts",
      });
    }
  }
);

export default router;

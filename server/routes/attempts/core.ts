import { Router, Response } from "express";
import mongoose from "mongoose";
import Attempt, { IAttempt } from "../../models/Attempt";
import Exam from "../../models/Exam";
import Question, { IQuestion } from "../../models/Question";
import { advanceAttemptTimer } from "../../attemptTimer";
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
  "/student/results",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user || req.user.role !== "student") {
        return res.status(403).json({
          message: "Student access required",
        });
      }

      const attempts = await Attempt.find({
        studentId: req.user.userId,
        status: {
          $in: ["SUBMITTED", "EVALUATED", "TIMED_OUT"],
        },
      }).sort({
        submittedAt: -1,
        createdAt: -1,
      });

      const results = await Promise.all(
        attempts.map(async (attempt) => {
          const exam = await Exam.findById(attempt.examId)
            .select("title subject endDate totalMarks passingMarks");

          if (!exam) return null;

          const resultsAvailable = areResultsAvailable(exam, new Date());

          return {
            attemptId: attempt._id,
            status: attempt.status,
            submittedAt: attempt.submittedAt,
            exam: {
              _id: exam._id,
              title: exam.title,
              subject: exam.subject,
              endDate: exam.endDate,
            },
            resultsAvailable,
            result: resultsAvailable
              ? {
                  score: attempt.score ?? 0,
                  totalMarks: attempt.totalMarks ?? exam.totalMarks,
                  percentage: attempt.percentage ?? 0,
                  passed: attempt.passed ?? false,
                  passingMarks: exam.passingMarks,
                }
              : null,
          };
        })
      );

      return res.status(200).json(
        results.filter((result) => result !== null)
      );
    } catch (error) {
      console.error("Get student results error:", error);
      return res.status(500).json({
        message: "Failed to fetch student results",
      });
    }
  }
);

router.patch("/:attemptId/pause", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attempt = await Attempt.findById(getParam(req.params.attemptId));
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (!req.user || req.user.role !== "student" || req.user.userId !== attempt.studentId.toString()) return res.status(403).json({ message: "You do not have access to this attempt" });
    const exam = await Exam.findById(attempt.examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (attempt.status !== "IN_PROGRESS") return res.status(409).json({ message: "This attempt is no longer active" });
    const timer = advanceAttemptTimer(attempt, exam);
    if (timer.expired) await closeExpiredAttempt(attempt, exam);
    else await attempt.save();
    return res.json({ remainingSeconds: attempt.remainingSeconds ?? 0, timerPaused: false, serverNow: new Date() });
  } catch (error) {
    console.error("Pause attempt timer error:", error);
    return res.status(500).json({ message: "Unable to pause exam timer" });
  }
});

router.patch("/:attemptId/resume", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attempt = await Attempt.findById(getParam(req.params.attemptId));
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (!req.user || req.user.role !== "student" || req.user.userId !== attempt.studentId.toString()) return res.status(403).json({ message: "You do not have access to this attempt" });
    const exam = await Exam.findById(attempt.examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (attempt.status !== "IN_PROGRESS") return res.status(409).json({ message: "This attempt is no longer active" });
    const timer = advanceAttemptTimer(attempt, exam);
    if (timer.expired) { await closeExpiredAttempt(attempt, exam); return res.status(409).json({ message: "The exam time has ended" }); }
    await attempt.save();
    return res.json({ remainingSeconds: attempt.remainingSeconds, timerPaused: false, serverNow: new Date() });
  } catch (error) {
    console.error("Resume attempt timer error:", error);
    return res.status(500).json({ message: "Unable to resume exam timer" });
  }
});

router.patch("/:attemptId/heartbeat", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attempt = await Attempt.findById(getParam(req.params.attemptId));
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (!req.user || req.user.role !== "student" || req.user.userId !== attempt.studentId.toString()) return res.status(403).json({ message: "You do not have access to this attempt" });
    const exam = await Exam.findById(attempt.examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (attempt.status !== "IN_PROGRESS") return res.status(409).json({ message: "This attempt is no longer active" });
    const timer = advanceAttemptTimer(attempt, exam);
    if (timer.expired) await closeExpiredAttempt(attempt, exam); else await attempt.save();
    return res.json({ remainingSeconds: attempt.remainingSeconds ?? 0, timerPaused: attempt.status === "IN_PROGRESS" && Boolean(attempt.timerPaused), status: attempt.status, serverNow: new Date() });
  } catch (error) {
    console.error("Attempt heartbeat error:", error);
    return res.status(500).json({ message: "Unable to sync exam timer" });
  }
});

router.get(
  "/:attemptId",
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

      await closeExpiredAttempt(
        attempt,
        exam
      );

      const now = new Date();
      const timer = attempt.status === "IN_PROGRESS"
        ? advanceAttemptTimer(attempt, exam, now)
        : { remainingSeconds: 0, paused: true, expired: true };
      if (attempt.status === "IN_PROGRESS") await attempt.save();
      if (timer.expired && attempt.status === "IN_PROGRESS") {
        await closeExpiredAttempt(attempt, exam);
      }

      const questions: IQuestion[] =
        await Question.find({
          _id: {
            $in: attempt.questionIds,
          },
        });

      const questionMap =
        new Map<
          string,
          IQuestion
        >(
          questions.map(
            (
              question: IQuestion
            ) => [
              question._id.toString(),
              question,
            ]
          )
        );

      const sanitizedQuestions =
        attempt.questionIds
          .map(
            (
              questionId: mongoose.Types.ObjectId
            ) => {
              const question =
                questionMap.get(
                  questionId.toString()
                );

              if (!question) {
                return null;
              }

              return {
                _id: question._id,
                questionText:
                  question.questionText,
                type: question.type,
                options:
                  question.options,
                marks: question.marks,
                difficulty:
                  question.difficulty,
                order:
                  question.order,
              };
            }
          )
          .filter(
            (
              question:
                | {
                    _id: mongoose.Types.ObjectId;
                    questionText: string;
                    type: string;
                    options: string[];
                    marks: number;
                    difficulty: string;
                    order: number;
                  }
                | null
            ): question is NonNullable<
              typeof question
            > =>
              question !== null
          );

      const answers =
        (attempt.answers ||
          {}) as AnswerMap;

      const resultsAvailable =
        areResultsAvailable(exam, now);

      const result =
        resultsAvailable &&
        attempt.status !==
          "IN_PROGRESS"
          ? {
              score:
                attempt.score ?? 0,
              totalMarks:
                attempt.totalMarks ??
                exam.totalMarks,
              percentage:
                attempt.percentage ??
                0,
              passed:
                attempt.passed ??
                false,
              answeredCount:
                Object.values(answers).filter(
                  (answer) =>
                    Array.isArray(answer) &&
                    answer.length > 0
                ).length,
              unansweredCount:
                attempt.questionIds.length -
                Object.values(answers).filter(
                  (answer) =>
                    Array.isArray(answer) &&
                    answer.length > 0
                ).length,
              passingMarks:
                Number(exam.passingMarks || 0),
            }
          : null;

      return res.status(200).json({
        attempt: {
          _id: attempt._id,
          examId: attempt.examId,
          questionIds:
            attempt.questionIds,
          answers,
          startTime:
            attempt.startTime,
          endTime:
            attempt.endTime,
          submittedAt:
            attempt.submittedAt,
          status:
            attempt.status,
          tabSwitchCount:
            attempt.tabSwitchCount,
          proctoringDisqualified:
            attempt.proctoringDisqualified,
          timerPaused: timer.paused,
        },

        exam: {
          _id: exam._id,
          title: exam.title,
          subject: exam.subject,
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
          instructions:
            exam.instructions,
        },

        questions:
          sanitizedQuestions,

        serverNow: now,

        remainingSeconds: attempt.status === "IN_PROGRESS" ? timer.remainingSeconds : 0,
        timerPaused: attempt.status === "IN_PROGRESS" ? timer.paused : true,

        result,
        resultsAvailable,
      });
    } catch (error) {
      console.error(
        "Get attempt error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load exam attempt",
      });
    }
  }
);

export default router;

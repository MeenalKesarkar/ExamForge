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
  "/instructor/:attemptId",
  requireAuth,
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

      if (
        req.user.role !==
        "instructor"
      ) {
        return res.status(403).json({
          message:
            "Instructor access required",
        });
      }

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
        ).populate(
          "studentId",
          "name email studentId degree yearOfStudy semester phone city"
        );

      if (!attempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
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
        exam.createdBy.toString() !==
        req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You do not have access to this attempt",
        });
      }

      await closeExpiredAttempt(
        attempt,
        exam
      );

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

      const answers =
        (attempt.answers ||
          {}) as AnswerMap;

      const questionResults =
        attempt.questionIds
          .map(
            (
              questionId: mongoose.Types.ObjectId,
              index: number
            ) => {
              const question =
                questionMap.get(
                  questionId.toString()
                );

              if (!question) {
                return null;
              }

              const selectedAnswers =
                normalizeAnswers(
                  answers[
                    questionId.toString()
                  ]
                );

              const correctAnswers =
                normalizeAnswers(
                  question.correctAnswers
                );

              const unanswered =
                selectedAnswers.length ===
                0;

              const correct =
                !unanswered &&
                sameAnswerSet(
                  selectedAnswers,
                  correctAnswers
                );

              return {
                _id:
                  question._id,

                questionNumber:
                  index + 1,

                questionText:
                  question.questionText,

                type:
                  question.type,

                options:
                  question.options,

                selectedAnswers,

                correctAnswers,

                marks:
                  question.marks,

                difficulty:
                  question.difficulty,

                explanation:
                  question.explanation,

                isCorrect:
                  correct,

                isAnswered:
                  selectedAnswers.length > 0,

                isUnanswered:
                  unanswered,
              };
            }
          )
          .filter(
            (
              question:
                | {
                    _id: mongoose.Types.ObjectId;
                    questionNumber: number;
                    questionText: string;
                    type: string;
                    options: string[];
                    selectedAnswers: string[];
                    correctAnswers: string[];
                    marks: number;
                    difficulty: string;
                    explanation?: string;
                    isCorrect: boolean;
                    isAnswered: boolean;
                    isUnanswered: boolean;
                  }
                | null
            ): question is NonNullable<
              typeof question
            > =>
              question !== null
          );

      const result =
        await calculateScore(
          attempt,
          exam
        );

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

        student:
          attempt.studentId,

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
          negativeMarking:
            exam.negativeMarking,
          negativePenalty:
            exam.negativePenalty,
        },

        result,

        resultsAvailable: true,

        questions:
          questionResults,
      });
    } catch (error) {
      console.error(
        "Get instructor attempt details error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch attempt details",
      });
    }
  }
);

export default router;

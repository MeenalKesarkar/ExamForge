import { Router, Response } from "express";
import mongoose from "mongoose";

import Attempt, {
  IAttempt,
} from "../models/Attempt";

import Exam from "../models/Exam";

import Question, {
  IQuestion,
} from "../models/Question";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = Router();

/* =========================================================
   TYPES
========================================================= */

type AnswerMap = Record<string, string[]>;

interface ScoreResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

/* =========================================================
   HELPERS
========================================================= */

const isValidObjectId = (
  value: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(value);
};

const getParam = (
  value: string | string[] | undefined
): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const normalizeAnswers = (
  answers: unknown
): string[] => {
  if (!Array.isArray(answers)) {
    return [];
  }

  return answers
    .map((answer: unknown) => String(answer))
    .filter((answer: string) => answer.length > 0);
};

const sameAnswerSet = (
  first: string[],
  second: string[]
): boolean => {
  if (first.length !== second.length) {
    return false;
  }

  const firstSet = new Set(first);
  const secondSet = new Set(second);

  if (firstSet.size !== secondSet.size) {
    return false;
  }

  for (const value of firstSet) {
    if (!secondSet.has(value)) {
      return false;
    }
  }

  return true;
};

/* =========================================================
   CALCULATE SCORE
========================================================= */

const calculateScore = async (
  attempt: IAttempt,
  exam: any
): Promise<ScoreResult> => {
  const questions: IQuestion[] =
    await Question.find({
      _id: {
        $in: attempt.questionIds,
      },
    });

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const answers =
    (attempt.answers || {}) as AnswerMap;

  for (const question of questions) {
    const questionId =
      question._id.toString();

    const selectedAnswers =
      normalizeAnswers(
        answers[questionId]
      );

    const correctAnswers =
      normalizeAnswers(
        question.correctAnswers
      );

    if (selectedAnswers.length === 0) {
      unansweredCount += 1;
      continue;
    }

    const isCorrect =
      sameAnswerSet(
        selectedAnswers,
        correctAnswers
      );

    if (isCorrect) {
      correctCount += 1;

      score += Number(
        question.marks || 0
      );
    } else {
      incorrectCount += 1;

      if (exam.negativeMarking) {
        score -= Number(
          exam.negativePenalty || 0
        );
      }
    }
  }

  const totalMarks =
    typeof exam.totalMarks === "number"
      ? exam.totalMarks
      : questions.reduce(
          (
            total: number,
            question: IQuestion
          ) =>
            total +
            Number(
              question.marks || 0
            ),
          0
        );

  score = Math.max(0, score);

  const percentage =
    totalMarks > 0
      ? Number(
          (
            (score / totalMarks) *
            100
          ).toFixed(2)
        )
      : 0;

  const passed =
    score >=
    Number(exam.passingMarks || 0);

  return {
    score,
    totalMarks,
    percentage,
    passed,
    correctCount,
    incorrectCount,
    unansweredCount,
  };
};

/* =========================================================
   CLOSE EXPIRED ATTEMPT
========================================================= */

const closeExpiredAttempt = async (
  attempt: IAttempt,
  exam: any
): Promise<boolean> => {
  if (
    attempt.status !== "IN_PROGRESS" ||
    new Date() <
      new Date(attempt.endTime)
  ) {
    return false;
  }

  const result =
    await calculateScore(
      attempt,
      exam
    );

  attempt.status = "TIMED_OUT";

  attempt.submittedAt =
    attempt.endTime;

  attempt.score =
    result.score;

  attempt.totalMarks =
    result.totalMarks;

  attempt.percentage =
    result.percentage;

  attempt.passed =
    result.passed;

  await attempt.save();

  return true;
};

/* =========================================================
   STUDENT OWNERSHIP
========================================================= */

const requireStudentOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  studentId: string
): boolean => {
  if (!req.user) {
    res.status(401).json({
      message:
        "Authentication required",
    });

    return false;
  }

  if (req.user.role !== "student") {
    res.status(403).json({
      message:
        "Student access required",
    });

    return false;
  }

  if (
    req.user.userId !== studentId
  ) {
    res.status(403).json({
      message:
        "You do not have access to this attempt",
    });

    return false;
  }

  return true;
};

/* =========================================================
   INSTRUCTOR EXAM ACCESS
========================================================= */

const requireInstructorExamAccess =
  async (
    req: AuthenticatedRequest,
    res: Response,
    examId: string
  ) => {
    if (!req.user) {
      res.status(401).json({
        message:
          "Authentication required",
      });

      return null;
    }

    if (
      req.user.role !== "instructor"
    ) {
      res.status(403).json({
        message:
          "Instructor access required",
      });

      return null;
    }

    if (!isValidObjectId(examId)) {
      res.status(400).json({
        message:
          "Invalid exam ID",
      });

      return null;
    }

    const exam =
      await Exam.findById(examId);

    if (!exam) {
      res.status(404).json({
        message:
          "Exam not found",
      });

      return null;
    }

    if (
      exam.createdBy.toString() !==
      req.user.userId
    ) {
      res.status(403).json({
        message:
          "You do not have access to this exam",
      });

      return null;
    }

    return exam;
  };

/* =========================================================
   GET SINGLE ATTEMPT
   GET /api/attempts/:attemptId
========================================================= */

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

      const remainingSeconds =
        attempt.status ===
        "IN_PROGRESS"
          ? Math.max(
              0,
              Math.floor(
                (
                  new Date(
                    attempt.endTime
                  ).getTime() -
                  now.getTime()
                ) / 1000
              )
            )
          : 0;

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

      const result =
        attempt.status ===
        "IN_PROGRESS"
          ? null
          : {
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
            };

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

        remainingSeconds,

        result,
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

/* =========================================================
   SAVE ANSWER
   PATCH /api/attempts/:attemptId/answer
========================================================= */

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

/* =========================================================
   TAB SWITCH
   PATCH /api/attempts/:attemptId/tab-switch
========================================================= */

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

      await attempt.save();

      return res.status(200).json({
        message:
          "Tab switch recorded",

        tabSwitchCount:
          attempt.tabSwitchCount,
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

/* =========================================================
   SUBMIT ATTEMPT
   POST /api/attempts/:attemptId/submit
========================================================= */

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

      const isExpired =
        now >=
        new Date(
          attempt.endTime
        );

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
          ? attempt.endTime
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

        result: {
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
        },
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

/* =========================================================
   GET STUDENT RESULT
   GET /api/attempts/:attemptId/result
========================================================= */

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

/* =========================================================
   INSTRUCTOR RESULTS
   GET /api/attempts/exam/:examId/results
========================================================= */

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
        if (
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

/* =========================================================
   INSTRUCTOR ATTEMPTS FALLBACK
   GET /api/attempts/exam/:examId
========================================================= */

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

/* =========================================================
   INSTRUCTOR ATTEMPT DETAILS
   GET /api/attempts/instructor/:attemptId
========================================================= */

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
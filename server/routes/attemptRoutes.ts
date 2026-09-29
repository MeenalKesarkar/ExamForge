import { Router, Response } from "express";
import mongoose from "mongoose";

import Attempt from "../models/Attempt";
import Exam from "../models/Exam";
import Question from "../models/Question";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = Router();

/* =========================================================
   TYPES
========================================================= */

type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EVALUATED"
  | "TIMED_OUT";

interface StoredAnswers {
  [questionId: string]: string[];
}

/* =========================================================
   BASIC HELPERS
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
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter(Boolean);
};

/* =========================================================
   SAFE DATE HELPER
========================================================= */

const getDate = (
  value: Date | string | null | undefined
): Date | null => {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/* =========================================================
   ANSWER STORAGE
========================================================= */

const getStoredAnswers = (
  attempt: any
): StoredAnswers => {
  if (
    !attempt.answers ||
    typeof attempt.answers !== "object" ||
    Array.isArray(attempt.answers)
  ) {
    return {};
  }

  return attempt.answers as StoredAnswers;
};

/* =========================================================
   EXACT ANSWER SET COMPARISON
========================================================= */

const areExactAnswerSets = (
  studentAnswers: string[],
  correctAnswers: string[]
): boolean => {
  if (
    studentAnswers.length !==
    correctAnswers.length
  ) {
    return false;
  }

  const studentSet =
    new Set(studentAnswers);

  const correctSet =
    new Set(correctAnswers);

  if (
    studentSet.size !==
    correctSet.size
  ) {
    return false;
  }

  for (const answer of correctSet) {
    if (!studentSet.has(answer)) {
      return false;
    }
  }

  return true;
};

/* =========================================================
   SCORE CALCULATION
========================================================= */

const calculateScore = (
  questions: any[],
  answers: StoredAnswers,
  negativeMarking: boolean,
  negativePenalty: number
) => {
  let score = 0;

  let correctCount = 0;
  let incorrectCount = 0;
  let answeredCount = 0;
  let unansweredCount = 0;

  const questionResults =
    questions.map((question) => {
      const questionId =
        question._id.toString();

      const studentAnswer =
        normalizeAnswers(
          answers[questionId]
        );

      const correctAnswers =
        normalizeAnswers(
          question.correctAnswers
        );

      const isAnswered =
        studentAnswer.length > 0;

      if (!isAnswered) {
        unansweredCount += 1;

        return {
          questionId,
          answered: false,
          correct: false,
          marks: 0,
        };
      }

      answeredCount += 1;

      const isCorrect =
        areExactAnswerSets(
          studentAnswer,
          correctAnswers
        );

      if (isCorrect) {
        correctCount += 1;

        const marks = Number(
          question.marks || 0
        );

        score += marks;

        return {
          questionId,
          answered: true,
          correct: true,
          marks,
        };
      }

      incorrectCount += 1;

      let marks = 0;

      if (negativeMarking) {
        marks =
          -Number(
            negativePenalty || 0
          );
      }

      score += marks;

      return {
        questionId,
        answered: true,
        correct: false,
        marks,
      };
    });

  /*
   * Score cannot go below zero.
   */
  score = Math.max(0, score);

  const totalMarks =
    questions.reduce(
      (total, question) =>
        total +
        Number(
          question.marks || 0
        ),
      0
    );

  const percentage =
    totalMarks > 0
      ? Number(
          (
            (score / totalMarks) *
            100
          ).toFixed(2)
        )
      : 0;

  return {
    score,
    totalMarks,
    percentage,
    correctCount,
    incorrectCount,
    answeredCount,
    unansweredCount,
    questionResults,
  };
};

/* =========================================================
   GET QUESTIONS BELONGING TO ATTEMPT
========================================================= */

const getAttemptQuestions =
  async (attempt: any) => {
    const questionIds =
      Array.isArray(
        attempt.questionIds
      )
        ? attempt.questionIds
        : [];

    if (questionIds.length === 0) {
      return [];
    }

    const questions =
      await Question.find({
        _id: {
          $in: questionIds,
        },
      }).lean();

    /*
     * Preserve the exact order stored
     * inside the Attempt.
     */
    const questionMap =
      new Map<string, any>();

    for (const question of questions) {
      questionMap.set(
        question._id.toString(),
        question
      );
    }

    return questionIds
      .map((questionId: any) =>
        questionMap.get(
          questionId.toString()
        )
      )
      .filter(Boolean);
  };

/* =========================================================
   REMOVE ANSWER KEY FROM STUDENT RESPONSE
========================================================= */

const sanitizeQuestionForStudent = (
  question: any
) => {
  return {
    _id: question._id,
    examId: question.examId,
    questionText:
      question.questionText,
    type: question.type,
    options: question.options,
    marks: question.marks,
    explanation:
      question.explanation,
    difficulty:
      question.difficulty,
    order: question.order,
  };
};

/* =========================================================
   GET ATTEMPT AND VERIFY OWNERSHIP
========================================================= */

const getOwnedAttempt =
  async (
    attemptId: string,
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!isValidObjectId(attemptId)) {
      res.status(400).json({
        message:
          "Invalid attempt ID",
      });

      return null;
    }

    if (!req.user?.userId) {
      res.status(401).json({
        message:
          "Authentication required",
      });

      return null;
    }

    const attempt =
      await Attempt.findById(
        attemptId
      );

    if (!attempt) {
      res.status(404).json({
        message:
          "Attempt not found",
      });

      return null;
    }

    /*
     * Student can access only their own attempt.
     */
    if (
      req.user.role === "student" &&
      attempt.studentId.toString() !==
        req.user.userId
    ) {
      res.status(403).json({
        message:
          "You are not allowed to access this attempt",
      });

      return null;
    }

    return attempt;
  };

/* =========================================================
   SCORE + CLOSE EXPIRED ATTEMPT
========================================================= */

const closeExpiredAttempt =
  async (
    attempt: any,
    exam: any
  ): Promise<boolean> => {
    if (
      attempt.status !==
      "IN_PROGRESS"
    ) {
      return false;
    }

    const now = new Date();

    const endTime = getDate(
      attempt.endTime
    );

    /*
     * If no valid end time exists, do not
     * automatically close the attempt.
     */
    if (!endTime) {
      return false;
    }

    if (now < endTime) {
      return false;
    }

    const questions =
      await getAttemptQuestions(
        attempt
      );

    const answers =
      getStoredAnswers(
        attempt
      );

    const result =
      calculateScore(
        questions,
        answers,
        Boolean(
          exam.negativeMarking
        ),
        Number(
          exam.negativePenalty || 0
        )
      );

    /*
     * Only save fields that actually exist
     * in the Attempt model.
     */
    attempt.score =
      result.score;

    attempt.totalMarks =
      result.totalMarks;

    attempt.percentage =
      result.percentage;

    attempt.passed =
      result.score >=
      Number(
        exam.passingMarks || 0
      );

    attempt.submittedAt = now;

    attempt.status =
      "TIMED_OUT";

    await attempt.save();

    return true;
  };

/* =========================================================
   BUILD RESULT
========================================================= */

const buildAttemptResult =
  async (
    attempt: any,
    exam: any
  ) => {
    const questions =
      await getAttemptQuestions(
        attempt
      );

    const answers =
      getStoredAnswers(
        attempt
      );

    const result =
      calculateScore(
        questions,
        answers,
        Boolean(
          exam.negativeMarking
        ),
        Number(
          exam.negativePenalty || 0
        )
      );

    return {
      score:
        result.score,

      totalMarks:
        result.totalMarks,

      percentage:
        result.percentage,

      passed:
        result.score >=
        Number(
          exam.passingMarks || 0
        ),

      passingMarks:
        Number(
          exam.passingMarks || 0
        ),

      correctCount:
        result.correctCount,

      incorrectCount:
        result.incorrectCount,

      unansweredCount:
        result.unansweredCount,

      answeredCount:
        result.answeredCount,

      questionResults:
        result.questionResults,
    };
  };

/* =========================================================
   GET ATTEMPT
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
      const attemptId = getParam(
        req.params.attemptId
      );

      const attempt =
        await getOwnedAttempt(
          attemptId,
          req,
          res
        );

      if (!attempt) {
        return;
      }

      const exam =
        await Exam.findById(
          attempt.examId
        ).lean();

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam associated with this attempt was not found",
        });
      }

      /*
       * If the server deadline has passed,
       * automatically close and score it.
       */
      await closeExpiredAttempt(
        attempt,
        exam
      );

      const currentAttempt =
        await Attempt.findById(
          attempt._id
        );

      if (!currentAttempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
        });
      }

      const questions =
        await getAttemptQuestions(
          currentAttempt
        );

      const safeQuestions =
        questions.map(
          sanitizeQuestionForStudent
        );

      const answers =
        getStoredAnswers(
          currentAttempt
        );

      const serverNow =
        new Date();

      /* -----------------------------------------------------
         COMPLETED ATTEMPT
      ----------------------------------------------------- */

      if (
        currentAttempt.status !==
        "IN_PROGRESS"
      ) {
        const result =
          await buildAttemptResult(
            currentAttempt,
            exam
          );

        return res.status(200).json({
          attempt: {
            _id:
              currentAttempt._id,

            examId:
              currentAttempt.examId,

            studentId:
              currentAttempt.studentId,

            questionIds:
              currentAttempt.questionIds,

            answers,

            startTime:
              currentAttempt.startTime,

            endTime:
              currentAttempt.endTime,

            submittedAt:
              currentAttempt.submittedAt,

            status:
              currentAttempt.status,

            score:
              currentAttempt.score,

            totalMarks:
              currentAttempt.totalMarks,

            percentage:
              currentAttempt.percentage,

            passed:
              currentAttempt.passed,
          },

          exam: {
            _id: exam._id,
            title: exam.title,
            subject: exam.subject,
            duration:
              exam.duration,

            totalMarks:
              exam.totalMarks,

            passingMarks:
              exam.passingMarks,

            negativeMarking:
              exam.negativeMarking,

            negativePenalty:
              exam.negativePenalty,
          },

          questions:
            safeQuestions,

          serverNow,

          result,
        });
      }

      /* -----------------------------------------------------
         ACTIVE ATTEMPT
      ----------------------------------------------------- */

      const endTime = getDate(
        currentAttempt.endTime
      );

      /*
       * A valid end time should always exist for
       * an active attempt.
       */
      if (!endTime) {
        return res.status(500).json({
          message:
            "This attempt does not have a valid end time",
        });
      }

      const remainingSeconds =
        Math.max(
          0,
          Math.floor(
            (
              endTime.getTime() -
              serverNow.getTime()
            ) / 1000
          )
        );

      /*
       * Extra protection:
       * if it reached zero between the first
       * expiry check and this response, close it.
       */
      if (remainingSeconds <= 0) {
        await closeExpiredAttempt(
          currentAttempt,
          exam
        );

        const expiredAttempt =
          await Attempt.findById(
            currentAttempt._id
          );

        if (!expiredAttempt) {
          return res.status(404).json({
            message:
              "Attempt not found",
          });
        }

        const result =
          await buildAttemptResult(
            expiredAttempt,
            exam
          );

        return res.status(200).json({
          attempt: {
            _id:
              expiredAttempt._id,

            examId:
              expiredAttempt.examId,

            studentId:
              expiredAttempt.studentId,

            questionIds:
              expiredAttempt.questionIds,

            answers:
              getStoredAnswers(
                expiredAttempt
              ),

            startTime:
              expiredAttempt.startTime,

            endTime:
              expiredAttempt.endTime,

            submittedAt:
              expiredAttempt.submittedAt,

            status:
              expiredAttempt.status,

            score:
              expiredAttempt.score,

            totalMarks:
              expiredAttempt.totalMarks,

            percentage:
              expiredAttempt.percentage,

            passed:
              expiredAttempt.passed,
          },

          exam: {
            _id: exam._id,
            title: exam.title,
            subject: exam.subject,
            duration:
              exam.duration,
            totalMarks:
              exam.totalMarks,
            passingMarks:
              exam.passingMarks,
            negativeMarking:
              exam.negativeMarking,
            negativePenalty:
              exam.negativePenalty,
          },

          questions:
            safeQuestions,

          serverNow,

          result,
        });
      }

      return res.status(200).json({
        attempt: {
          _id:
            currentAttempt._id,

          examId:
            currentAttempt.examId,

          studentId:
            currentAttempt.studentId,

          questionIds:
            currentAttempt.questionIds,

          answers,

          startTime:
            currentAttempt.startTime,

          endTime:
            currentAttempt.endTime,

          status:
            currentAttempt.status,

          tabSwitchCount:
            currentAttempt.tabSwitchCount ||
            0,
        },

        exam: {
          _id: exam._id,
          title: exam.title,
          subject: exam.subject,
          duration:
            exam.duration,

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
          safeQuestions,

        serverNow,

        remainingSeconds,
      });
    } catch (error) {
      console.error(
        "GET /api/attempts/:attemptId error:",
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
      if (
        req.user?.role !==
        "student"
      ) {
        return res.status(403).json({
          message:
            "Only students can save answers",
        });
      }

      const attemptId = getParam(
        req.params.attemptId
      );

      const attempt =
        await getOwnedAttempt(
          attemptId,
          req,
          res
        );

      if (!attempt) {
        return;
      }

      const exam =
        await Exam.findById(
          attempt.examId
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam associated with this attempt was not found",
        });
      }

      /*
       * Check server-side expiry first.
       */
      const wasExpired =
        await closeExpiredAttempt(
          attempt,
          exam
        );

      if (
        wasExpired ||
        attempt.status !==
          "IN_PROGRESS"
      ) {
        const currentAttempt =
          await Attempt.findById(
            attempt._id
          );

        return res.status(409).json({
          message:
            "This exam attempt is no longer active",

          status:
            currentAttempt?.status ||
            attempt.status,
        });
      }

      const questionId =
        typeof req.body.questionId ===
        "string"
          ? req.body.questionId.trim()
          : "";

      if (
        !questionId ||
        !isValidObjectId(questionId)
      ) {
        return res.status(400).json({
          message:
            "Valid question ID is required",
        });
      }

      const selectedAnswers =
        normalizeAnswers(
          req.body.selectedAnswers
        );

      /*
       * Verify that this question belongs
       * to the student's fixed question set.
       */
      const assignedQuestion =
        attempt.questionIds.some(
          (
            id: mongoose.Types.ObjectId
          ) =>
            id.toString() ===
            questionId
        );

      if (!assignedQuestion) {
        return res.status(403).json({
          message:
            "This question is not part of your exam attempt",
        });
      }

      const question =
        await Question.findById(
          questionId
        ).lean();

      if (!question) {
        return res.status(404).json({
          message:
            "Question not found",
        });
      }

      /*
       * Validate selected options.
       */
      const validOptions =
        new Set(
          question.options
        );

      const invalidAnswer =
        selectedAnswers.some(
          (answer) =>
            !validOptions.has(answer)
        );

      if (invalidAnswer) {
        return res.status(400).json({
          message:
            "One or more selected answers are invalid",
        });
      }

      /*
       * Single-choice questions can have
       * only one selected answer.
       */
      if (
        question.type ===
          "single" &&
        selectedAnswers.length > 1
      ) {
        return res.status(400).json({
          message:
            "This question accepts only one answer",
        });
      }

      /*
       * Save progressively.
       */
      const currentAnswers =
        getStoredAnswers(
          attempt
        );

      currentAnswers[questionId] =
        selectedAnswers;

      attempt.answers =
        currentAnswers;

      /*
       * Important because answers is Mixed.
       */
      attempt.markModified(
        "answers"
      );

      await attempt.save();

      return res.status(200).json({
        message:
          "Answer saved successfully",

        questionId,

        selectedAnswers,
      });
    } catch (error) {
      console.error(
        "PATCH /api/attempts/:attemptId/answer error:",
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
      if (
        req.user?.role !==
        "student"
      ) {
        return res.status(403).json({
          message:
            "Only students can update this value",
        });
      }

      const attemptId = getParam(
        req.params.attemptId
      );

      const attempt =
        await getOwnedAttempt(
          attemptId,
          req,
          res
        );

      if (!attempt) {
        return;
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

      const wasExpired =
        await closeExpiredAttempt(
          attempt,
          exam
        );

      if (
        wasExpired ||
        attempt.status !==
          "IN_PROGRESS"
      ) {
        return res.status(409).json({
          message:
            "This exam attempt is no longer active",
        });
      }

      attempt.tabSwitchCount =
        Number(
          attempt.tabSwitchCount || 0
        ) + 1;

      await attempt.save();

      return res.status(200).json({
        message:
          "Tab switch recorded",

        tabSwitchCount:
          attempt.tabSwitchCount,
      });
    } catch (error) {
      console.error(
        "PATCH /api/attempts/:attemptId/tab-switch error:",
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
      if (
        req.user?.role !==
        "student"
      ) {
        return res.status(403).json({
          message:
            "Only students can submit exams",
        });
      }

      const attemptId = getParam(
        req.params.attemptId
      );

      const attempt =
        await getOwnedAttempt(
          attemptId,
          req,
          res
        );

      if (!attempt) {
        return;
      }

      const exam =
        await Exam.findById(
          attempt.examId
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam associated with this attempt was not found",
        });
      }

      /*
       * If already completed, simply return
       * the existing result.
       */
      if (
        attempt.status !==
        "IN_PROGRESS"
      ) {
        const result =
          await buildAttemptResult(
            attempt,
            exam
          );

        return res.status(200).json({
          message:
            "This attempt has already been completed",

          attempt: {
            _id:
              attempt._id,

            status:
              attempt.status,

            submittedAt:
              attempt.submittedAt,
          },

          result,
        });
      }

      const now =
        new Date();

      const endTime =
        getDate(
          attempt.endTime
        );

      /*
       * If endTime is missing, we cannot
       * safely determine whether the exam expired.
       */
      if (!endTime) {
        return res.status(500).json({
          message:
            "This attempt does not have a valid end time",
        });
      }

      const expired =
        now.getTime() >=
        endTime.getTime();

      const questions =
        await getAttemptQuestions(
          attempt
        );

      const answers =
        getStoredAnswers(
          attempt
        );

      /*
       * Backend-only scoring.
       */
      const result =
        calculateScore(
          questions,
          answers,
          Boolean(
            exam.negativeMarking
          ),
          Number(
            exam.negativePenalty || 0
          )
        );

      /*
       * Save only fields supported by
       * the Attempt model.
       */
      attempt.score =
        result.score;

      attempt.totalMarks =
        result.totalMarks;

      attempt.percentage =
        result.percentage;

      attempt.passed =
        result.score >=
        Number(
          exam.passingMarks || 0
        );

      attempt.submittedAt =
        now;

      attempt.status = expired
        ? "TIMED_OUT"
        : "SUBMITTED";

      await attempt.save();

      return res.status(200).json({
        message: expired
          ? "Time expired. Your exam has been submitted automatically."
          : "Exam submitted successfully.",

        attempt: {
          _id:
            attempt._id,

          status:
            attempt.status,

          submittedAt:
            attempt.submittedAt,
        },

        result,
      });
    } catch (error) {
      console.error(
        "POST /api/attempts/:attemptId/submit error:",
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
   GET RESULT
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
      const attemptId = getParam(
        req.params.attemptId
      );

      const attempt =
        await getOwnedAttempt(
          attemptId,
          req,
          res
        );

      if (!attempt) {
        return;
      }

      const exam =
        await Exam.findById(
          attempt.examId
        ).lean();

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      /*
       * Automatically close an expired
       * attempt before returning the result.
       */
      await closeExpiredAttempt(
        attempt,
        exam
      );

      const currentAttempt =
        await Attempt.findById(
          attempt._id
        );

      if (!currentAttempt) {
        return res.status(404).json({
          message:
            "Attempt not found",
        });
      }

      if (
        currentAttempt.status ===
        "IN_PROGRESS"
      ) {
        return res.status(409).json({
          message:
            "Exam attempt has not been submitted yet",
        });
      }

      const result =
        await buildAttemptResult(
          currentAttempt,
          exam
        );

      return res.status(200).json({
        attempt: {
          _id:
            currentAttempt._id,

          examId:
            currentAttempt.examId,

          status:
            currentAttempt.status,

          startTime:
            currentAttempt.startTime,

          endTime:
            currentAttempt.endTime,

          submittedAt:
            currentAttempt.submittedAt,
        },

        exam: {
          _id: exam._id,

          title:
            exam.title,

          subject:
            exam.subject,

          totalMarks:
            exam.totalMarks,

          passingMarks:
            exam.passingMarks,
        },

        result,
      });
    } catch (error) {
      console.error(
        "GET /api/attempts/:attemptId/result error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load exam result",
      });
    }
  }
);

export default router;
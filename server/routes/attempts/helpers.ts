import { Response } from "express";
import mongoose from "mongoose";

import Attempt, {
  IAttempt,
} from "../../models/Attempt";

import Exam from "../../models/Exam";

import Question, {
  IQuestion,
} from "../../models/Question";
import { advanceAttemptTimer } from "../../attemptTimer";
import { archiveCompletedOutdatedAttempt } from "../exams/versioning";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../../middleware/authMiddleware";

export const MAX_PROCTORING_FOCUS_LOSSES = 3;

/* =========================================================
   TYPES
========================================================= */

export type AnswerMap = Record<string, string[]>;

export interface ScoreResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  answeredCount: number;
  passingMarks: number;
}

/* =========================================================
   HELPERS
========================================================= */

export const isValidObjectId = (
  value: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(value);
};

export const getParam = (
  value: string | string[] | undefined
): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export const normalizeAnswers = (
  answers: unknown
): string[] => {
  if (!Array.isArray(answers)) {
    return [];
  }

  return answers
    .map((answer: unknown) => String(answer))
    .filter((answer: string) => answer.length > 0);
};

export const sameAnswerSet = (
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

export const calculateScore = async (
  attempt: IAttempt,
  exam: any
): Promise<ScoreResult> => {
  const questions: Array<Pick<IQuestion, "_id" | "correctAnswers" | "marks">> =
    attempt.questionSnapshots?.length
      ? attempt.questionSnapshots
      : await Question.find({ _id: { $in: attempt.questionIds } });

  const scoringExam = attempt.examSnapshot
    ? { ...exam, ...attempt.examSnapshot }
    : exam;

  let rawScore = 0;
  let rawTotalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const answers =
    (attempt.answers || {}) as AnswerMap;

  for (const question of questions) {
    const questionMarks = Math.max(0, Number(question.marks || 0));
    rawTotalMarks += questionMarks;
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

      rawScore += questionMarks;
    } else {
      incorrectCount += 1;

    }
  }

  const totalMarks =
    typeof scoringExam.totalMarks === "number"
      ? scoringExam.totalMarks
      : questions.reduce(
          (
            total: number,
            question: Pick<IQuestion, "marks">
          ) =>
            total +
            Number(
              question.marks || 0
            ),
          0
        );

  // Question marks define the relative weight of questions in the selected
  // set. Scale the raw points to the exam's configured score so a bank whose
  // raw marks add up to (for example) 10 can still correctly produce a /25
  // exam result. Apply the configured negative penalty in exam-score points.
  const scaledScore = rawTotalMarks > 0
    ? (rawScore / rawTotalMarks) * totalMarks
    : 0;
  const negativePenalty = scoringExam.negativeMarking
    ? Number(scoringExam.negativePenalty || 0) * incorrectCount
    : 0;
  const score = Number(Math.max(0, scaledScore - negativePenalty).toFixed(2));

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
    Number(scoringExam.passingMarks || 0);

  const answeredCount =
    correctCount + incorrectCount;

  const passingMarks =
    Number(scoringExam.passingMarks || 0);

  return {
    score,
    totalMarks,
    percentage,
    passed,
    correctCount,
    incorrectCount,
    unansweredCount,
    answeredCount,
    passingMarks,
  };
};

/* =========================================================
   EFFECTIVE END TIME
========================================================= */

export const getVersionedAttemptExam = (attempt: IAttempt, exam: any) =>
  attempt.examSnapshot ? { ...exam, ...attempt.examSnapshot } : exam;

export const getEffectiveEndTime = (
  attempt: IAttempt,
  exam: any
): Date => {
  const attemptExam = getVersionedAttemptExam(attempt, exam);
  const storedEndTime = new Date(attempt.endTime);
  const attemptEndTime = Number.isFinite(storedEndTime.getTime())
    ? storedEndTime
    : new Date(new Date(attempt.startTime).getTime() + Number(attemptExam.duration) * 60_000);

  if (attemptExam.endDate) {
    const examEndTime = new Date(
      attemptExam.endDate
    );

    if (
      examEndTime.getTime() <
      attemptEndTime.getTime()
    ) {
      return examEndTime;
    }
  }

  return attemptEndTime;
};

export const areResultsAvailable = (
  exam: any,
  now = new Date()
): boolean => {
  if (exam.resultsHidden || !exam.endDate) {
    return false;
  }

  return (
    now.getTime() >=
    new Date(exam.endDate).getTime()
  );
};

export const getResultsUnavailableMessage = (
  exam: any,
  now = new Date()
): string | null => {
  if (exam.resultsHidden) {
    return "Your instructor has hidden the results for this exam.";
  }
  if (!exam.endDate) {
    return "Results are not available because this exam has no release deadline.";
  }
  if (now.getTime() < new Date(exam.endDate).getTime()) {
    return "Results will be available after the exam deadline.";
  }
  return null;
};

/* =========================================================
   CLOSE EXPIRED ATTEMPT
========================================================= */

export const closeExpiredAttempt = async (
  attempt: IAttempt,
  exam: any
): Promise<boolean> => {
  if (attempt.status !== "IN_PROGRESS") {
    return false;
  }

  const attemptExam = getVersionedAttemptExam(attempt, exam);
  const timer = advanceAttemptTimer(attempt, attemptExam);
  if (!timer.expired) {
    await attempt.save();
    return false;
  }

  const result =
    await calculateScore(
      attempt,
      attemptExam
    );

  attempt.status = "TIMED_OUT";

  attempt.submittedAt = new Date();

  attempt.score =
    result.score;

  attempt.totalMarks =
    result.totalMarks;

  attempt.percentage =
    result.percentage;

  attempt.passed =
    result.passed;

  await archiveCompletedOutdatedAttempt(attempt, exam.version || 1);

  await attempt.save();

  return true;
};

/* =========================================================
   STUDENT OWNERSHIP
========================================================= */

export const requireStudentOwnership = (
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

  if (!canStudentAccessAttempt(req.user, studentId)) {
    res.status(403).json({
      message:
        req.user.role === "student"
          ? "You do not have access to this attempt"
          : "Student access required",
    });

    return false;
  }

  return true;
};

export const canStudentAccessAttempt = (
  user: AuthenticatedRequest["user"],
  attemptStudentId: string,
): boolean => user?.role === "student" && user.userId === attemptStudentId;

/* =========================================================
   INSTRUCTOR EXAM ACCESS
========================================================= */

export const requireInstructorExamAccess =
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
   STUDENT RESULTS LIST
   GET /api/attempts/student/results
========================================================= */

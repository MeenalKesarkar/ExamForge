import { Router, Response } from "express";
import mongoose from "mongoose";

import Question from "../models/Question";
import Exam from "../models/Exam";
import Attempt from "../models/Attempt";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = Router();

/* =========================================================
   Helpers
========================================================= */

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getExamId = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "_id" in value
  ) {
    const objectValue = value as {
      _id?: unknown;
    };

    if (typeof objectValue._id === "string") {
      return objectValue._id;
    }
  }

  return "";
};

const normalizeString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

const normalizeStringArray = (value: unknown): string[] => {
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

const isInstructor = (
  req: AuthenticatedRequest
): boolean => {
  return req.user?.role === "instructor";
};

/* =========================================================
   Check exam ownership
========================================================= */

const getOwnedExam = async (
  examId: string,
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!isValidObjectId(examId)) {
    res.status(400).json({
      message: "Invalid exam ID",
    });

    return null;
  }

  if (!req.user?.userId) {
    res.status(401).json({
      message: "Authentication required",
    });

    return null;
  }

  if (!isInstructor(req)) {
    res.status(403).json({
      message: "Instructor access required",
    });

    return null;
  }

  const exam = await Exam.findById(examId);

  if (!exam) {
    res.status(404).json({
      message: "Exam not found",
    });

    return null;
  }

  if (exam.createdBy.toString() !== req.user.userId) {
    res.status(403).json({
      message:
        "You do not have permission to manage this exam",
    });

    return null;
  }

  return exam;
};

/* =========================================================
   Validate question data
========================================================= */

const validateQuestionData = (body: any) => {
  const questionText = normalizeString(
    body.questionText
  );

  const type =
    body.type === "multi" ||
    body.type === "single"
      ? body.type
      : "";

  const options = normalizeStringArray(
    body.options
  );

  const correctAnswers = normalizeStringArray(
    body.correctAnswers
  );

  const explanation = normalizeString(
    body.explanation
  );

  const difficulty =
    body.difficulty === "easy" ||
    body.difficulty === "medium" ||
    body.difficulty === "hard"
      ? body.difficulty
      : "medium";

  const marks = Number(body.marks);

  const order =
    body.order === undefined ||
    body.order === null ||
    body.order === ""
      ? undefined
      : Number(body.order);

  const errors: string[] = [];

  if (!questionText) {
    errors.push("Question text is required");
  }

  if (questionText.length > 2000) {
    errors.push(
      "Question text cannot exceed 2000 characters"
    );
  }

  if (!type) {
    errors.push(
      "Question type must be single or multi"
    );
  }

  if (options.length < 2) {
    errors.push("At least 2 options are required");
  }

  if (options.length > 6) {
    errors.push(
      "A maximum of 6 options is allowed"
    );
  }

  if (new Set(options).size !== options.length) {
    errors.push("Options must be unique");
  }

  if (correctAnswers.length === 0) {
    errors.push(
      "At least one correct answer is required"
    );
  }

  if (
    type === "single" &&
    correctAnswers.length !== 1
  ) {
    errors.push(
      "A single-correct question must have exactly one correct answer"
    );
  }

  if (
    type === "multi" &&
    correctAnswers.length < 1
  ) {
    errors.push(
      "A multiple-correct question must have at least one correct answer"
    );
  }

  const invalidCorrectAnswer =
    correctAnswers.some(
      (answer) => !options.includes(answer)
    );

  if (invalidCorrectAnswer) {
    errors.push(
      "Every correct answer must match one of the provided options"
    );
  }

  if (!Number.isFinite(marks) || marks <= 0) {
    errors.push("Marks must be greater than 0");
  }

  if (marks > 100) {
    errors.push("Marks cannot exceed 100");
  }

  if (
    order !== undefined &&
    (!Number.isFinite(order) || order < 1)
  ) {
    errors.push(
      "Order must be a positive number"
    );
  }

  return {
    errors,
    data: {
      questionText,
      type,
      options,
      correctAnswers,
      marks,
      explanation,
      difficulty,
      order,
    },
  };
};

/* =========================================================
   GET QUESTIONS FOR AN EXAM
   GET /api/questions/exam/:examId
========================================================= */

router.get(
  "/exam/:examId",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      /*
       * Express can type params as string | string[].
       * Convert explicitly to string.
       */
      const examId = String(req.params.examId);

      if (!isValidObjectId(examId)) {
        return res.status(400).json({
          message: "Invalid exam ID",
        });
      }

      const exam = await Exam.findById(examId);

      if (!exam) {
        return res.status(404).json({
          message: "Exam not found",
        });
      }

      const userId = req.user?.userId;
      const role = req.user?.role;

      /*
       * Only instructors can access the complete
       * question bank.
       */
      if (role === "instructor") {
        if (!userId) {
          return res.status(401).json({
            message: "Authentication required",
          });
        }

        if (
          exam.createdBy.toString() !== userId
        ) {
          return res.status(403).json({
            message:
              "You do not have permission to view this question bank",
          });
        }

        const questions = await Question.find({
          examId,
        }).sort({
          order: 1,
          createdAt: 1,
        });

        return res.status(200).json({
          questions,
        });
      }

      /*
       * Students must never receive the complete
       * question bank from this endpoint.
       *
       * Their assigned questions are returned through
       * the Attempt endpoint.
       */
      return res.status(403).json({
        message:
          "Students cannot access the exam question bank directly",
      });
    } catch (error) {
      console.error(
        "GET /api/questions/exam/:examId error:",
        error
      );

      return res.status(500).json({
        message: "Failed to fetch questions",
      });
    }
  }
);

/* =========================================================
   CREATE QUESTION
   POST /api/questions
========================================================= */

router.post(
  "/",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!isInstructor(req)) {
        return res.status(403).json({
          message:
            "Only instructors can create questions",
        });
      }

      const examId = getExamId(
        req.body.examId
      );

      if (!examId) {
        return res.status(400).json({
          message: "Exam ID is required",
        });
      }

      const exam = await getOwnedExam(
        examId,
        req,
        res
      );

      if (!exam) {
        return;
      }

      const validation =
        validateQuestionData(req.body);

      if (validation.errors.length > 0) {
        return res.status(400).json({
          message: validation.errors[0],
          errors: validation.errors,
        });
      }

      const {
        questionText,
        type,
        options,
        correctAnswers,
        marks,
        explanation,
        difficulty,
        order,
      } = validation.data;

      /*
       * If order is not supplied, add the question
       * after the current last question.
       */
      let finalOrder = order;

      if (finalOrder === undefined) {
        const lastQuestion =
          await Question.findOne({
            examId: exam._id,
          }).sort({
            order: -1,
          });

        finalOrder = lastQuestion?.order
          ? Number(lastQuestion.order) + 1
          : 1;
      }

      /*
       * Avoid duplicate order numbers.
       */
      const existingOrder =
        await Question.findOne({
          examId: exam._id,
          order: finalOrder,
        });

      if (existingOrder) {
        finalOrder =
          (await Question.countDocuments({
            examId: exam._id,
          })) + 1;
      }

      const question =
        await Question.create({
          examId: exam._id,
          questionText,
          type,
          options,
          correctAnswers,
          marks,
          explanation,
          difficulty,
          order: finalOrder,
        });

      /*
       * Recalculate exam total marks.
       */
      const totalMarks =
        await Question.aggregate([
          {
            $match: {
              examId: exam._id,
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$marks",
              },
            },
          },
        ]);

      exam.totalMarks =
        totalMarks[0]?.total || 0;

      await exam.save();

      return res.status(201).json({
        message:
          "Question created successfully",
        question,
      });
    } catch (error) {
      console.error(
        "POST /api/questions error:",
        error
      );

      return res.status(500).json({
        message: "Failed to create question",
      });
    }
  }
);

/* =========================================================
   UPDATE QUESTION
   PUT /api/questions/:questionId
========================================================= */

router.put(
  "/:questionId",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!isInstructor(req)) {
        return res.status(403).json({
          message:
            "Only instructors can update questions",
        });
      }

      /*
       * Explicit String() fixes:
       * string | string[] -> string
       */
      const questionId = String(
        req.params.questionId
      );

      if (!isValidObjectId(questionId)) {
        return res.status(400).json({
          message: "Invalid question ID",
        });
      }

      const question =
        await Question.findById(questionId);

      if (!question) {
        return res.status(404).json({
          message: "Question not found",
        });
      }

      const examId = getExamId(
        question.examId
      );

      const exam = await getOwnedExam(
        examId,
        req,
        res
      );

      if (!exam) {
        return;
      }

      const validation =
        validateQuestionData(req.body);

      if (validation.errors.length > 0) {
        return res.status(400).json({
          message: validation.errors[0],
          errors: validation.errors,
        });
      }

      const {
        questionText,
        type,
        options,
        correctAnswers,
        marks,
        explanation,
        difficulty,
        order,
      } = validation.data;

      question.questionText =
        questionText;

      question.type =
        type as "single" | "multi";

      question.options = options;

      question.correctAnswers =
        correctAnswers;

      question.marks = marks;

      question.explanation =
        explanation;

      question.difficulty =
        difficulty;

      if (order !== undefined) {
        question.order = order;
      }

      await question.save();

      /*
       * Recalculate exam total marks after
       * editing the question.
       */
      const totalMarks =
        await Question.aggregate([
          {
            $match: {
              examId: exam._id,
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$marks",
              },
            },
          },
        ]);

      exam.totalMarks =
        totalMarks[0]?.total || 0;

      await exam.save();

      return res.status(200).json({
        message:
          "Question updated successfully",
        question,
      });
    } catch (error) {
      console.error(
        "PUT /api/questions/:questionId error:",
        error
      );

      return res.status(500).json({
        message: "Failed to update question",
      });
    }
  }
);

/* =========================================================
   DELETE QUESTION
   DELETE /api/questions/:questionId
========================================================= */

router.delete(
  "/:questionId",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!isInstructor(req)) {
        return res.status(403).json({
          message:
            "Only instructors can delete questions",
        });
      }

      /*
       * Explicit String() fixes:
       * string | string[] -> string
       */
      const questionId = String(
        req.params.questionId
      );

      if (!isValidObjectId(questionId)) {
        return res.status(400).json({
          message: "Invalid question ID",
        });
      }

      const question =
        await Question.findById(questionId);

      if (!question) {
        return res.status(404).json({
          message: "Question not found",
        });
      }

      const examId = getExamId(
        question.examId
      );

      const exam = await getOwnedExam(
        examId,
        req,
        res
      );

      if (!exam) {
        return;
      }

      /*
       * Do not delete questions after students
       * have already attempted the exam.
       *
       * This protects historical attempts because
       * their questionIds refer to these questions.
       */
      const attemptCount =
        await Attempt.countDocuments({
          examId: exam._id,
        });

      if (attemptCount > 0) {
        return res.status(409).json({
          message:
            "This question cannot be deleted because students have already attempted this exam.",
        });
      }

      await Question.findByIdAndDelete(
        questionId
      );

      /*
       * Re-number remaining questions.
       */
      const remainingQuestions =
        await Question.find({
          examId: exam._id,
        }).sort({
          order: 1,
          createdAt: 1,
        });

      for (
        let index = 0;
        index < remainingQuestions.length;
        index++
      ) {
        remainingQuestions[index].order =
          index + 1;

        await remainingQuestions[index].save();
      }

      /*
       * Recalculate exam total marks.
       */
      const totalMarks =
        await Question.aggregate([
          {
            $match: {
              examId: exam._id,
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$marks",
              },
            },
          },
        ]);

      exam.totalMarks =
        totalMarks[0]?.total || 0;

      await exam.save();

      return res.status(200).json({
        message:
          "Question deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE /api/questions/:questionId error:",
        error
      );

      return res.status(500).json({
        message: "Failed to delete question",
      });
    }
  }
);

export default router;
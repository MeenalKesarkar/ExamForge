import { Response, Router } from "express";
import mongoose from "mongoose";

import Question from "../models/Question";
import Exam from "../models/Exam";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = Router();

interface QuestionBody {
  questionText?: string;
  type?: "single" | "multi";
  options?: string[];
  correctAnswers?: string[];
  marks?: number | string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  order?: number | string;
}

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const isValidObjectId = (value: string): boolean =>
  mongoose.Types.ObjectId.isValid(value);

const cleanStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeDuplicateValue = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const getQuestionDuplicateKey = (
  questionText: string,
  options: string[]
): string => {
  const normalizedQuestion = normalizeDuplicateValue(questionText);
  const normalizedOptions = options
    .map((option) => normalizeDuplicateValue(option))
    .sort();

  return `${normalizedQuestion}::${normalizedOptions.join("|")}`;
};

const getQuestionBody = (body: QuestionBody) => {
  const questionText =
    typeof body.questionText === "string" ? body.questionText.trim() : "";

  const type = body.type === "multi" ? "multi" : "single";
  const options = cleanStringArray(body.options);
  const correctAnswers = cleanStringArray(body.correctAnswers);

  const marks =
    body.marks !== undefined && body.marks !== null && body.marks !== ""
      ? Number(body.marks)
      : 1;

  const explanation =
    typeof body.explanation === "string" ? body.explanation.trim() : "";

  const difficulty =
    body.difficulty === "easy" || body.difficulty === "hard"
      ? body.difficulty
      : "medium";

  const order =
    body.order !== undefined && body.order !== null && body.order !== ""
      ? Number(body.order)
      : 1;

  return {
    questionText,
    type,
    options,
    correctAnswers,
    marks,
    explanation,
    difficulty,
    order,
  };
};

const getInstructorExam = async (
  examId: string,
  req: AuthenticatedRequest,
  res: Response
) => {
  if (req.user?.role !== "instructor") {
    res.status(403).json({ message: "Instructor access required" });
    return null;
  }

  if (!req.user.userId || !isValidObjectId(req.user.userId)) {
    res.status(401).json({ message: "Invalid instructor authentication" });
    return null;
  }

  const exam = await Exam.findById(examId);

  if (!exam) {
    res.status(404).json({ message: "Exam not found" });
    return null;
  }

  if (exam.createdBy.toString() !== req.user.userId) {
    res.status(403).json({
      message: "You are not allowed to manage questions for this exam",
    });
    return null;
  }

  return exam;
};

const validateQuestionData = (
  data: ReturnType<typeof getQuestionBody>
): string | null => {
  if (!data.questionText) return "Question text is required";
  if (data.questionText.length > 2000) {
    return "Question text cannot exceed 2000 characters";
  }

  if (data.options.length < 2 || data.options.length > 10) {
    return "A question must have between 2 and 10 options";
  }

  const uniqueOptions = new Set(
    data.options.map((option) => option.toLowerCase())
  );

  if (uniqueOptions.size !== data.options.length) {
    return "Question options must be unique";
  }

  if (data.correctAnswers.length === 0) {
    return "At least one correct answer is required";
  }

  const optionSet = new Set(data.options);
  const invalidCorrectAnswer = data.correctAnswers.some(
    (answer) => !optionSet.has(answer)
  );

  if (invalidCorrectAnswer) {
    return "Every correct answer must be one of the question options";
  }

  if (data.type === "single" && data.correctAnswers.length !== 1) {
    return "A single-choice question must have exactly one correct answer";
  }

  if (data.type === "multi" && data.correctAnswers.length < 2) {
    return "A multi-select question must have at least two correct answers";
  }

  if (!Number.isFinite(data.marks) || data.marks <= 0) {
    return "Marks must be greater than 0";
  }

  if (!Number.isInteger(data.order) || data.order < 1) {
    return "Order must be a positive whole number";
  }

  if (data.explanation.length > 2000) {
    return "Explanation cannot exceed 2000 characters";
  }

  return null;
};

router.get(
  "/exam/:examId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const examId = getParam(req.params.examId);

      if (!isValidObjectId(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }

      const exam = await getInstructorExam(examId, req, res);
      if (!exam) return;

      const questions = await Question.find({
        examId: new mongoose.Types.ObjectId(examId),
      })
        .sort({ order: 1, createdAt: 1 })
        .lean();

      return res.status(200).json({ questions });
    } catch (error) {
      console.error("GET /api/questions/exam/:examId error:", error);
      return res.status(500).json({ message: "Failed to load question bank" });
    }
  }
);

router.post(
  "/",
  requireAuth,
  async (
    req: AuthenticatedRequest & {
      body: QuestionBody & { examId?: string };
    },
    res: Response
  ) => {
    try {
      if (req.user?.role !== "instructor") {
        return res.status(403).json({ message: "Instructor access required" });
      }

      const examId =
        typeof req.body.examId === "string" ? req.body.examId.trim() : "";

      if (!examId || !isValidObjectId(examId)) {
        return res.status(400).json({ message: "Valid exam ID is required" });
      }

      const exam = await getInstructorExam(examId, req, res);
      if (!exam) return;

      const data = getQuestionBody(req.body);
      const validationError = validateQuestionData(data);

      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const duplicateKey = getQuestionDuplicateKey(
        data.questionText,
        data.options
      );

      const existingQuestions = await Question.find({
        examId: new mongoose.Types.ObjectId(examId),
      })
        .select("questionText options")
        .lean();

      const duplicateQuestion = existingQuestions.find(
        (existing) =>
          getQuestionDuplicateKey(existing.questionText, existing.options) ===
          duplicateKey
      );

      if (duplicateQuestion) {
        return res.status(409).json({
          message:
            "This question with the same options already exists in this question bank.",
        });
      }

      const existingOrder = await Question.findOne({
        examId: new mongoose.Types.ObjectId(examId),
        order: data.order,
      }).lean();

      if (existingOrder) {
        return res.status(409).json({
          message: `Question order ${data.order} is already being used`,
        });
      }

      const question = await Question.create({
        examId: new mongoose.Types.ObjectId(examId),
        questionText: data.questionText,
        type: data.type,
        options: data.options,
        correctAnswers: data.correctAnswers,
        marks: data.marks,
        explanation: data.explanation,
        difficulty: data.difficulty,
        order: data.order,
      });

      return res.status(201).json({
        message: "Question created successfully",
        question,
      });
    } catch (error) {
      console.error("POST /api/questions error:", error);
      return res.status(500).json({ message: "Failed to create question" });
    }
  }
);

router.put(
  "/:questionId",
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: QuestionBody },
    res: Response
  ) => {
    try {
      if (req.user?.role !== "instructor") {
        return res.status(403).json({ message: "Instructor access required" });
      }

      const questionId = getParam(req.params.questionId);

      if (!isValidObjectId(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const question = await Question.findById(questionId);

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const exam = await getInstructorExam(
        question.examId.toString(),
        req,
        res
      );

      if (!exam) return;

      const data = getQuestionBody(req.body);
      const validationError = validateQuestionData(data);

      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const duplicateKey = getQuestionDuplicateKey(
        data.questionText,
        data.options
      );

      const existingQuestions = await Question.find({
        examId: question.examId,
        _id: { $ne: question._id },
      })
        .select("questionText options")
        .lean();

      const duplicateQuestion = existingQuestions.find(
        (existing) =>
          getQuestionDuplicateKey(existing.questionText, existing.options) ===
          duplicateKey
      );

      if (duplicateQuestion) {
        return res.status(409).json({
          message:
            "This question with the same options already exists in this question bank.",
        });
      }

      const duplicateOrder = await Question.findOne({
        examId: question.examId,
        order: data.order,
        _id: { $ne: question._id },
      }).lean();

      if (duplicateOrder) {
        return res.status(409).json({
          message: `Question order ${data.order} is already being used`,
        });
      }

      question.questionText = data.questionText;
      question.type = data.type;
      question.options = data.options;
      question.correctAnswers = data.correctAnswers;
      question.marks = data.marks;
      question.explanation = data.explanation;
      question.difficulty = data.difficulty;
      question.order = data.order;

      await question.save();

      return res.status(200).json({
        message: "Question updated successfully",
        question,
      });
    } catch (error) {
      console.error("PUT /api/questions/:questionId error:", error);
      return res.status(500).json({ message: "Failed to update question" });
    }
  }
);

router.delete(
  "/:questionId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user?.role !== "instructor") {
        return res.status(403).json({ message: "Instructor access required" });
      }

      const questionId = getParam(req.params.questionId);

      if (!isValidObjectId(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const question = await Question.findById(questionId);

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const exam = await getInstructorExam(
        question.examId.toString(),
        req,
        res
      );

      if (!exam) return;

      await Question.findByIdAndDelete(questionId);

      return res.status(200).json({
        message: "Question deleted successfully",
      });
    } catch (error) {
      console.error("DELETE /api/questions/:questionId error:", error);
      return res.status(500).json({ message: "Failed to delete question" });
    }
  }
);

export default router;

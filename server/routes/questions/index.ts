import { Response, Router } from "express";

import mongoose from "mongoose";

import Question from "../../models/Question";

import Exam from "../../models/Exam";
import { getInstructorExam, getParam, getQuestionBody, getQuestionDuplicateKey, isValidObjectId, QuestionBody, syncExamQuestionCount, validateQuestionData } from "./helpers";

import {

  requireAuth,

  AuthenticatedRequest,

} from "../../middleware/authMiddleware";

const router = Router();

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

      await syncExamQuestionCount(examId);
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

      await syncExamQuestionCount(examId);
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
      await syncExamQuestionCount(question.examId.toString());

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
      await syncExamQuestionCount(question.examId.toString());

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

import { Response } from "express";
import mongoose from "mongoose";
import Question from "../../models/Question";
import Exam from "../../models/Exam";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";

export interface QuestionBody {

  questionText?: string;

  type?: "single" | "multi";

  options?: string[];

  correctAnswers?: string[];

  marks?: number | string;

  explanation?: string;

  difficulty?: "easy" | "medium" | "hard";

  order?: number | string;

}

export const getParam = (value: string | string[] | undefined): string =>

  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export const isValidObjectId = (value: string): boolean =>

  mongoose.Types.ObjectId.isValid(value);

export const cleanStringArray = (value: unknown): string[] => {

  if (!Array.isArray(value)) return [];

  return value

    .filter((item): item is string => typeof item === "string")

    .map((item) => item.trim())

    .filter(Boolean);

};

export const normalizeDuplicateValue = (value: string): string =>

  value.toLowerCase().replace(/[^a-z0-9]/g, "");

export const getQuestionDuplicateKey = (

  questionText: string,

  options: string[]

): string => {

  const normalizedQuestion = normalizeDuplicateValue(questionText);

  const normalizedOptions = options

    .map((option) => normalizeDuplicateValue(option))

    .sort();

  return `${normalizedQuestion}::${normalizedOptions.join("|")}`;

};

export const getQuestionBody = (body: QuestionBody) => {

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

export const getInstructorExam = async (

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

export const validateQuestionData = (

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

export const syncExamQuestionCount = async (examId: string) => {
  const questions = await Question.find({ examId: new mongoose.Types.ObjectId(examId) })
    .sort({ order: 1, createdAt: 1 })
    .select("_id")
    .lean();
  if (questions.length) {
    await Question.bulkWrite(questions.map((question, index) => ({
      updateOne: { filter: { _id: question._id }, update: { $set: { order: index + 1 } } },
    })));
  }
  await Exam.findByIdAndUpdate(examId, { questionCount: questions.length });
  return questions.length;
};

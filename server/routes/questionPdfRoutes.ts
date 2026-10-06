import { Response, Router, type RequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import Exam from "../models/Exam";
import Question from "../models/Question";
import { AuthenticatedRequest, requireAuth } from "../middleware/authMiddleware";
import {
  extractPdfQuestionText,
  parsePdfQuestions,
  type PdfQuestionDraft,
  type PdfQuestionIssue,
} from "../pdfQuestionParser";

const router = Router();
const MAX_QUESTIONS = 100;
const receivePdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single("pdf");

interface ValidatedQuestion {
  questionText: string;
  type: "single" | "multi";
  options: string[];
  correctAnswers: string[];
  marks: number;
  explanation: string;
  difficulty: "medium";
}

type DraftValidation =
  | { question: ValidatedQuestion; reason?: never }
  | { question?: never; reason: string };

const handlePdfUpload: RequestHandler = (req, res, next) => {
  receivePdf(req, res, (error: unknown) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ message: "PDF must be 10 MB or smaller." });
      return;
    }
    res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to receive this PDF.",
    });
  });
};

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function normalizeDuplicateValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getQuestionDuplicateKey(questionText: string, options: string[]): string {
  const normalizedQuestion = normalizeDuplicateValue(questionText);
  const normalizedOptions = options
    .map((option) => normalizeDuplicateValue(option))
    .sort();

  return `${normalizedQuestion}::${normalizedOptions.join("|")}`;
}

async function getOwnedExam(examId: string, req: AuthenticatedRequest, res: Response) {
  if (req.user?.role !== "instructor" || !mongoose.Types.ObjectId.isValid(examId)) {
    res.status(403).json({ message: "Instructor access required." });
    return null;
  }
  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404).json({ message: "Exam not found." });
    return null;
  }
  if (!req.user.userId || exam.createdBy.toString() !== req.user.userId) {
    res.status(403).json({ message: "You are not allowed to manage questions for this exam." });
    return null;
  }
  return exam;
}

function validateDraft(value: unknown): DraftValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { reason: "Question has an invalid format." };
  }
  const raw = value as Record<string, unknown>;
  const questionText = typeof raw.questionText === "string" ? raw.questionText.trim() : "";
  const type = raw.type === "multi" ? "multi" : raw.type === "single" ? "single" : null;
  const options = Array.isArray(raw.options)
    ? raw.options.filter((option): option is string => typeof option === "string").map((option) => option.trim())
    : [];
  const correctAnswers = Array.isArray(raw.correctAnswers)
    ? raw.correctAnswers.filter((answer): answer is string => typeof answer === "string").map((answer) => answer.trim())
    : [];
  const marks = Number(raw.marks);

  if (!questionText || questionText.length > 2000) return { reason: "Question text is required and must be at most 2,000 characters." };
  if (!type) return { reason: "Question type must be single or multi." };
  if (options.length < 2 || options.length > 10 || options.some((option) => !option)) {
    return { reason: "Question must have between 2 and 10 non-empty options." };
  }
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
    return { reason: "Question options must be unique." };
  }
  if (correctAnswers.some((answer) => !options.includes(answer))) {
    return { reason: "Every correct answer must match an option." };
  }
  if ((type === "single" && correctAnswers.length !== 1) ||
      (type === "multi" && correctAnswers.length < 2)) {
    return { reason: "Correct answer count does not match the question type." };
  }
  if (!Number.isFinite(marks) || marks <= 0) return { reason: "Question marks must be greater than zero." };

  return {
    question: {
      questionText,
      type,
      options,
      correctAnswers,
      marks,
      explanation: "",
      difficulty: "medium" as const,
    },
  };
}

router.post(
  "/exam/:examId/import-pdf",
  requireAuth,
  handlePdfUpload,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const examId = getParam(req.params.examId);
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        return res.status(400).json({ message: "Invalid exam ID." });
      }
      const exam = await getOwnedExam(examId, req, res);
      if (!exam) return;

      const file = req.file;
      if (!file) return res.status(400).json({ message: "Select a PDF file to upload." });
      if (file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        return res.status(400).json({ message: "The uploaded file is not a valid PDF." });
      }

      let text = "";
      try {
        text = await extractPdfQuestionText(file.buffer);
      } catch {
        return res.status(422).json({ message: "Could not read this PDF. It may be damaged, encrypted, or unsupported." });
      }
      if (!text.trim()) {
        return res.status(422).json({ message: "This PDF contains no extractable text. Scanned image PDFs are not supported." });
      }

      const parsed = parsePdfQuestions(text);
      if (parsed.questions.length + parsed.issues.length > MAX_QUESTIONS) {
        return res.status(413).json({ message: "A PDF import can contain at most 100 questions." });
      }

      const existing = await Question.find({ examId: exam._id })
        .select("questionText options order")
        .lean();

      const seen = new Set(
        existing.map((question) =>
          getQuestionDuplicateKey(question.questionText, question.options)
        )
      );

      const issues: PdfQuestionIssue[] = [...parsed.issues];
      const validQuestions: Array<PdfQuestionDraft & { order: number }> = [];
      let order = existing.reduce((max, question) => Math.max(max, question.order || 0), 0);

      for (const candidate of parsed.questions) {
        const checked = validateDraft(candidate);
        if (!checked.question) {
          issues.push({
            questionNumber: candidate.questionNumber,
            questionText: candidate.questionText,
            reason: checked.reason || "Question is invalid.",
          });
          continue;
        }

        const key = getQuestionDuplicateKey(
          checked.question.questionText,
          checked.question.options
        );

        if (seen.has(key)) {
          issues.push({
            questionNumber: candidate.questionNumber,
            questionText: candidate.questionText,
            reason: "This question with the same options already exists in the question bank or this PDF.",
          });
          continue;
        }

        seen.add(key);
        order += 1;
        validQuestions.push({ ...candidate, ...checked.question, order });
      }

      return res.status(200).json({
        validQuestions,
        issues,
        validCount: validQuestions.length,
        failedCount: issues.length,
      });
    } catch (error) {
      console.error("PDF question preview failed:", error);
      return res.status(500).json({ message: "Failed to process the question PDF." });
    }
  }
);

router.post(
  "/exam/:examId/import-pdf/confirm",
  requireAuth,
  async (req: AuthenticatedRequest & { body: { questions?: unknown } }, res: Response) => {
    try {
      const examId = getParam(req.params.examId);
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        return res.status(400).json({ message: "Invalid exam ID." });
      }
      const exam = await getOwnedExam(examId, req, res);
      if (!exam) return;

      const submitted = req.body?.questions;
      if (!Array.isArray(submitted) || submitted.length === 0) {
        return res.status(400).json({ message: "No reviewed questions were provided." });
      }
      if (submitted.length > MAX_QUESTIONS) {
        return res.status(413).json({ message: "A PDF import can contain at most 100 questions." });
      }

      const existing = await Question.find({ examId: exam._id })
        .select("questionText options order")
        .lean();

      const seen = new Set(
        existing.map((question) =>
          getQuestionDuplicateKey(question.questionText, question.options)
        )
      );

      let order = existing.reduce((max, question) => Math.max(max, question.order || 0), 0);
      const documents: Array<Record<string, unknown>> = [];
      const issues: string[] = [];

      submitted.forEach((value: unknown, index: number) => {
        const checked = validateDraft(value);
        if (!checked.question) {
          issues.push("Question " + (index + 1) + ": " + (checked.reason || "Question is invalid."));
          return;
        }

        const key = getQuestionDuplicateKey(
          checked.question.questionText,
          checked.question.options
        );

        if (seen.has(key)) {
          issues.push(
            "Question " +
              (index + 1) +
              ": This question with the same options already exists in the question bank or this PDF."
          );
          return;
        }

        seen.add(key);
        order += 1;
        documents.push({ examId: exam._id, ...checked.question, order });
      });

      if (issues.length) {
        return res.status(400).json({
          message: "Some questions were already present or could not be imported.",
          issues,
        });
      }

      const imported = await Question.insertMany(documents, { ordered: true });
      return res.status(201).json({
        message: "PDF questions imported successfully.",
        importedCount: imported.length,
      });
    } catch (error) {
      console.error("PDF question import failed:", error);
      return res.status(500).json({ message: "Failed to save the reviewed PDF questions." });
    }
  }
);

export default router;

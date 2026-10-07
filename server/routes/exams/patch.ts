import { Router, Response } from "express";
import mongoose from "mongoose";
import Exam from "../../models/Exam";
import Question, { IQuestion } from "../../models/Question";
import Attempt from "../../models/Attempt";
import User from "../../models/User";
import { advanceAttemptTimer } from "../../attemptTimer";
import { requireAuth, AuthenticatedRequest } from "../../middleware/authMiddleware";

import {
  isValidObjectId,
  getExamId,
  requireInstructorAccess,
  requireStudentAccess,
  normalizeInstructions,
  selectExamQuestions,
} from "./helpers";

const router = Router();

router.patch(
  "/:examId/results-visibility",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!requireInstructorAccess(req, res)) return;

      const examId = getExamId(req);
      if (!isValidObjectId(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }

      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      if (exam.createdBy.toString() !== req.user!.userId) {
        return res.status(403).json({ message: "You do not have access to this exam" });
      }

      if (typeof req.body.visible !== "boolean") {
        return res.status(400).json({ message: "A visible boolean is required" });
      }

      exam.resultsHidden = !req.body.visible;
      await exam.save();

      return res.status(200).json({
        examId: exam._id,
        resultsHidden: exam.resultsHidden,
      });
    } catch (error) {
      console.error("Failed to update result visibility:", error);
      return res.status(500).json({ message: "Failed to update result visibility" });
    }
  }
);

export default router;

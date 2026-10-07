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

router.get(
  "/published",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!requireStudentAccess(req, res)) {
        return;
      }

      const student = await User.findById(req.user!.userId);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const exams = await Exam.find({
        published: true,
      })
        .select(
          [
            "title",
            "subject",
            "degree",
            "yearOfStudy",
            "semester",
            "duration",
            "questionCount",
            "totalMarks",
            "passingMarks",
            "negativeMarking",
            "negativePenalty",
            "allowedAttempts",
            "startDate",
            "endDate",
            "instructions",
            "shuffleQuestions",
            "shuffleOptions",
            "published",
            "createdAt",
          ].join(" ")
        )
        .sort({
          createdAt: -1,
        });

      const now = new Date();
      const retentionPeriodMs = 4 * 24 * 60 * 60 * 1000;

      const matchesTarget = (target: unknown, studentValue: unknown) => {
        if (target === undefined || target === null || target === "") return true;
        if (studentValue === undefined || studentValue === null || studentValue === "") return false;
        if (typeof target === "string" && typeof studentValue === "string") {
          return target.trim().toLowerCase() === studentValue.trim().toLowerCase();
        }
        return Number(target) === Number(studentValue);
      };

      const examIds = exams.map((exam) => exam._id);
      const attempts = await Attempt.find({ studentId: student._id, examId: { $in: examIds } })
        .sort({ createdAt: -1 });
      const attemptsByExam = new Map<string, typeof attempts>();
      for (const attempt of attempts) {
        const key = attempt.examId.toString();
        attemptsByExam.set(key, [...(attemptsByExam.get(key) || []), attempt]);
      }

      const examsWithStatus =
        exams
          .filter((exam: any) => {
            const eligible =
              matchesTarget(exam.degree, student.degree) &&
              matchesTarget(exam.yearOfStudy, student.yearOfStudy) &&
              matchesTarget(exam.semester, student.semester);

            if (!eligible) return false;
            if (!exam.endDate) return true;

            return now.getTime() <
              new Date(exam.endDate).getTime() + retentionPeriodMs;
          })
          .map((exam: any) => {
            const studentAttempts = attemptsByExam.get(exam._id.toString()) || [];
            const activeAttempt = studentAttempts.find((attempt) => attempt.status === "IN_PROGRESS");
            const completedAttempts = studentAttempts.filter((attempt) => attempt.status !== "IN_PROGRESS");
            const allowedAttempts = Math.max(1, Number(exam.allowedAttempts || 1));
            let availabilityStatus =
              "ACTIVE";

            if (
              exam.startDate &&
              now <
                new Date(
                  exam.startDate
                )
            ) {
              availabilityStatus =
                "UPCOMING";
            } else if (
              exam.endDate &&
              now >=
                new Date(
                  exam.endDate
                )
            ) {
              availabilityStatus =
                "EXPIRED";
            }

            return {
              ...exam.toObject(),
              availabilityStatus,
              attemptsUsed: completedAttempts.length,
              attemptsRemaining: Math.max(0, allowedAttempts - completedAttempts.length),
              activeAttemptId: activeAttempt?.status === "IN_PROGRESS" ? activeAttempt._id : null,
              activeAttemptPaused: activeAttempt?.status === "IN_PROGRESS" ? Boolean(activeAttempt.timerPaused) : false,
            };
          });

      return res.status(200).json(
        examsWithStatus
      );
    } catch (error) {
      console.error(
        "Error fetching published exams:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch published exams",
      });
    }
  }
);

router.get(
  "/instructor",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (
        !requireInstructorAccess(
          req,
          res
        )
      ) {
        return;
      }

      const exams =
        await Exam.find({
          createdBy:
            req.user!.userId,
        }).sort({
          createdAt: -1,
        });

      return res.status(200).json(exams);
    } catch (error) {
      console.error(
        "Error fetching instructor exams:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch instructor exams",
      });
    }
  }
);

router.get(
  "/:examId",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const examId = getExamId(req);

      if (!isValidObjectId(examId)) {
        return res.status(400).json({
          message: "Invalid exam ID",
        });
      }

      const exam =
        await Exam.findById(examId);

      if (!exam) {
        return res.status(404).json({
          message: "Exam not found",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      /* -----------------------------------------
         INSTRUCTOR
      ----------------------------------------- */

      if (
        req.user.role === "instructor"
      ) {
        if (
          exam.createdBy.toString() !==
          req.user.userId
        ) {
          return res.status(403).json({
            message:
              "You do not have access to this exam",
          });
        }

        return res.status(200).json({
          exam,
        });
      }

      /* -----------------------------------------
         STUDENT
      ----------------------------------------- */

      if (!exam.published) {
        return res.status(403).json({
          message:
            "This exam is not published",
        });
      }

      return res.status(200).json({
        exam,
      });
    } catch (error) {
      console.error(
        "Error fetching exam:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch exam",
      });
    }
  }
);

export default router;

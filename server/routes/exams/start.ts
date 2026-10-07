import { Router, Response } from "express";
import mongoose from "mongoose";
import Exam from "../../models/Exam";
import Question, { IQuestion } from "../../models/Question";
import Attempt from "../../models/Attempt";
import User from "../../models/User";
import { requireAuth, AuthenticatedRequest } from "../../middleware/authMiddleware";
import { closeExpiredAttempt } from "../attempts/helpers";

import {
  isValidObjectId,
  getExamId,
  requireInstructorAccess,
  requireStudentAccess,
  normalizeInstructions,
  selectExamQuestions,
} from "./helpers";
import { getAttemptEndTime } from "./helpers";

const router = Router();

router.post(
  "/:examId/start",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (
        !requireStudentAccess(
          req,
          res
        )
      ) {
        return;
      }

      const examId =
        getExamId(req);

      if (!isValidObjectId(examId)) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      /* -----------------------------------------
         FIND EXAM
      ----------------------------------------- */

      const exam =
        await Exam.findById(
          examId
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      /* -----------------------------------------
         PUBLISHED CHECK
      ----------------------------------------- */

      if (!exam.published) {
        return res.status(403).json({
          message:
            "This exam is not published",
        });
      }

      /* -----------------------------------------
         FIND STUDENT
      ----------------------------------------- */

      const student =
        await User.findById(
          req.user!.userId
        );

      if (!student) {
        return res.status(404).json({
          message:
            "Student not found",
        });
      }

      if (
        student.role !== "student"
      ) {
        return res.status(403).json({
          message:
            "Only students can start exams",
        });
      }

      if (!student.isActive) {
        return res.status(403).json({
          message:
            "Your account has been disabled",
        });
      }

      /* -----------------------------------------
         ACADEMIC ELIGIBILITY
      ----------------------------------------- */

      if (
        exam.degree &&
        (!student.degree ||
          exam.degree.trim().toLowerCase() !==
            student.degree.trim().toLowerCase())
      ) {
        return res.status(403).json({
          message:
            "You are not eligible for this exam",
        });
      }

      if (
        exam.yearOfStudy &&
        (!student.yearOfStudy ||
          exam.yearOfStudy !== student.yearOfStudy)
      ) {
        return res.status(403).json({
          message:
            "You are not eligible for this exam",
        });
      }

      if (
        exam.semester &&
        (!student.semester ||
          exam.semester !== student.semester)
      ) {
        return res.status(403).json({
          message:
            "You are not eligible for this exam",
        });
      }

      /* -----------------------------------------
         DATE ELIGIBILITY
      ----------------------------------------- */

      const now = new Date();

      if (
        exam.startDate &&
        now <
          new Date(
            exam.startDate
          )
      ) {
        return res.status(403).json({
          message:
            "This exam has not started yet",
        });
      }

      if (
        exam.endDate &&
        now >=
          new Date(
            exam.endDate
          )
      ) {
        return res.status(403).json({
          message:
            "This exam has expired",
        });
      }

      /* -----------------------------------------
         FIND EXISTING ATTEMPTS
      ----------------------------------------- */

      let existingAttempts =
        await Attempt.find({
          studentId:
            student._id,
          examId:
            exam._id,
        }).sort({
          createdAt: -1,
        });

      /* -----------------------------------------
         CLOSE EXPIRED ACTIVE ATTEMPTS
      ----------------------------------------- */

      for (
        const existingAttempt of
          existingAttempts
      ) {
        if (existingAttempt.status === "IN_PROGRESS") {
          await closeExpiredAttempt(existingAttempt, exam);
        }
      }

      /* -----------------------------------------
         REFRESH ATTEMPTS
      ----------------------------------------- */

      existingAttempts =
        await Attempt.find({
          studentId:
            student._id,
          examId:
            exam._id,
        }).sort({
          createdAt: -1,
        });

      /* -----------------------------------------
         ACTIVE ATTEMPT
         RESUME IT
      ----------------------------------------- */

      const activeAttempt =
        existingAttempts.find(
          (
            attempt
          ) =>
            attempt.status ===
            "IN_PROGRESS"
        );

      if (activeAttempt) {
        return res.status(200).json({
          message:
            "Resuming your active exam",

          resumed: true,

          attempt: {
            _id:
              activeAttempt._id,

            examId:
              activeAttempt.examId,

            questionIds:
              activeAttempt.questionIds,

            answers:
              activeAttempt.answers,

            startTime:
              activeAttempt.startTime,

            endTime:
              activeAttempt.endTime,

            submittedAt:
              activeAttempt.submittedAt,

            status:
              activeAttempt.status,

            tabSwitchCount:
              activeAttempt.tabSwitchCount,

            remainingSeconds:
              activeAttempt.remainingSeconds,

            timerPaused:
              activeAttempt.timerPaused,
          },

          exam: {
            _id:
              exam._id,

            title:
              exam.title,

            subject:
              exam.subject,

            degree:
              exam.degree,

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

            instructions:
              exam.instructions,

            startDate:
              exam.startDate,

            endDate:
              exam.endDate,
          },
        });
      }

      /* -----------------------------------------
         ATTEMPT LIMIT
      ----------------------------------------- */

      const completedAttempts =
        existingAttempts.filter(
          (
            attempt
          ) =>
            attempt.status ===
              "SUBMITTED" ||
            attempt.status ===
              "EVALUATED" ||
            attempt.status ===
              "TIMED_OUT"
        );

      const allowedAttempts = 1;

      if (
        completedAttempts.length >=
        allowedAttempts
      ) {
        return res.status(409).json({
          message:
            "You have already used all allowed attempts for this exam",

          attemptsUsed:
            completedAttempts.length,

          allowedAttempts,
        });
      }

      /* -----------------------------------------
         FETCH QUESTION BANK
      ----------------------------------------- */

      const questions =
        await Question.find({
          examId:
            exam._id,
        }).sort({
          order: 1,
        });

      /* -----------------------------------------
         ENOUGH QUESTIONS CHECK
      ----------------------------------------- */

      if (
        questions.length <
        exam.questionCount
      ) {
        return res.status(400).json({
          message:
            `This exam does not have enough questions. Required: ${exam.questionCount}, Available: ${questions.length}`,
        });
      }

      /* -----------------------------------------
         RANDOMIZE QUESTIONS

         The selected question IDs are stored
         permanently on the Attempt.
         They will NOT change on refresh.
      ----------------------------------------- */

      const selectedQuestions = selectExamQuestions(questions, exam.questionCount);

      if (
        selectedQuestions.length !==
        exam.questionCount
      ) {
        return res.status(400).json({
          message:
            "Unable to create the required question set",
        });
      }

      /* -----------------------------------------
         STORE FIXED QUESTION IDS
      ----------------------------------------- */

      const questionIds =
        selectedQuestions.map(
          (
            question
          ) =>
            question._id
        );

      /* -----------------------------------------
         SERVER-SIDE TIMER
      ----------------------------------------- */

      const startTime =
        new Date();

      const endTime = getAttemptEndTime(exam, startTime);

      /* -----------------------------------------
         CREATE ATTEMPT
      ----------------------------------------- */

      let attempt;
      try {
        attempt = await Attempt.create({
          studentId:
            student._id,

          examId:
            exam._id,

          attemptKey: `${student._id.toString()}:${exam._id.toString()}`,

          questionIds,

          answers: {},

          startTime,

          endTime,

          remainingSeconds: Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000)),

          timerPaused: false,

          lastHeartbeatAt: startTime,

          submittedAt:
            null,

          status:
            "IN_PROGRESS",

          score: 0,

          totalMarks:
            exam.totalMarks,

          percentage: 0,

          passed: false,

          tabSwitchCount: 0,
        });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === 11000) {
          return res.status(409).json({ message: "An attempt for this exam already exists" });
        }
        throw error;
      }

      /* -----------------------------------------
         RESPONSE
      ----------------------------------------- */

      return res.status(201).json({
        message:
          "Exam started successfully",

        resumed: false,

        attempt: {
          _id:
            attempt._id,

          examId:
            attempt.examId,

          questionIds:
            attempt.questionIds,

          answers:
            attempt.answers,

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
          _id:
            exam._id,

          title:
            exam.title,

          subject:
            exam.subject,

          degree:
            exam.degree,

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

          instructions:
            exam.instructions,
        },

        attemptsUsed:
          completedAttempts.length +
          1,

        allowedAttempts,

        attemptsRemaining:
          Math.max(
            0,
            allowedAttempts -
              (completedAttempts.length +
                1)
          ),
      });
    } catch (error) {
      console.error(
        "Error starting exam:",
        error
      );

      if (
        error instanceof
        mongoose.Error.ValidationError
      ) {
        return res.status(400).json({
          message:
            "Invalid exam attempt data",
          details:
            error.message,
        });
      }

      return res.status(500).json({
        message:
          "Failed to start exam",
      });
    }
  }
);

export default router;

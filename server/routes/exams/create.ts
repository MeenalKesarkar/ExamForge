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

router.post(
  "/",
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

      const {
        title,
        subject,
        degree,
        yearOfStudy,
        semester,
        duration,
        questionCount,
        totalMarks,
        passingMarks,
        negativeMarking,
        negativePenalty,
        allowedAttempts,
        startDate,
        endDate,
        instructions,
        shuffleQuestions,
        shuffleOptions,
        published,
      } = req.body;

      /* -----------------------------------------
         BASIC VALIDATION
      ----------------------------------------- */

      if (
        typeof title !== "string" ||
        title.trim().length < 2
      ) {
        return res.status(400).json({
          message:
            "Exam title is required",
        });
      }

      const parsedDuration =
        Number(duration);

      const parsedQuestionCount =
        Number(questionCount);

      const parsedTotalMarks =
        Number(totalMarks);

      const parsedPassingMarks =
        Number(passingMarks);

      const parsedNegativePenalty =
        Number(
          negativePenalty ?? 0
        );

      const parsedAllowedAttempts =
        Number(
          allowedAttempts ?? 1
        );

      if (
        !Number.isFinite(
          parsedDuration
        ) ||
        parsedDuration < 1
      ) {
        return res.status(400).json({
          message:
            "Duration must be at least 1 minute",
        });
      }

      if (
        !Number.isFinite(
          parsedQuestionCount
        ) ||
        parsedQuestionCount < 1
      ) {
        return res.status(400).json({
          message:
            "Question count must be at least 1",
        });
      }

      if (
        !Number.isFinite(
          parsedTotalMarks
        ) ||
        parsedTotalMarks < 0
      ) {
        return res.status(400).json({
          message:
            "Total marks must be 0 or greater",
        });
      }

      if (
        !Number.isFinite(
          parsedPassingMarks
        ) ||
        parsedPassingMarks < 0
      ) {
        return res.status(400).json({
          message:
            "Passing marks must be 0 or greater",
        });
      }

      if (
        parsedPassingMarks >
        parsedTotalMarks
      ) {
        return res.status(400).json({
          message: `Passing marks (${parsedPassingMarks}) cannot exceed total marks (${parsedTotalMarks}). Lower the passing marks and try again.`,
        });
      }

      if (parsedAllowedAttempts !== 1) {
        return res.status(400).json({
          message:
            "Each student can attempt an exam only once",
        });
      }

      if (
        parsedNegativePenalty < 0
      ) {
        return res.status(400).json({
          message:
            "Negative penalty cannot be negative",
        });
      }

      /* -----------------------------------------
         ACADEMIC VALUES
      ----------------------------------------- */

      const parsedYear =
        yearOfStudy === undefined ||
        yearOfStudy === null ||
        yearOfStudy === ""
          ? undefined
          : Number(yearOfStudy);

      const parsedSemester =
        semester === undefined ||
        semester === null ||
        semester === ""
          ? undefined
          : Number(semester);

      if (
        parsedYear !== undefined &&
        (!Number.isInteger(
          parsedYear
        ) ||
          parsedYear < 1 ||
          parsedYear > 3)
      ) {
        return res.status(400).json({
          message:
            "Year must be between 1 and 3",
        });
      }

      if (
        parsedSemester !==
          undefined &&
        (!Number.isInteger(
          parsedSemester
        ) ||
          parsedSemester < 1 ||
          parsedSemester > 6)
      ) {
        return res.status(400).json({
          message:
            "Semester must be between 1 and 6",
        });
      }

      /* -----------------------------------------
         DATE VALUES
      ----------------------------------------- */

      let parsedStartDate:
        | Date
        | undefined;

      let parsedEndDate:
        | Date
        | undefined;

      if (startDate) {
        parsedStartDate =
          new Date(startDate);

        if (
          Number.isNaN(
            parsedStartDate.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid start date",
          });
        }
      }

      if (endDate) {
        parsedEndDate =
          new Date(endDate);

        if (
          Number.isNaN(
            parsedEndDate.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid end date",
          });
        }
      }

      if (Boolean(published) && !parsedStartDate) {
        parsedStartDate = new Date();
      }

      if (Boolean(published) && !parsedEndDate) {
        return res.status(400).json({
          message:
            "Published exams require a deadline",
        });
      }

      if (
        parsedStartDate &&
        parsedEndDate &&
        parsedEndDate <=
          parsedStartDate
      ) {
        return res.status(400).json({
          message:
            "End date must be after start date",
        });
      }

      /* -----------------------------------------
         CREATE
      ----------------------------------------- */

      const exam =
        await Exam.create({
          title:
            title.trim(),

          subject:
            typeof subject ===
            "string"
              ? subject.trim()
              : "",

          degree:
            typeof degree ===
            "string"
              ? degree.trim()
              : "BCA",

          yearOfStudy:
            parsedYear,

          semester:
            parsedSemester,

          duration:
            parsedDuration,

          questionCount:
            parsedQuestionCount,

          totalMarks:
            parsedTotalMarks,

          passingMarks:
            parsedPassingMarks,

          negativeMarking:
            Boolean(
              negativeMarking
            ),

          negativePenalty:
            parsedNegativePenalty,

          allowedAttempts:
            1,

          startDate:
            parsedStartDate,

          endDate:
            parsedEndDate,

          instructions:
            normalizeInstructions(
              instructions
            ),

          shuffleQuestions:
            Boolean(
              shuffleQuestions
            ),

          shuffleOptions:
            Boolean(
              shuffleOptions
            ),

          published:
            Boolean(published),

          createdBy:
            req.user!.userId,
        });

      return res.status(201).json({
        message:
          "Exam created successfully",
        exam,
      });
    } catch (error) {
      console.error(
        "Error creating exam:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to create exam",
      });
    }
  }
);

export default router;

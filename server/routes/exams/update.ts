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

router.put(
  "/:examId",
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

      const examId =
        getExamId(req);

      if (!isValidObjectId(examId)) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

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

      if (
        exam.createdBy.toString() !==
        req.user!.userId
      ) {
        return res.status(403).json({
          message:
            "You do not have access to this exam",
        });
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

      if (
        title !== undefined
      ) {
        if (
          typeof title !==
            "string" ||
          title.trim().length <
            2
        ) {
          return res.status(400).json({
            message:
              "Exam title is required",
          });
        }

        exam.title =
          title.trim();
      }

      if (
        subject !== undefined
      ) {
        exam.subject =
          typeof subject ===
          "string"
            ? subject.trim()
            : "";
      }

      if (
        degree !== undefined
      ) {
        exam.degree =
          typeof degree ===
          "string"
            ? degree.trim()
            : "BCA";
      }

      /* -----------------------------------------
         YEAR
      ----------------------------------------- */

      if (
        yearOfStudy !==
        undefined
      ) {
        const parsedYear =
          yearOfStudy === "" ||
          yearOfStudy === null
            ? undefined
            : Number(
                yearOfStudy
              );

        if (
          parsedYear !==
            undefined &&
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

        exam.yearOfStudy =
          parsedYear;
      }

      /* -----------------------------------------
         SEMESTER
      ----------------------------------------- */

      if (
        semester !== undefined
      ) {
        const parsedSemester =
          semester === "" ||
          semester === null
            ? undefined
            : Number(
                semester
              );

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

        exam.semester =
          parsedSemester;
      }

      /* -----------------------------------------
         DURATION
      ----------------------------------------- */

      if (
        duration !== undefined
      ) {
        const parsedDuration =
          Number(duration);

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

        exam.duration =
          parsedDuration;
      }

      /* -----------------------------------------
         QUESTION COUNT
      ----------------------------------------- */

      if (
        questionCount !==
        undefined
      ) {
        const parsedQuestionCount =
          Number(
            questionCount
          );

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

        exam.questionCount =
          parsedQuestionCount;
      }

      /* -----------------------------------------
         MARKS
      ----------------------------------------- */

      if (
        totalMarks !==
        undefined
      ) {
        const parsedTotalMarks =
          Number(
            totalMarks
          );

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

        exam.totalMarks =
          parsedTotalMarks;
      }

      if (
        passingMarks !==
        undefined
      ) {
        const parsedPassingMarks =
          Number(
            passingMarks
          );

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

        exam.passingMarks =
          parsedPassingMarks;
      }

      if (
        exam.passingMarks >
        exam.totalMarks
      ) {
        return res.status(400).json({
          message: `Passing marks (${exam.passingMarks}) cannot exceed total marks (${exam.totalMarks}). Lower the passing marks and try again.`,
        });
      }

      /* -----------------------------------------
         NEGATIVE MARKING
      ----------------------------------------- */

      if (
        negativeMarking !==
        undefined
      ) {
        exam.negativeMarking =
          Boolean(
            negativeMarking
          );
      }

      if (
        negativePenalty !==
        undefined
      ) {
        const parsedPenalty =
          Number(
            negativePenalty
          );

        if (
          !Number.isFinite(
            parsedPenalty
          ) ||
          parsedPenalty < 0
        ) {
          return res.status(400).json({
            message:
              "Negative penalty cannot be negative",
          });
        }

        exam.negativePenalty =
          parsedPenalty;
      }

      /* -----------------------------------------
         ATTEMPTS
      ----------------------------------------- */

      if (
        allowedAttempts !==
        undefined
      ) {
        const parsedAttempts =
          Number(
            allowedAttempts
          );

        if (parsedAttempts !== 1) {
          return res.status(400).json({
            message:
              "Each student can attempt an exam only once",
          });
        }

        exam.allowedAttempts = 1;
      }

      /* -----------------------------------------
         DATES
      ----------------------------------------- */

      if (
        startDate !==
        undefined
      ) {
        if (
          startDate === null ||
          startDate === ""
        ) {
          exam.startDate =
            undefined;
        } else {
          const parsedStartDate =
            new Date(
              startDate
            );

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

          exam.startDate =
            parsedStartDate;
        }
      }

      if (
        endDate !==
        undefined
      ) {
        if (
          endDate === null ||
          endDate === ""
        ) {
          exam.endDate =
            undefined;
        } else {
          const parsedEndDate =
            new Date(
              endDate
            );

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

          exam.endDate =
            parsedEndDate;
        }
      }

      /* -----------------------------------------
         OTHER SETTINGS
      ----------------------------------------- */

      if (
        instructions !==
        undefined
      ) {
        exam.instructions =
          normalizeInstructions(
            instructions
          );
      }

      if (
        shuffleQuestions !==
        undefined
      ) {
        exam.shuffleQuestions =
          Boolean(
            shuffleQuestions
          );
      }

      if (
        shuffleOptions !==
        undefined
      ) {
        exam.shuffleOptions =
          Boolean(
            shuffleOptions
          );
      }

      if (
        published !==
        undefined
      ) {
        exam.published =
          Boolean(published);
      }

      if (exam.published && !exam.startDate && exam.endDate) {
        exam.startDate = new Date();
      }

      if (exam.published && !exam.endDate) {
        return res.status(400).json({
          message:
            "Published exams require a deadline",
        });
      }

      if (exam.startDate && exam.endDate && exam.endDate <= exam.startDate) {
        return res.status(400).json({
          message:
            "End date must be after start date",
        });
      }

      await exam.save();

      return res.status(200).json({
        message:
          "Exam updated successfully",
        exam,
      });
    } catch (error) {
      console.error(
        "Error updating exam:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update exam",
      });
    }
  }
);

export default router;

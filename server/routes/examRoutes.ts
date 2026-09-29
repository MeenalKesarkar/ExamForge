import { Router, Response } from "express";
import mongoose from "mongoose";

import Exam from "../models/Exam";
import Question from "../models/Question";
import Attempt from "../models/Attempt";
import User from "../models/User";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = Router();

/* =========================================================
   HELPERS
========================================================= */

const isValidObjectId = (
  value: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(value);
};

const getExamId = (
  req: AuthenticatedRequest
): string => {
  const value = req.params.examId;

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const requireInstructorAccess = (
  req: AuthenticatedRequest,
  res: Response
): boolean => {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });

    return false;
  }

  if (req.user.role !== "instructor") {
    res.status(403).json({
      message: "Instructor access required",
    });

    return false;
  }

  return true;
};

const requireStudentAccess = (
  req: AuthenticatedRequest,
  res: Response
): boolean => {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });

    return false;
  }

  if (req.user.role !== "student") {
    res.status(403).json({
      message: "Student access required",
    });

    return false;
  }

  return true;
};

const normalizeInstructions = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: unknown) =>
      String(item).trim()
    )
    .filter(
      (item: string) =>
        item.length > 0
    );
};

/* =========================================================
   GET PUBLISHED EXAMS
   GET /api/exams/published
========================================================= */

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

      return res.status(200).json(exams);
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

/* =========================================================
   GET ALL INSTRUCTOR EXAMS
   GET /api/exams/instructor
========================================================= */

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

/* =========================================================
   GET SINGLE EXAM
   GET /api/exams/:examId
========================================================= */

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

/* =========================================================
   CREATE EXAM
   POST /api/exams
========================================================= */

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
          message:
            "Passing marks cannot exceed total marks",
        });
      }

      if (
        parsedAllowedAttempts < 1 ||
        parsedAllowedAttempts > 10
      ) {
        return res.status(400).json({
          message:
            "Allowed attempts must be between 1 and 10",
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
            parsedAllowedAttempts,

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

/* =========================================================
   UPDATE EXAM
   PUT /api/exams/:examId
========================================================= */

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
          message:
            "Passing marks cannot exceed total marks",
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

        if (
          !Number.isInteger(
            parsedAttempts
          ) ||
          parsedAttempts < 1 ||
          parsedAttempts > 10
        ) {
          return res.status(400).json({
            message:
              "Allowed attempts must be between 1 and 10",
          });
        }

        exam.allowedAttempts =
          parsedAttempts;
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

      if (
        exam.startDate &&
        exam.endDate &&
        exam.endDate <=
          exam.startDate
      ) {
        return res.status(400).json({
          message:
            "End date must be after start date",
        });
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

/* =========================================================
   DELETE EXAM
   DELETE /api/exams/:examId
========================================================= */

router.delete(
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

      await Question.deleteMany({
        examId: exam._id,
      });

      await Attempt.deleteMany({
        examId: exam._id,
      });

      await Exam.deleteOne({
        _id: exam._id,
      });

      return res.status(200).json({
        message:
          "Exam deleted successfully",
      });
    } catch (error) {
      console.error(
        "Error deleting exam:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to delete exam",
      });
    }
  }
);

/* =========================================================
   START / RESUME EXAM
   POST /api/exams/:examId/start

   IMPORTANT:
   If an active attempt already exists,
   return that attempt instead of 409.

   This allows the student to resume the
   same fixed question set.
========================================================= */

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
        student.degree &&
        exam.degree !==
          student.degree
      ) {
        return res.status(403).json({
          message:
            "You are not eligible for this exam",
        });
      }

      if (
        exam.yearOfStudy &&
        student.yearOfStudy &&
        exam.yearOfStudy !==
          student.yearOfStudy
      ) {
        return res.status(403).json({
          message:
            "You are not eligible for this exam",
        });
      }

      if (
        exam.semester &&
        student.semester &&
        exam.semester !==
          student.semester
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
        now >
          new Date(
            exam.endDate
          )
      ) {
        return res.status(403).json({
          message:
            "This exam has ended",
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
        if (
          existingAttempt.status ===
            "IN_PROGRESS" &&
          new Date() >=
            new Date(
              existingAttempt.endTime
            )
        ) {
          existingAttempt.status =
            "TIMED_OUT";

          existingAttempt.submittedAt =
            existingAttempt.endTime;

          await existingAttempt.save();
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

      const allowedAttempts =
        Math.max(
          1,
          Number(
            exam.allowedAttempts ||
              1
          )
        );

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

      const shuffledQuestions =
        [...questions];

      for (
        let index =
          shuffledQuestions.length -
          1;
        index > 0;
        index--
      ) {
        const randomIndex =
          Math.floor(
            Math.random() *
              (index + 1)
          );

        const currentQuestion =
          shuffledQuestions[
            index
          ];

        shuffledQuestions[
          index
        ] =
          shuffledQuestions[
            randomIndex
          ];

        shuffledQuestions[
          randomIndex
        ] =
          currentQuestion;
      }

      const selectedQuestions =
        shuffledQuestions.slice(
          0,
          exam.questionCount
        );

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

      const endTime =
        new Date(
          startTime.getTime() +
            Number(
              exam.duration
            ) *
              60 *
              1000
        );

      /* -----------------------------------------
         CREATE ATTEMPT
      ----------------------------------------- */

      const attempt =
        await Attempt.create({
          studentId:
            student._id,

          examId:
            exam._id,

          questionIds,

          answers: {},

          startTime,

          endTime,

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
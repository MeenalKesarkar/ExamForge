import { Router, Response } from "express";
import mongoose from "mongoose";

import Exam from "../models/Exam";
import Attempt from "../models/Attempt";
import Question from "../models/Question";
import User from "../models/User";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = Router();

/* =========================================================
   TYPES
========================================================= */

interface CreateExamBody {
  title?: string;
  subject?: string;
  degree?: string;
  yearOfStudy?: number | string;
  semester?: number | string;
  duration?: number | string;
  questionCount?: number | string;
  totalMarks?: number | string;
  passingMarks?: number | string;
  negativeMarking?: boolean;
  negativePenalty?: number | string;
  allowedAttempts?: number | string;
  startDate?: string;
  endDate?: string;
  instructions?: string | string[];
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  published?: boolean;
}

interface QuestionIdDocument {
  _id: mongoose.Types.ObjectId;
}

/* =========================================================
   HELPERS
========================================================= */

const getExamId = (
  value: string | string[] | undefined
): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const isValidObjectId = (
  value: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(value);
};

const requireInstructorAccess = (
  req: AuthenticatedRequest
): boolean => {
  return req.user?.role === "instructor";
};

const requireStudentAccess = (
  req: AuthenticatedRequest
): boolean => {
  return req.user?.role === "student";
};

const normalizeInstructions = (
  instructions:
    | string
    | string[]
    | undefined
): string[] => {
  if (Array.isArray(instructions)) {
    return instructions
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (
    typeof instructions === "string" &&
    instructions.trim()
  ) {
    return [instructions.trim()];
  }

  return [];
};

const parseOptionalNumber = (
  value: unknown
): number | undefined => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const parseBoolean = (
  value: unknown,
  defaultValue = false
): boolean => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
};

/* =========================================================
   GET INSTRUCTOR EXAMS
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
      if (!requireInstructorAccess(req)) {
        return res.status(403).json({
          message: "Instructor access required",
        });
      }

      const instructorId = req.user?.userId;

      if (
        !instructorId ||
        !isValidObjectId(instructorId)
      ) {
        return res.status(401).json({
          message:
            "Invalid instructor authentication",
        });
      }

      const exams = await Exam.find({
        createdBy:
          new mongoose.Types.ObjectId(
            instructorId
          ),
      })
        .sort({
          createdAt: -1,
        })
        .lean();

      return res.status(200).json({
        exams,
      });
    } catch (error) {
      console.error(
        "Get instructor exams error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load instructor exams",
      });
    }
  }
);

/* =========================================================
   GET PUBLISHED EXAMS
   GET /api/exams/published

   Only published exams are returned.

   Student academic information is intentionally NOT used
   only as a frontend filter. Eligibility is checked again
   when the student starts the exam.
========================================================= */

router.get(
  "/published",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!requireStudentAccess(req)) {
        return res.status(403).json({
          message:
            "Student access required",
        });
      }

      const exams = await Exam.find({
        published: true,
      })
        .select(
          [
            "_id",
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
        })
        .lean();

      return res.status(200).json({
        exams,
      });
    } catch (error) {
      console.error(
        "Get published exams error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load published exams",
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
      const examId = getExamId(
        req.params.examId
      );

      if (!isValidObjectId(examId)) {
        return res.status(400).json({
          message: "Invalid exam ID",
        });
      }

      const exam = await Exam.findById(
        examId
      ).lean();

      if (!exam) {
        return res.status(404).json({
          message: "Exam not found",
        });
      }

      /* ---------------------------------------------------
         INSTRUCTOR
      --------------------------------------------------- */

      if (requireInstructorAccess(req)) {
        if (
          exam.createdBy?.toString() !==
          req.user?.userId
        ) {
          return res.status(403).json({
            message:
              "You are not allowed to access this exam",
          });
        }

        return res.status(200).json({
          exam,
        });
      }

      /* ---------------------------------------------------
         STUDENT
      --------------------------------------------------- */

      if (requireStudentAccess(req)) {
        if (!exam.published) {
          return res.status(403).json({
            message:
              "This exam is not available",
          });
        }

        return res.status(200).json({
          exam,
        });
      }

      return res.status(403).json({
        message: "Access denied",
      });
    } catch (error) {
      console.error(
        "Get single exam error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load exam",
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
    req: AuthenticatedRequest & {
      body: CreateExamBody;
    },
    res: Response
  ) => {
    try {
      if (!requireInstructorAccess(req)) {
        return res.status(403).json({
          message:
            "Instructor access required",
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

      /* ---------------------------------------------------
         TITLE
      --------------------------------------------------- */

      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          message:
            "Exam title is required",
        });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({
          message:
            "Exam title cannot exceed 200 characters",
        });
      }

      /* ---------------------------------------------------
         SUBJECT
      --------------------------------------------------- */

      const parsedSubject =
        typeof subject === "string"
          ? subject.trim()
          : "";

      if (parsedSubject.length > 150) {
        return res.status(400).json({
          message:
            "Subject cannot exceed 150 characters",
        });
      }

      /* ---------------------------------------------------
         DEGREE
      --------------------------------------------------- */

      const parsedDegree =
        typeof degree === "string" &&
        degree.trim()
          ? degree.trim()
          : "BCA";

      /* ---------------------------------------------------
         YEAR
      --------------------------------------------------- */

      const parsedYear =
        parseOptionalNumber(yearOfStudy);

      if (
        parsedYear !== undefined &&
        (!Number.isInteger(parsedYear) ||
          parsedYear < 1 ||
          parsedYear > 3)
      ) {
        return res.status(400).json({
          message:
            "Year of study must be 1, 2 or 3",
        });
      }

      /* ---------------------------------------------------
         SEMESTER
      --------------------------------------------------- */

      const parsedSemester =
        parseOptionalNumber(semester);

      if (
        parsedSemester !== undefined &&
        (!Number.isInteger(parsedSemester) ||
          parsedSemester < 1 ||
          parsedSemester > 6)
      ) {
        return res.status(400).json({
          message:
            "Semester must be between 1 and 6",
        });
      }

      /* ---------------------------------------------------
         DURATION
      --------------------------------------------------- */

      const parsedDuration =
        Number(duration);

      if (
        !Number.isFinite(parsedDuration) ||
        parsedDuration <= 0
      ) {
        return res.status(400).json({
          message:
            "Duration must be greater than 0",
        });
      }

      /* ---------------------------------------------------
         QUESTION COUNT
      --------------------------------------------------- */

      const parsedQuestionCount =
        Number(questionCount);

      if (
        !Number.isFinite(
          parsedQuestionCount
        ) ||
        !Number.isInteger(
          parsedQuestionCount
        ) ||
        parsedQuestionCount <= 0
      ) {
        return res.status(400).json({
          message:
            "Question count must be a positive whole number",
        });
      }

      /* ---------------------------------------------------
         TOTAL MARKS
      --------------------------------------------------- */

      const parsedTotalMarks =
        totalMarks !== undefined &&
        totalMarks !== null &&
        totalMarks !== ""
          ? Number(totalMarks)
          : parsedQuestionCount;

      if (
        !Number.isFinite(
          parsedTotalMarks
        ) ||
        parsedTotalMarks <= 0
      ) {
        return res.status(400).json({
          message:
            "Total marks must be greater than 0",
        });
      }

      /* ---------------------------------------------------
         PASSING MARKS
      --------------------------------------------------- */

      const parsedPassingMarks =
        passingMarks !== undefined &&
        passingMarks !== null &&
        passingMarks !== ""
          ? Number(passingMarks)
          : Math.ceil(
              parsedTotalMarks * 0.5
            );

      if (
        !Number.isFinite(
          parsedPassingMarks
        ) ||
        parsedPassingMarks < 0 ||
        parsedPassingMarks >
          parsedTotalMarks
      ) {
        return res.status(400).json({
          message:
            "Passing marks must be between 0 and total marks",
        });
      }

      /* ---------------------------------------------------
         NEGATIVE MARKING
      --------------------------------------------------- */

      const parsedNegativeMarking =
        parseBoolean(
          negativeMarking,
          false
        );

      const parsedNegativePenalty =
        negativePenalty !==
          undefined &&
        negativePenalty !== null &&
        negativePenalty !== ""
          ? Number(negativePenalty)
          : 0;

      if (
        !Number.isFinite(
          parsedNegativePenalty
        ) ||
        parsedNegativePenalty < 0
      ) {
        return res.status(400).json({
          message:
            "Negative marking penalty cannot be negative",
        });
      }

      /* ---------------------------------------------------
         ALLOWED ATTEMPTS
      --------------------------------------------------- */

      const parsedAllowedAttempts =
        allowedAttempts !== undefined &&
        allowedAttempts !== null &&
        allowedAttempts !== ""
          ? Number(allowedAttempts)
          : 1;

      if (
        !Number.isFinite(
          parsedAllowedAttempts
        ) ||
        !Number.isInteger(
          parsedAllowedAttempts
        ) ||
        parsedAllowedAttempts < 1 ||
        parsedAllowedAttempts > 10
      ) {
        return res.status(400).json({
          message:
            "Allowed attempts must be between 1 and 10",
        });
      }

      /* ---------------------------------------------------
         DATES
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         CREATE
      --------------------------------------------------- */

      const exam = await Exam.create({
        title: title.trim(),

        subject: parsedSubject,

        degree: parsedDegree,

        yearOfStudy: parsedYear,

        semester: parsedSemester,

        duration: parsedDuration,

        questionCount:
          parsedQuestionCount,

        totalMarks:
          parsedTotalMarks,

        passingMarks:
          parsedPassingMarks,

        negativeMarking:
          parsedNegativeMarking,

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
          parseBoolean(
            shuffleQuestions,
            false
          ),

        shuffleOptions:
          parseBoolean(
            shuffleOptions,
            false
          ),

        published:
          parseBoolean(
            published,
            false
          ),

        createdBy:
          new mongoose.Types.ObjectId(
            req.user!.userId
          ),
      });

      return res.status(201).json({
        message:
          "Exam created successfully",
        exam,
      });
    } catch (error) {
      console.error(
        "Create exam error:",
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
    req: AuthenticatedRequest & {
      body: CreateExamBody;
    },
    res: Response
  ) => {
    try {
      if (!requireInstructorAccess(req)) {
        return res.status(403).json({
          message:
            "Instructor access required",
        });
      }

      const examId = getExamId(
        req.params.examId
      );

      if (!isValidObjectId(examId)) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      const exam =
        await Exam.findById(examId);

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      /* ---------------------------------------------------
         OWNERSHIP
      --------------------------------------------------- */

      if (
        exam.createdBy?.toString() !==
        req.user?.userId
      ) {
        return res.status(403).json({
          message:
            "You are not allowed to modify this exam",
        });
      }

      const body = req.body;

      /* ---------------------------------------------------
         TITLE
      --------------------------------------------------- */

      if (body.title !== undefined) {
        const title =
          String(body.title).trim();

        if (!title) {
          return res.status(400).json({
            message:
              "Exam title cannot be empty",
          });
        }

        if (title.length > 200) {
          return res.status(400).json({
            message:
              "Exam title cannot exceed 200 characters",
          });
        }

        exam.title = title;
      }

      /* ---------------------------------------------------
         SUBJECT
      --------------------------------------------------- */

      if (body.subject !== undefined) {
        const subject =
          String(body.subject).trim();

        if (subject.length > 150) {
          return res.status(400).json({
            message:
              "Subject cannot exceed 150 characters",
          });
        }

        exam.subject = subject;
      }

      /* ---------------------------------------------------
         DEGREE
      --------------------------------------------------- */

      if (body.degree !== undefined) {
        const degree =
          String(body.degree).trim();

        if (!degree) {
          return res.status(400).json({
            message:
              "Degree cannot be empty",
          });
        }

        exam.degree = degree;
      }

      /* ---------------------------------------------------
         YEAR
      --------------------------------------------------- */

      if (
        body.yearOfStudy !== undefined
      ) {
        const year =
          Number(body.yearOfStudy);

        if (
          !Number.isInteger(year) ||
          year < 1 ||
          year > 3
        ) {
          return res.status(400).json({
            message:
              "Year of study must be 1, 2 or 3",
          });
        }

        exam.yearOfStudy = year;
      }

      /* ---------------------------------------------------
         SEMESTER
      --------------------------------------------------- */

      if (
        body.semester !== undefined
      ) {
        const semester =
          Number(body.semester);

        if (
          !Number.isInteger(
            semester
          ) ||
          semester < 1 ||
          semester > 6
        ) {
          return res.status(400).json({
            message:
              "Semester must be between 1 and 6",
          });
        }

        exam.semester = semester;
      }

      /* ---------------------------------------------------
         DURATION
      --------------------------------------------------- */

      if (
        body.duration !== undefined
      ) {
        const duration =
          Number(body.duration);

        if (
          !Number.isFinite(duration) ||
          duration <= 0
        ) {
          return res.status(400).json({
            message:
              "Duration must be greater than 0",
          });
        }

        exam.duration = duration;
      }

      /* ---------------------------------------------------
         QUESTION COUNT
      --------------------------------------------------- */

      if (
        body.questionCount !== undefined
      ) {
        const questionCount =
          Number(
            body.questionCount
          );

        if (
          !Number.isInteger(
            questionCount
          ) ||
          questionCount <= 0
        ) {
          return res.status(400).json({
            message:
              "Question count must be a positive whole number",
          });
        }

        exam.questionCount =
          questionCount;
      }

      /* ---------------------------------------------------
         TOTAL MARKS
      --------------------------------------------------- */

      if (
        body.totalMarks !== undefined
      ) {
        const totalMarks =
          Number(
            body.totalMarks
          );

        if (
          !Number.isFinite(
            totalMarks
          ) ||
          totalMarks <= 0
        ) {
          return res.status(400).json({
            message:
              "Total marks must be greater than 0",
          });
        }

        exam.totalMarks =
          totalMarks;
      }

      /* ---------------------------------------------------
         PASSING MARKS
      --------------------------------------------------- */

      if (
        body.passingMarks !==
        undefined
      ) {
        const passingMarks =
          Number(
            body.passingMarks
          );

        if (
          !Number.isFinite(
            passingMarks
          ) ||
          passingMarks < 0
        ) {
          return res.status(400).json({
            message:
              "Passing marks cannot be negative",
          });
        }

        exam.passingMarks =
          passingMarks;
      }

      /* ---------------------------------------------------
         NEGATIVE MARKING
      --------------------------------------------------- */

      if (
        body.negativeMarking !==
        undefined
      ) {
        exam.negativeMarking =
          parseBoolean(
            body.negativeMarking,
            false
          );
      }

      if (
        body.negativePenalty !==
        undefined
      ) {
        const penalty =
          Number(
            body.negativePenalty
          );

        if (
          !Number.isFinite(
            penalty
          ) ||
          penalty < 0
        ) {
          return res.status(400).json({
            message:
              "Negative marking penalty cannot be negative",
          });
        }

        exam.negativePenalty =
          penalty;
      }

      /* ---------------------------------------------------
         ALLOWED ATTEMPTS
      --------------------------------------------------- */

      if (
        body.allowedAttempts !==
        undefined
      ) {
        const allowedAttempts =
          Number(
            body.allowedAttempts
          );

        if (
          !Number.isInteger(
            allowedAttempts
          ) ||
          allowedAttempts < 1 ||
          allowedAttempts > 10
        ) {
          return res.status(400).json({
            message:
              "Allowed attempts must be between 1 and 10",
          });
        }

        exam.allowedAttempts =
          allowedAttempts;
      }

      /* ---------------------------------------------------
         SHUFFLE
      --------------------------------------------------- */

      if (
        body.shuffleQuestions !==
        undefined
      ) {
        exam.shuffleQuestions =
          parseBoolean(
            body.shuffleQuestions,
            false
          );
      }

      if (
        body.shuffleOptions !==
        undefined
      ) {
        exam.shuffleOptions =
          parseBoolean(
            body.shuffleOptions,
            false
          );
      }

      /* ---------------------------------------------------
         PUBLISHED
      --------------------------------------------------- */

      if (
        body.published !== undefined
      ) {
        exam.published =
          parseBoolean(
            body.published,
            false
          );
      }

      /* ---------------------------------------------------
         INSTRUCTIONS
      --------------------------------------------------- */

      if (
        body.instructions !==
        undefined
      ) {
        exam.instructions =
          normalizeInstructions(
            body.instructions
          );
      }

      /* ---------------------------------------------------
         DATES
      --------------------------------------------------- */

      if (
        body.startDate !==
        undefined
      ) {
        if (body.startDate) {
          const startDate =
            new Date(
              body.startDate
            );

          if (
            Number.isNaN(
              startDate.getTime()
            )
          ) {
            return res.status(400).json({
              message:
                "Invalid start date",
            });
          }

          exam.startDate =
            startDate;
        } else {
          exam.startDate =
            undefined;
        }
      }

      if (
        body.endDate !==
        undefined
      ) {
        if (body.endDate) {
          const endDate =
            new Date(
              body.endDate
            );

          if (
            Number.isNaN(
              endDate.getTime()
            )
          ) {
            return res.status(400).json({
              message:
                "Invalid end date",
            });
          }

          exam.endDate =
            endDate;
        } else {
          exam.endDate =
            undefined;
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

      if (
        exam.passingMarks >
        exam.totalMarks
      ) {
        return res.status(400).json({
          message:
            "Passing marks cannot exceed total marks",
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
        "Update exam error:",
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
      if (!requireInstructorAccess(req)) {
        return res.status(403).json({
          message:
            "Instructor access required",
        });
      }

      const examId = getExamId(
        req.params.examId
      );

      if (!isValidObjectId(examId)) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      const exam =
        await Exam.findById(examId);

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      if (
        exam.createdBy?.toString() !==
        req.user?.userId
      ) {
        return res.status(403).json({
          message:
            "You are not allowed to delete this exam",
        });
      }

      /*
       * Delete associated questions.
       */
      await Question.deleteMany({
        examId:
          new mongoose.Types.ObjectId(
            examId
          ),
      });

      /*
       * Delete associated attempts.
       */
      await Attempt.deleteMany({
        examId:
          new mongoose.Types.ObjectId(
            examId
          ),
      });

      await Exam.findByIdAndDelete(
        examId
      );

      return res.status(200).json({
        message:
          "Exam deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete exam error:",
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
   START EXAM
   POST /api/exams/:examId/start
========================================================= */

router.post(
  "/:examId/start",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!requireStudentAccess(req)) {
        return res.status(403).json({
          message:
            "Only students can start an exam",
        });
      }

      const examId = getExamId(
        req.params.examId
      );

      if (!isValidObjectId(examId)) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      /*
       * IMPORTANT:
       * Never trust studentId from req.body.
       * The authenticated user ID is the student.
       */
      const studentId =
        req.user?.userId;

      if (
        !studentId ||
        !isValidObjectId(studentId)
      ) {
        return res.status(401).json({
          message:
            "Invalid student authentication",
        });
      }

      /* ---------------------------------------------------
         FIND PUBLISHED EXAM
      --------------------------------------------------- */

      const exam =
        await Exam.findOne({
          _id:
            new mongoose.Types.ObjectId(
              examId
            ),
          published: true,
        });

      if (!exam) {
        return res.status(404).json({
          message:
            "Published exam not found",
        });
      }

      /* ---------------------------------------------------
         FIND STUDENT
      --------------------------------------------------- */

      const student =
        await User.findById(
          studentId
        ).select(
          "_id role degree yearOfStudy semester isActive"
        );

      if (!student) {
        return res.status(401).json({
          message:
            "Student account not found",
        });
      }

      if (
        student.role !== "student"
      ) {
        return res.status(403).json({
          message:
            "Only student accounts can start exams",
        });
      }

      if (!student.isActive) {
        return res.status(403).json({
          message:
            "Your account has been disabled",
        });
      }

      /* ---------------------------------------------------
         DEGREE ELIGIBILITY
      --------------------------------------------------- */

      if (exam.degree) {
        if (!student.degree) {
          return res.status(403).json({
            message:
              "Your academic profile is incomplete. Please contact your instructor.",
          });
        }

        if (
          exam.degree !==
          student.degree
        ) {
          return res.status(403).json({
            message:
              "You are not eligible for this exam",
          });
        }
      }

      /* ---------------------------------------------------
         YEAR ELIGIBILITY
      --------------------------------------------------- */

      if (
        exam.yearOfStudy !==
        undefined &&
        exam.yearOfStudy !==
        null
      ) {
        if (!student.yearOfStudy) {
          return res.status(403).json({
            message:
              "Your year of study is not configured. Please contact your instructor.",
          });
        }

        if (
          exam.yearOfStudy !==
          student.yearOfStudy
        ) {
          return res.status(403).json({
            message:
              "This exam is not assigned to your year",
          });
        }
      }

      /* ---------------------------------------------------
         SEMESTER ELIGIBILITY
      --------------------------------------------------- */

      if (
        exam.semester !==
        undefined &&
        exam.semester !==
        null
      ) {
        if (!student.semester) {
          return res.status(403).json({
            message:
              "Your semester is not configured. Please contact your instructor.",
          });
        }

        if (
          exam.semester !==
          student.semester
        ) {
          return res.status(403).json({
            message:
              "This exam is not assigned to your semester",
          });
        }
      }

      /* ---------------------------------------------------
         DATE VALIDATION
      --------------------------------------------------- */

      const now = new Date();

      if (
        exam.startDate &&
        now < new Date(exam.startDate)
      ) {
        return res.status(403).json({
          message:
            "This exam has not started yet",
        });
      }

      if (
        exam.endDate &&
        now > new Date(exam.endDate)
      ) {
        return res.status(403).json({
          message:
            "This exam has ended",
        });
      }

      /* ---------------------------------------------------
         ATTEMPT LIMIT
      --------------------------------------------------- */

      const allowedAttempts =
        Math.max(
          1,
          Number(
            exam.allowedAttempts ?? 1
          )
        );

      const studentObjectId =
        new mongoose.Types.ObjectId(
          studentId
        );

      const examObjectId =
        new mongoose.Types.ObjectId(
          examId
        );

      /*
       * Existing attempts belong only to the
       * authenticated student.
       */
      const existingAttempts =
        await Attempt.find({
          studentId:
            studentObjectId,
          examId:
            examObjectId,
        })
          .sort({
            createdAt: 1,
          })
          .lean();

      /*
       * If an unfinished attempt already exists,
       * resume it instead of creating another one.
       *
       * This is especially useful if the student
       * refreshes or closes the browser.
       */
      const activeAttempt =
        existingAttempts.find(
          (attempt) =>
            attempt.status ===
            "IN_PROGRESS"
        );

      if (activeAttempt) {
        const activeEndTime =
          activeAttempt.endTime
            ? new Date(
                activeAttempt.endTime
              )
            : null;

        /*
         * If the active attempt has already expired,
         * close it here.
         */
        if (
          activeEndTime &&
          activeEndTime <= now
        ) {
          activeAttempt.status =
            "TIMED_OUT";

          await Attempt.updateOne(
            {
              _id: activeAttempt._id,
              status: "IN_PROGRESS",
            },
            {
              $set: {
                status: "TIMED_OUT",
                submittedAt: now,
              },
            }
          );
        } else {
          return res.status(200).json({
            message:
              "Existing exam attempt resumed",
            attemptId:
              activeAttempt._id.toString(),
            startTime:
              activeAttempt.startTime,
            endTime:
              activeAttempt.endTime,
            duration:
              exam.duration,
            questionCount:
              activeAttempt.questionIds
                .length,
            resumed: true,
          });
        }
      }

      /*
       * Recalculate attempts after possible timeout.
       */
      const currentAttempts =
        await Attempt.countDocuments({
          studentId:
            studentObjectId,
          examId:
            examObjectId,
          status: {
            $in: [
              "IN_PROGRESS",
              "SUBMITTED",
              "EVALUATED",
              "TIMED_OUT",
            ],
          },
        });

      if (
        currentAttempts >=
        allowedAttempts
      ) {
        return res.status(409).json({
          message:
            `You have already used all ${allowedAttempts} attempt${
              allowedAttempts === 1
                ? ""
                : "s"
            } for this exam`,
          attemptsUsed:
            currentAttempts,
          allowedAttempts,
        });
      }

      /* ---------------------------------------------------
         QUESTION COUNT
      --------------------------------------------------- */

      const questionCount =
        Math.max(
          1,
          Number(exam.questionCount)
        );

      /* ---------------------------------------------------
         FIND AVAILABLE QUESTIONS
      --------------------------------------------------- */

      const availableQuestionCount =
        await Question.countDocuments({
          examId: examObjectId,
        });

      if (
        availableQuestionCount <
        questionCount
      ) {
        return res.status(400).json({
          message:
            `This exam requires ${questionCount} questions, but only ${availableQuestionCount} are available in the question bank.`,
        });
      }

      /* ---------------------------------------------------
         SELECT FIXED QUESTION SET
      --------------------------------------------------- */

      let questions:
        QuestionIdDocument[];

      if (exam.shuffleQuestions) {
        const randomQuestions =
          await Question.aggregate([
            {
              $match: {
                examId:
                  examObjectId,
              },
            },
            {
              $sample: {
                size: questionCount,
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ]);

        questions =
          randomQuestions as QuestionIdDocument[];
      } else {
        const orderedQuestions =
          await Question.find({
            examId:
              examObjectId,
          })
            .select("_id")
            .sort({
              order: 1,
              createdAt: 1,
            })
            .limit(questionCount)
            .lean();

        questions =
          orderedQuestions as QuestionIdDocument[];
      }

      if (
        questions.length <
        questionCount
      ) {
        return res.status(400).json({
          message:
            `This exam requires ${questionCount} questions, but only ${questions.length} are available in the question bank.`,
        });
      }

      /* ---------------------------------------------------
         SERVER-SIDE TIMER
      --------------------------------------------------- */

      const startTime = new Date();

      const endTime = new Date(
        startTime.getTime() +
          Number(exam.duration) *
            60 *
            1000
      );

      /* ---------------------------------------------------
         FIXED QUESTION SET
      --------------------------------------------------- */

      const questionIds =
        questions.map(
          (question) => question._id
        );

      /* ---------------------------------------------------
         CREATE ATTEMPT
      --------------------------------------------------- */

      const attempt =
        await Attempt.create({
          studentId:
            studentObjectId,

          examId:
            examObjectId,

          questionIds,

          answers: {},

          startTime,

          endTime,

          status: "IN_PROGRESS",

          tabSwitchCount: 0,
        });

      /* ---------------------------------------------------
         RESPONSE
      --------------------------------------------------- */

      return res.status(201).json({
        message:
          "Exam started successfully",

        attemptId:
          attempt._id.toString(),

        startTime,

        endTime,

        duration:
          exam.duration,

        questionCount:
          questionIds.length,

        resumed: false,
      });
    } catch (error) {
      console.error(
        "Start exam error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to start exam",
      });
    }
  }
);

/* =========================================================
   EXPORT
========================================================= */

export default router;
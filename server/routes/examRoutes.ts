import express, {
  Request,
  Response,
} from "express";

import mongoose from "mongoose";

import Exam from "../models/Exam";
import Question from "../models/Question";
import Attempt from "../models/Attempt";
import User from "../models/User";

const router = express.Router();

// ======================================================
// TYPES
// ======================================================

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

  allowedAttempts?: number | string;

  negativeMarking?: boolean;
  negativePenalty?: number | string;

  instructions?: string | string[];

  published?: boolean;

  // FIX:
  // createdBy was missing from this interface.
  createdBy?: string;
}

interface StudentExamQuery {
  studentId?: string;
}

// ======================================================
// HELPERS
// ======================================================

const isValidObjectId = (
  value: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

// ======================================================
// NORMALIZE INSTRUCTIONS
// ======================================================

const toInstructionArray = (
  value: unknown
): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map((item) =>
        item.trim()
      )
      .filter(
        (item) => item.length > 0
      );
  }

  if (
    typeof value === "string"
  ) {
    return value
      .split(/\r?\n/)
      .map((item) =>
        item.trim()
      )
      .filter(
        (item) => item.length > 0
      );
  }

  return [];
};

// ======================================================
// GET PUBLISHED EXAMS
// ======================================================

router.get(
  "/published",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const exams =
        await Exam.find({
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
              "instructions",
              "published",
              "startDate",
              "endDate",
              "createdBy",
              "createdAt",
              "updatedAt",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json(
        exams
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

// ======================================================
// GET ALL EXAMS
// ======================================================
//
// GET /api/exams
//
// Used by instructor dashboard.
//
// ======================================================

router.get(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const instructorId =
        req.query.createdBy as
          | string
          | undefined;

      const filter: Record<
        string,
        unknown
      > = {};

      if (
        instructorId &&
        isValidObjectId(
          instructorId
        )
      ) {
        filter.createdBy =
          instructorId;
      }

      const exams =
        await Exam.find(
          filter
        )
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
              "allowedAttempts",
              "negativeMarking",
              "negativePenalty",
              "instructions",
              "published",
              "startDate",
              "endDate",
              "createdBy",
              "createdAt",
              "updatedAt",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json(
        exams
      );
    } catch (error) {
      console.error(
        "Error fetching exams:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch exams",
      });
    }
  }
);

// ======================================================
// CREATE EXAM
// ======================================================
//
// POST /api/exams
//
// ======================================================

router.post(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const body =
        req.body as CreateExamBody;

      // --------------------------------------------------
      // Basic values
      // --------------------------------------------------

      const title =
        typeof body.title ===
        "string"
          ? body.title.trim()
          : "";

      const subject =
        typeof body.subject ===
        "string"
          ? body.subject.trim()
          : "";

      const degree =
        typeof body.degree ===
        "string"
          ? body.degree
              .trim()
              .toUpperCase()
          : "BCA";

      // --------------------------------------------------
      // Numbers
      // --------------------------------------------------

      const yearOfStudy =
        Number(
          body.yearOfStudy
        );

      const semester =
        Number(
          body.semester
        );

      const duration =
        Number(
          body.duration
        );

      const questionCount =
        Number(
          body.questionCount
        );

      const totalMarks =
        Number(
          body.totalMarks
        );

      const passingMarks =
        Number(
          body.passingMarks
        );

      const allowedAttempts =
        Number(
          body.allowedAttempts ??
            2
        );

      const negativePenalty =
        Number(
          body.negativePenalty ??
            0
        );

      // --------------------------------------------------
      // Boolean
      // --------------------------------------------------

      const negativeMarking =
        body.negativeMarking ===
        true;

      const published =
        body.published ===
        true;

      // --------------------------------------------------
      // Instructions
      // --------------------------------------------------

      const instructions: string[] =
        toInstructionArray(
          body.instructions
        );

      // --------------------------------------------------
      // Validate title
      // --------------------------------------------------

      if (!title) {
        return res.status(400).json({
          message:
            "Exam title is required",
        });
      }

      if (
        title.length > 200
      ) {
        return res.status(400).json({
          message:
            "Exam title cannot exceed 200 characters",
        });
      }

      // --------------------------------------------------
      // Validate subject
      // --------------------------------------------------

      if (!subject) {
        return res.status(400).json({
          message:
            "Subject is required",
        });
      }

      // --------------------------------------------------
      // Validate degree
      // --------------------------------------------------

      if (
        degree !== "BCA"
      ) {
        return res.status(400).json({
          message:
            "ExamForge currently supports BCA examinations only",
        });
      }

      // --------------------------------------------------
      // Validate year
      // --------------------------------------------------

      if (
        !Number.isInteger(
          yearOfStudy
        ) ||
        yearOfStudy < 1 ||
        yearOfStudy > 3
      ) {
        return res.status(400).json({
          message:
            "Year of study must be 1, 2, or 3",
        });
      }

      // --------------------------------------------------
      // Validate semester
      // --------------------------------------------------

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

      // --------------------------------------------------
      // Validate duration
      // --------------------------------------------------

      if (
        !Number.isFinite(
          duration
        ) ||
        duration <= 0
      ) {
        return res.status(400).json({
          message:
            "Duration must be greater than 0",
        });
      }

      // --------------------------------------------------
      // Validate question count
      // --------------------------------------------------

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

      // --------------------------------------------------
      // Validate total marks
      // --------------------------------------------------

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

      // --------------------------------------------------
      // Validate passing marks
      // --------------------------------------------------

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

      if (
        passingMarks >
        totalMarks
      ) {
        return res.status(400).json({
          message:
            "Passing marks cannot exceed total marks",
        });
      }

      // --------------------------------------------------
      // Validate attempts
      // --------------------------------------------------

      if (
        !Number.isInteger(
          allowedAttempts
        ) ||
        allowedAttempts < 1 ||
        allowedAttempts > 3
      ) {
        return res.status(400).json({
          message:
            "Allowed attempts must be between 1 and 3",
        });
      }

      // --------------------------------------------------
      // Validate negative marking
      // --------------------------------------------------

      if (
        negativeMarking &&
        (
          !Number.isFinite(
            negativePenalty
          ) ||
          negativePenalty <= 0
        )
      ) {
        return res.status(400).json({
          message:
            "Negative marking penalty must be greater than 0",
        });
      }

      // --------------------------------------------------
      // Validate createdBy
      // --------------------------------------------------

      if (
        !body.createdBy
      ) {
        return res.status(400).json({
          message:
            "Instructor ID is required",
        });
      }

      if (
        !isValidObjectId(
          body.createdBy
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid instructor ID",
        });
      }

      // --------------------------------------------------
      // Verify instructor
      // --------------------------------------------------

      const instructor =
        await User.findOne({
          _id:
            body.createdBy,
          role:
            "instructor",
        }).select(
          "_id name email role isActive"
        );

      if (!instructor) {
        return res.status(403).json({
          message:
            "Only an instructor can create an exam",
        });
      }

      if (
        instructor.isActive ===
        false
      ) {
        return res.status(403).json({
          message:
            "Instructor account is inactive",
        });
      }

      // --------------------------------------------------
      // Create exam
      // --------------------------------------------------

      const exam =
        await Exam.create({
          title,

          subject,

          degree: "BCA",

          yearOfStudy,

          semester,

          duration,

          questionCount,

          totalMarks,

          passingMarks,

          negativeMarking,

          negativePenalty:
            negativeMarking
              ? negativePenalty
              : 0,

          instructions,

          published,

          allowedAttempts,

          shuffleQuestions:
            false,

          shuffleOptions:
            false,

          createdBy:
            new mongoose.Types.ObjectId(
              body.createdBy
            ),
        });

      // --------------------------------------------------
      // Response
      // --------------------------------------------------

      return res.status(201).json({
        message:
          "Exam created successfully",

        exam: {
          _id:
            exam._id.toString(),

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

          allowedAttempts:
            exam.allowedAttempts,

          negativeMarking:
            exam.negativeMarking,

          negativePenalty:
            exam.negativePenalty,

          instructions:
            exam.instructions,

          published:
            exam.published,

          createdBy:
            exam.createdBy.toString(),

          createdAt:
            exam.createdAt,
        },
      });
    } catch (error: any) {
      console.error(
        "Error creating exam:",
        error
      );

      if (
        error?.name ===
        "ValidationError"
      ) {
        const messages =
          Object.values(
            error.errors || {}
          ).map(
            (item: any) =>
              String(
                item.message
              )
          );

        return res.status(400).json({
          message:
            messages.join(", ") ||
            "Invalid exam information",
        });
      }

      return res.status(500).json({
        message:
          "Failed to create exam",
      });
    }
  }
);

// ======================================================
// GET SINGLE EXAM
// ======================================================
//
// GET /api/exams/:examId
//
// ======================================================

router.get(
  "/:examId",
  async (
    req: Request<{
      examId: string;
    }>,
    res: Response
  ) => {
    try {
      const {
        examId,
      } = req.params;

      if (
        !isValidObjectId(
          examId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      const exam =
        await Exam.findById(
          examId
        ).lean();

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      return res.status(200).json({
        ...exam,

        instructions:
          toInstructionArray(
            exam.instructions
          ),
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

// ======================================================
// START EXAM
// ======================================================
//
// POST /api/exams/:examId/start
//
// ======================================================

router.post(
  "/:examId/start",
  async (
    req: Request<{
      examId: string;
    }>,
    res: Response
  ) => {
    try {
      const {
        examId,
      } = req.params;

      const body =
        req.body as StudentExamQuery;

      const studentId =
        body.studentId;

      // --------------------------------------------------
      // Validate student
      // --------------------------------------------------

      if (!studentId) {
        return res.status(400).json({
          message:
            "Student ID is required",
        });
      }

      if (
        !isValidObjectId(
          studentId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid student ID",
        });
      }

      // --------------------------------------------------
      // Validate exam
      // --------------------------------------------------

      if (
        !isValidObjectId(
          examId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      // --------------------------------------------------
      // Find published exam
      // --------------------------------------------------

      const exam =
        await Exam.findOne({
          _id: examId,
          published: true,
        });

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found or not published",
        });
      }

      // --------------------------------------------------
      // Find student
      // --------------------------------------------------

      const student =
        await User.findById(
          studentId
        ).select(
          "_id name email role isActive degree yearOfStudy semester"
        );

      if (!student) {
        return res.status(404).json({
          message:
            "Student not found",
        });
      }

      // --------------------------------------------------
      // Student role
      // --------------------------------------------------

      if (
        student.role !==
        "student"
      ) {
        return res.status(403).json({
          message:
            "Only students can start an exam",
        });
      }

      // --------------------------------------------------
      // Active account
      // --------------------------------------------------

      if (
        student.isActive ===
        false
      ) {
        return res.status(403).json({
          message:
            "Your account is inactive",
        });
      }

      // --------------------------------------------------
      // Degree eligibility
      // --------------------------------------------------

      if (
        exam.degree &&
        student.degree &&
        exam.degree.toUpperCase() !==
          student.degree.toUpperCase()
      ) {
        return res.status(403).json({
          message:
            "You are not eligible for this exam",
        });
      }

      // --------------------------------------------------
      // Year eligibility
      // --------------------------------------------------

      if (
        exam.yearOfStudy &&
        student.yearOfStudy &&
        exam.yearOfStudy !==
          student.yearOfStudy
      ) {
        return res.status(403).json({
          message:
            "This exam is not assigned to your year",
        });
      }

      // --------------------------------------------------
      // Semester eligibility
      // --------------------------------------------------

      if (
        exam.semester &&
        student.semester &&
        exam.semester !==
          student.semester
      ) {
        return res.status(403).json({
          message:
            "This exam is not assigned to your semester",
        });
      }

      // --------------------------------------------------
      // Exam schedule
      // --------------------------------------------------

      const now =
        new Date();

      if (
        exam.startDate &&
        now < exam.startDate
      ) {
        return res.status(403).json({
          message:
            "This exam has not started yet",
        });
      }

      if (
        exam.endDate &&
        now > exam.endDate
      ) {
        return res.status(403).json({
          message:
            "This exam is no longer available",
        });
      }

      // --------------------------------------------------
      // Attempt limit
      // --------------------------------------------------

      const allowedAttempts =
        Math.max(
          1,
          exam.allowedAttempts ||
            2
        );

      const attemptCount =
        await Attempt.countDocuments({
          studentId,
          examId:
            exam._id,
        });

      if (
        attemptCount >=
        allowedAttempts
      ) {
        return res.status(409).json({
          message:
            `You have already used all ${allowedAttempts} attempts for this exam`,

          attemptsUsed:
            attemptCount,

          allowedAttempts,
        });
      }

      // --------------------------------------------------
      // Random question selection
      // --------------------------------------------------

      const questions =
        await Question.aggregate([
          {
            $match: {
              examId:
                exam._id,
            },
          },

          {
            $sample: {
              size:
                exam.questionCount,
            },
          },

          {
            $project: {
              _id: 1,
            },
          },
        ]);

      // --------------------------------------------------
      // Check question bank
      // --------------------------------------------------

      if (
        questions.length <
        exam.questionCount
      ) {
        return res.status(400).json({
          message:
            `Not enough questions available. Required: ${exam.questionCount}, Available: ${questions.length}`,
        });
      }

      // --------------------------------------------------
      // Store fixed question IDs
      // --------------------------------------------------

      const questionIds =
        questions.map(
          (
            question: {
              _id: mongoose.Types.ObjectId;
            }
          ) =>
            question._id
        );

      // --------------------------------------------------
      // Server-side timer
      // --------------------------------------------------

      const startTime =
        new Date();

      const endTime =
        new Date(
          startTime.getTime() +
            exam.duration *
              60 *
              1000
        );

      // --------------------------------------------------
      // Create attempt
      // --------------------------------------------------

      const attempt =
        await Attempt.create({
          studentId,

          examId:
            exam._id,

          questionIds,

          answers: {},

          startTime,

          endTime,

          status:
            "IN_PROGRESS",
        });

      // --------------------------------------------------
      // Response
      // --------------------------------------------------

      return res.status(201).json({
        message:
          "Exam started successfully",

        attempt,

        attemptsUsed:
          attemptCount + 1,

        allowedAttempts,

        attemptsRemaining:
          Math.max(
            0,
            allowedAttempts -
              (attemptCount + 1)
          ),
      });
    } catch (error: any) {
      console.error(
        "Error starting exam:",
        error
      );

      if (
        error?.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          message:
            "Invalid exam or student information",
        });
      }

      return res.status(500).json({
        message:
          "Failed to start exam",
      });
    }
  }
);

// ======================================================
// GET EXAM RESULTS
// ======================================================
//
// GET /api/exams/:examId/results
//
// ======================================================

router.get(
  "/:examId/results",
  async (
    req: Request<{
      examId: string;
    }>,
    res: Response
  ) => {
    try {
      const {
        examId,
      } = req.params;

      if (
        !isValidObjectId(
          examId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      const exam =
        await Exam.findById(
          examId
        ).lean();

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found",
        });
      }

      const attempts =
        await Attempt.find({
          examId:
            exam._id,
        })
          .populate(
            "studentId",
            "name email degree yearOfStudy semester studentId"
          )
          .sort({
            submittedAt: -1,
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
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

          totalMarks:
            exam.totalMarks,

          passingMarks:
            exam.passingMarks,
        },

        attempts,
      });
    } catch (error) {
      console.error(
        "Error fetching exam results:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch exam results",
      });
    }
  }
);

// ======================================================
// GET EXAM ATTEMPTS
// ======================================================
//
// GET /api/exams/:examId/attempts
//
// ======================================================

router.get(
  "/:examId/attempts",
  async (
    req: Request<{
      examId: string;
    }>,
    res: Response
  ) => {
    try {
      const {
        examId,
      } = req.params;

      if (
        !isValidObjectId(
          examId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid exam ID",
        });
      }

      const attempts =
        await Attempt.find({
          examId:
            new mongoose.Types.ObjectId(
              examId
            ),
        })
          .populate(
            "studentId",
            [
              "name",
              "email",
              "degree",
              "yearOfStudy",
              "semester",
              "studentId",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json(
        attempts
      );
    } catch (error) {
      console.error(
        "Error fetching attempts:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch attempts",
      });
    }
  }
);

// ======================================================
// DELETE DRAFT EXAM
// ======================================================
//
// DELETE /api/exams/:examId
//
// Published exams cannot be deleted.
//
// ======================================================

router.delete(
  "/:examId",
  async (
    req: Request<{
      examId: string;
    }>,
    res: Response
  ) => {
    try {
      const {
        examId,
      } = req.params;

      if (
        !isValidObjectId(
          examId
        )
      ) {
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
        exam.published
      ) {
        return res.status(400).json({
          message:
            "Published exams cannot be deleted",
        });
      }

      await Question.deleteMany({
        examId:
          exam._id,
      });

      await Exam.deleteOne({
        _id:
          exam._id,
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

// ======================================================
// EXPORT
// ======================================================

export default router;
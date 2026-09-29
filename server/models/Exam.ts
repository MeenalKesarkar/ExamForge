import mongoose, {
  Document,
  Schema,
} from "mongoose";

/* =========================================================
   TYPES
========================================================= */

export interface IExam extends Document {
  title: string;
  subject?: string;

  degree?: string;
  yearOfStudy?: number;
  semester?: number;

  duration: number;
  questionCount: number;

  totalMarks: number;
  passingMarks: number;

  negativeMarking: boolean;
  negativePenalty: number;

  allowedAttempts: number;

  startDate?: Date;
  endDate?: Date;

  instructions: string[];

  shuffleQuestions: boolean;
  shuffleOptions: boolean;

  published: boolean;

  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   SCHEMA
========================================================= */

const examSchema =
  new Schema<IExam>(
    {
      /* =====================================================
         BASIC INFORMATION
      ===================================================== */

      title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200,
      },

      subject: {
        type: String,
        trim: true,
        maxlength: 150,
        default: "",
      },

      /* =====================================================
         ACADEMIC TARGETING
      ===================================================== */

      degree: {
        type: String,
        trim: true,
        default: "BCA",
      },

      yearOfStudy: {
        type: Number,
        min: 1,
        max: 3,
        required: false,
      },

      semester: {
        type: Number,
        min: 1,
        max: 6,
        required: false,
      },

      /* =====================================================
         EXAM CONFIGURATION
      ===================================================== */

      duration: {
        type: Number,
        required: true,
        min: 1,
      },

      questionCount: {
        type: Number,
        required: true,
        min: 1,
      },

      totalMarks: {
        type: Number,
        required: true,
        min: 0,
      },

      passingMarks: {
        type: Number,
        required: true,
        min: 0,
      },

      /* =====================================================
         NEGATIVE MARKING
      ===================================================== */

      negativeMarking: {
        type: Boolean,
        default: false,
      },

      negativePenalty: {
        type: Number,
        default: 0,
        min: 0,
      },

      /* =====================================================
         ATTEMPTS
      ===================================================== */

      allowedAttempts: {
        type: Number,
        default: 1,
        min: 1,
        max: 10,
      },

      /* =====================================================
         AVAILABILITY
      ===================================================== */

      startDate: {
        type: Date,
        required: false,
      },

      endDate: {
        type: Date,
        required: false,
      },

      /* =====================================================
         INSTRUCTIONS
      ===================================================== */

      instructions: {
        type: [String],
        default: [],
      },

      /* =====================================================
         SHUFFLING
      ===================================================== */

      shuffleQuestions: {
        type: Boolean,
        default: false,
      },

      shuffleOptions: {
        type: Boolean,
        default: false,
      },

      /* =====================================================
         PUBLISH STATUS
      ===================================================== */

      published: {
        type: Boolean,
        default: false,
        index: true,
      },

      /* =====================================================
         INSTRUCTOR
      ===================================================== */

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    },
    {
      collection: "exams",
      timestamps: true,
    }
  );

/* =========================================================
   INDEXES
========================================================= */

/*
 * Instructor's exams.
 */
examSchema.index({
  createdBy: 1,
  createdAt: -1,
});

/*
 * Published exams filtered by academic structure.
 */
examSchema.index({
  published: 1,
  degree: 1,
  yearOfStudy: 1,
  semester: 1,
});

/*
 * Exam availability.
 */
examSchema.index({
  startDate: 1,
  endDate: 1,
});

/* =========================================================
   MODEL
========================================================= */

const Exam =
  mongoose.models.Exam ||
  mongoose.model<IExam>(
    "Exam",
    examSchema
  );

export default Exam;
import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ======================================================
// EXAM INTERFACE
// ======================================================

export interface IExam
  extends Document {
  title: string;

  // Academic assignment
  subject: string;
  degree: string;
  yearOfStudy: number;
  semester: number;

  // Exam configuration
  duration: number;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;

  // Negative marking
  negativeMarking: boolean;
  negativePenalty: number;

  // Instructions
  instructions: string[];

  // Publishing
  published: boolean;

  // Attempts
  allowedAttempts: number;

  // Optional scheduling
  startDate?: Date | null;
  endDate?: Date | null;

  // Question behavior
  shuffleQuestions: boolean;
  shuffleOptions: boolean;

  // Instructor
  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// ======================================================
// EXAM SCHEMA
// ======================================================

const examSchema =
  new Schema<IExam>(
    {
      // --------------------------------------------------
      // BASIC INFORMATION
      // --------------------------------------------------

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      // --------------------------------------------------
      // ACADEMIC INFORMATION
      // --------------------------------------------------

      degree: {
        type: String,
        required: true,
        default: "BCA",
        trim: true,
        uppercase: true,
      },

      yearOfStudy: {
        type: Number,
        required: true,
        min: 1,
        max: 3,
      },

      semester: {
        type: Number,
        required: true,
        min: 1,
        max: 6,
      },

      // --------------------------------------------------
      // EXAM CONFIGURATION
      // --------------------------------------------------

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
        min: 1,
      },

      passingMarks: {
        type: Number,
        required: true,
        min: 0,
      },

      // --------------------------------------------------
      // NEGATIVE MARKING
      // --------------------------------------------------

      negativeMarking: {
        type: Boolean,
        default: false,
      },

      negativePenalty: {
        type: Number,
        default: 0,
        min: 0,
      },

      // --------------------------------------------------
      // INSTRUCTIONS
      // --------------------------------------------------

      instructions: {
        type: [String],
        default: [],
      },

      // --------------------------------------------------
      // PUBLISHING
      // --------------------------------------------------

      published: {
        type: Boolean,
        default: false,
        index: true,
      },

      // --------------------------------------------------
      // ATTEMPTS
      // --------------------------------------------------

      allowedAttempts: {
        type: Number,
        default: 2,
        min: 1,
        max: 3,
      },

      // --------------------------------------------------
      // OPTIONAL EXAM SCHEDULE
      // --------------------------------------------------

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      // --------------------------------------------------
      // QUESTION RANDOMIZATION
      // --------------------------------------------------

      shuffleQuestions: {
        type: Boolean,
        default: false,
      },

      shuffleOptions: {
        type: Boolean,
        default: false,
      },

      // --------------------------------------------------
      // INSTRUCTOR
      // --------------------------------------------------

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

// ======================================================
// INDEXES
// ======================================================

examSchema.index({
  published: 1,
  degree: 1,
  yearOfStudy: 1,
  semester: 1,
});

examSchema.index({
  createdBy: 1,
  createdAt: -1,
});

// ======================================================
// MODEL
// ======================================================

const Exam =
  mongoose.model<IExam>(
    "Exam",
    examSchema
  );

export default Exam;
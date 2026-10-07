import mongoose, {
  Document,
  Schema,
} from "mongoose";

/* =========================================================
   TYPES
========================================================= */

export type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EVALUATED"
  | "TIMED_OUT";

export interface IAttempt
  extends Document {
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  attemptKey?: string;

  /*
   * The exact questions selected when the
   * attempt starts.
   *
   * These must never be regenerated on refresh.
   */
  questionIds: mongoose.Types.ObjectId[];

  /*
   * Stored progressively as the student answers.
   *
   * Example:
   *
   * {
   *   "questionId1": ["JavaScript"],
   *   "questionId2": ["A", "C"]
   * }
   */
  answers: Record<
    string,
    string[]
  >;

  /*
   * Server-owned timer.
   */
  startTime: Date;
  endTime: Date;
  remainingSeconds?: number;
  timerPaused?: boolean;
  lastHeartbeatAt?: Date | null;

  submittedAt:
    | Date
    | null;

  status: AttemptStatus;
  submissionReason?: "SECURITY_VIOLATION" | "TIME_EXPIRED" | "STUDENT_SUBMITTED";

  /*
   * Final calculated result.
   */
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;

  /*
   * Optional lightweight anti-cheating
   * tab-switch counter.
   */
  tabSwitchCount: number;
  proctoringDisqualified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   SCHEMA
========================================================= */

const attemptSchema =
  new Schema<IAttempt>(
    {
      /* ---------------------------------------------------
         STUDENT
      --------------------------------------------------- */

      studentId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /* ---------------------------------------------------
         EXAM
      --------------------------------------------------- */

      examId: {
        type: Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
        index: true,
      },

      attemptKey: {
        type: String,
        required: false,
      },

      /* ---------------------------------------------------
         FIXED QUESTION SET
      --------------------------------------------------- */

      questionIds: {
        type: [
          {
            type: Schema.Types.ObjectId,
            ref: "Question",
          },
        ],
        required: true,
        default: [],
      },

      /* ---------------------------------------------------
         ANSWERS
      --------------------------------------------------- */

      answers: {
        type: Schema.Types.Mixed,
        default: {},
      },

      /* ---------------------------------------------------
         SERVER TIMER
      --------------------------------------------------- */

      startTime: {
        type: Date,
        required: true,
      },

      endTime: {
        type: Date,
        required: true,
      },

      remainingSeconds: {
        type: Number,
        min: 0,
      },

      timerPaused: {
        type: Boolean,
        default: false,
      },

      lastHeartbeatAt: {
        type: Date,
        default: null,
      },

      /* ---------------------------------------------------
         SUBMISSION
      --------------------------------------------------- */

      submittedAt: {
        type: Date,
        default: null,
      },

      /* ---------------------------------------------------
         STATUS
      --------------------------------------------------- */

      status: {
        type: String,
        enum: [
          "IN_PROGRESS",
          "SUBMITTED",
          "EVALUATED",
          "TIMED_OUT",
        ],
        required: true,
        default: "IN_PROGRESS",
        index: true,
      },

      submissionReason: {
        type: String,
        enum: [
          "SECURITY_VIOLATION",
          "TIME_EXPIRED",
          "STUDENT_SUBMITTED",
        ],
        default: undefined,
      },

      /* ---------------------------------------------------
         RESULT
      --------------------------------------------------- */

      score: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalMarks: {
        type: Number,
        default: 0,
        min: 0,
      },

      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      passed: {
        type: Boolean,
        default: false,
      },

      /* ---------------------------------------------------
         TAB SWITCH COUNT
      --------------------------------------------------- */

      tabSwitchCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      proctoringDisqualified: {
        type: Boolean,
        default: false,
      },
    },

    {
      collection: "attempts",
      timestamps: true,
    }
  );

/* =========================================================
   INDEXES
========================================================= */

/*
 * Used for:
 *
 * - finding a student's attempts for an exam
 * - checking allowed attempts
 * - resuming an existing attempt
 */
attemptSchema.index({
  studentId: 1,
  examId: 1,
});

attemptSchema.index(
  { attemptKey: 1 },
  { unique: true, sparse: true }
);

/*
 * Useful for instructor result pages.
 */
attemptSchema.index({
  examId: 1,
  status: 1,
});

/*
 * Useful for student history.
 */
attemptSchema.index({
  studentId: 1,
  submittedAt: -1,
});

/* =========================================================
   MODEL
========================================================= */

const Attempt =
  mongoose.models.Attempt ||
  mongoose.model<IAttempt>(
    "Attempt",
    attemptSchema
  );

export default Attempt;

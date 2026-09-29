import mongoose, { Schema, Document } from "mongoose";

export interface IAttempt extends Document {
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  questionIds: mongoose.Types.ObjectId[];
  answers: Record<string, string[]>;
  startTime: Date;
  endTime: Date | null;
  submittedAt: Date | null;
  status:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "EVALUATED"
    | "TIMED_OUT";
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  tabSwitchCount: number;
  violations: {
    event:
      | "TAB_SWITCH"
      | "WINDOW_BLUR"
      | "FULLSCREEN_EXIT"
      | "COPY_PASTE_ATTEMPT";
    timestamp: Date;
  }[];
}

const attemptSchema = new Schema<IAttempt>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "Student reference (studentId) is required",
      ],
      index: true,
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [
        true,
        "Exam reference (examId) is required",
      ],
      index: true,
    },

    questionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    answers: {
      type: Schema.Types.Mixed,
      default: {},
    },

    startTime: {
      type: Date,
      default: Date.now,
    },

    endTime: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "IN_PROGRESS",
        "SUBMITTED",
        "EVALUATED",
        "TIMED_OUT",
      ],
      default: "IN_PROGRESS",
      index: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
    },

    percentage: {
      type: Number,
      default: 0,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    tabSwitchCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    violations: [
      {
        event: {
          type: String,
          enum: [
            "TAB_SWITCH",
            "WINDOW_BLUR",
            "FULLSCREEN_EXIT",
            "COPY_PASTE_ATTEMPT",
          ],
        },

        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    collection: "attempts",
    timestamps: true,
  }
);

// Allows multiple attempts for the same student/exam.
attemptSchema.index({
  studentId: 1,
  examId: 1,
});

attemptSchema.index({
  examId: 1,
  status: 1,
});

attemptSchema.index({
  studentId: 1,
  submittedAt: -1,
});

const Attempt = mongoose.model<IAttempt>(
  "Attempt",
  attemptSchema
);

export default Attempt;
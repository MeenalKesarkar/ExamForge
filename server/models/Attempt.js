const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference (studentId) is required"],
      index: true,
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam reference (examId) is required"],
      index: true,
    },

    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    // Flexible map storing { [questionId]: ["selectedOption"] }
    answers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    startTime: {
      type: Date,
      default: Date.now,
    },

    // Projected deadline based on exam duration
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
      enum: {
        values: ["IN_PROGRESS", "SUBMITTED", "EVALUATED", "TIMED_OUT"],
        message: "Status must be IN_PROGRESS, SUBMITTED, EVALUATED, or TIMED_OUT",
      },
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

    // Anti-cheat / Proctoring telemetry
    tabSwitchCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    violations: [
      {
        event: {
          type: String,
          enum: ["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT", "COPY_PASTE_ATTEMPT"],
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

// High performance compound indexes
attemptSchema.index({ studentId: 1, examId: 1 });
attemptSchema.index({ examId: 1, status: 1 });

const Attempt = mongoose.model("Attempt", attemptSchema);

module.exports = Attempt;

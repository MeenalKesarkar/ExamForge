const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    duration: {
      type: Number,
      required: [true, "Exam duration (in minutes) is required"],
      min: [1, "Duration must be at least 1 minute"],
    },

    questionCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    passingMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    negativeMarking: {
      type: Boolean,
      default: false,
    },

    negativePenalty: {
      type: Number,
      default: 0,
      min: 0,
    },

    published: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Exam creator (instructor) is required"],
    },

    category: {
      type: String,
      trim: true,
      default: "General",
    },

    instructions: {
      type: [String],
      default: [
        "Read each question carefully before answering.",
        "Do not switch tabs or minimize the window during the exam.",
        "Ensure stable internet connectivity throughout the test.",
      ],
    },

    shuffleQuestions: {
      type: Boolean,
      default: false,
    },

    shuffleOptions: {
      type: Boolean,
      default: false,
    },

    allowedAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "exams",
    timestamps: true,
  }
);

// High performance indexes
examSchema.index({ createdBy: 1, published: 1 });
examSchema.index({ published: 1, category: 1 });

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;

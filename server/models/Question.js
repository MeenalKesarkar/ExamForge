const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam reference (examId) is required"],
      index: true,
    },

    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: {
        values: ["single", "multi"],
        message: "Question type must be either 'single' or 'multi'",
      },
      default: "single",
    },

    options: {
      type: [String],
      required: [true, "Options are required"],
      validate: [
        (val) => Array.isArray(val) && val.length >= 2,
        "A question must have at least 2 options",
      ],
    },

    correctAnswers: {
      type: [String],
      required: [true, "Correct answer(s) required"],
      validate: [
        (val) => Array.isArray(val) && val.length >= 1,
        "A question must have at least 1 correct answer",
      ],
    },

    marks: {
      type: Number,
      default: 1,
      min: [0.5, "Marks must be at least 0.5"],
    },

    explanation: {
      type: String,
      trim: true,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "questions",
    timestamps: true,
  }
);

// High performance compound index
questionSchema.index({ examId: 1, order: 1 });

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;

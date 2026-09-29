import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  examId: mongoose.Types.ObjectId;
  questionText: string;
  type: "single" | "multi";
  options: string[];
  correctAnswers: string[];
  marks: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  order: number;
}

const questionSchema = new Schema<IQuestion>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [
        true,
        "Exam reference (examId) is required",
      ],
      index: true,
    },

    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["single", "multi"],
      default: "single",
    },

    options: {
      type: [String],
      required: [true, "Options are required"],
      validate: [
        (value: string[]) =>
          Array.isArray(value) && value.length >= 2,
        "A question must have at least 2 options",
      ],
    },

    correctAnswers: {
      type: [String],
      required: [true, "Correct answer(s) required"],
      validate: [
        (value: string[]) =>
          Array.isArray(value) && value.length >= 1,
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

questionSchema.index({
  examId: 1,
  order: 1,
});

const Question = mongoose.model<IQuestion>(
  "Question",
  questionSchema
);

export default Question;
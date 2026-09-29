import mongoose, {
  Document,
  Schema,
} from "mongoose";

/* =========================================================
   TYPES
========================================================= */

export type QuestionType =
  | "single"
  | "multi";

export type QuestionDifficulty =
  | "easy"
  | "medium"
  | "hard";

export interface IQuestion
  extends Document {
  examId: mongoose.Types.ObjectId;

  questionText: string;

  type: QuestionType;

  options: string[];

  /*
   * For single:
   * ["option"]
   *
   * For multi:
   * ["option1", "option2"]
   */
  correctAnswers: string[];

  marks: number;

  explanation?: string;

  difficulty: QuestionDifficulty;

  order: number;

  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   SCHEMA
========================================================= */

const questionSchema =
  new Schema<IQuestion>(
    {
      /* ---------------------------------------------------
         EXAM
      --------------------------------------------------- */

      examId: {
        type: Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
        index: true,
      },

      /* ---------------------------------------------------
         QUESTION TEXT
      --------------------------------------------------- */

      questionText: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 2000,
      },

      /* ---------------------------------------------------
         QUESTION TYPE
      --------------------------------------------------- */

      type: {
        type: String,
        enum: [
          "single",
          "multi",
        ],
        required: true,
        default: "single",
      },

      /* ---------------------------------------------------
         OPTIONS
      --------------------------------------------------- */

      options: {
        type: [String],
        required: true,
        validate: {
          validator: (
            value: string[]
          ) => {
            return (
              Array.isArray(value) &&
              value.length >= 2 &&
              value.length <= 10
            );
          },

          message:
            "A question must have between 2 and 10 options",
        },
      },

      /* ---------------------------------------------------
         CORRECT ANSWERS
      --------------------------------------------------- */

      correctAnswers: {
        type: [String],
        required: true,
        validate: {
          validator: (
            value: string[]
          ) => {
            return (
              Array.isArray(value) &&
              value.length >= 1
            );
          },

          message:
            "At least one correct answer is required",
        },
      },

      /* ---------------------------------------------------
         MARKS
      --------------------------------------------------- */

      marks: {
        type: Number,
        required: true,
        min: 0,
        default: 1,
      },

      /* ---------------------------------------------------
         EXPLANATION
      --------------------------------------------------- */

      explanation: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: "",
      },

      /* ---------------------------------------------------
         DIFFICULTY
      --------------------------------------------------- */

      difficulty: {
        type: String,
        enum: [
          "easy",
          "medium",
          "hard",
        ],
        default: "medium",
      },

      /* ---------------------------------------------------
         QUESTION ORDER
      --------------------------------------------------- */

      order: {
        type: Number,
        required: true,
        min: 1,
      },
    },

    {
      collection: "questions",
      timestamps: true,
    }
  );

/* =========================================================
   INDEXES
========================================================= */

/*
 * Used when loading an exam's question bank.
 */
questionSchema.index({
  examId: 1,
  order: 1,
});

/*
 * Used when retrieving random questions.
 */
questionSchema.index({
  examId: 1,
  createdAt: 1,
});

/* =========================================================
   MODEL
========================================================= */

const Question =
  mongoose.models.Question ||
  mongoose.model<IQuestion>(
    "Question",
    questionSchema
  );

export default Question;
import dns from "dns";

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

import mongoose from "mongoose";
import dotenv from "dotenv";

import Question from "../models/Question";

dotenv.config();

const EXAM_ID =
  new mongoose.Types.ObjectId(
    "6aaaa44481224e43fc6e84b7"
  );

const questions = [
  {
    _id: new mongoose.Types.ObjectId(
      "6aaaa59881224e43fc6e84c1"
    ),
    examId: EXAM_ID,
    questionText:
      "Which keyword is used to declare a constant in JavaScript?",
    type: "single" as const,
    options: [
      "var",
      "let",
      "const",
      "static",
    ],
    correctAnswers: ["const"],
    marks: 1,
    difficulty: "easy" as const,
    explanation:
      "'const' declares a block-scoped variable that cannot be reassigned. 'var' and 'let' are for mutable variables; 'static' is not a variable-declaration keyword in JS.",
    order: 1,
  },

  {
    examId: EXAM_ID,
    questionText:
      "Which of the following are valid ways to declare a variable in JavaScript?",
    type: "multi" as const,
    options: [
      "var name = 1;",
      "let name = 1;",
      "const name = 1;",
      "int name = 1;",
    ],
    correctAnswers: [
      "var name = 1;",
      "let name = 1;",
      "const name = 1;",
    ],
    marks: 2,
    difficulty: "easy" as const,
    explanation:
      "'int' is not a valid keyword in JavaScript. 'var', 'let', and 'const' are valid variable declaration keywords.",
    order: 2,
  },

  {
    examId: EXAM_ID,
    questionText:
      "What is the output of: console.log(typeof null);",
    type: "single" as const,
    options: [
      "'null'",
      "'undefined'",
      "'object'",
      "'number'",
    ],
    correctAnswers: ["'object'"],
    marks: 1,
    difficulty: "medium" as const,
    explanation:
      "typeof null returns 'object' due to a legacy JavaScript behavior.",
    order: 3,
  },

  {
    examId: EXAM_ID,
    questionText:
      "Which array method adds one or more elements to the END of an array?",
    type: "single" as const,
    options: [
      "push()",
      "pop()",
      "shift()",
      "unshift()",
    ],
    correctAnswers: ["push()"],
    marks: 1,
    difficulty: "easy" as const,
    explanation:
      "push() appends elements to the end of an array.",
    order: 4,
  },

  {
    examId: EXAM_ID,
    questionText:
      "Which of the following are JavaScript primitive data types?",
    type: "multi" as const,
    options: [
      "String",
      "Boolean",
      "Float",
      "Symbol",
      "Integer",
    ],
    correctAnswers: [
      "String",
      "Boolean",
      "Symbol",
    ],
    marks: 2,
    difficulty: "medium" as const,
    explanation:
      "String, Boolean, and Symbol are JavaScript primitive types.",
    order: 5,
  },

  {
    examId: EXAM_ID,
    questionText:
      "What does the === operator check in JavaScript?",
    type: "single" as const,
    options: [
      "Value only",
      "Type only",
      "Both value and type (strict equality)",
      "Reference equality",
    ],
    correctAnswers: [
      "Both value and type (strict equality)",
    ],
    marks: 1,
    difficulty: "easy" as const,
    explanation:
      "=== is the strict equality operator.",
    order: 6,
  },

  {
    examId: EXAM_ID,
    questionText:
      "What will console.log(0.1 + 0.2 === 0.3) output?",
    type: "single" as const,
    options: [
      "true",
      "false",
      "NaN",
      "undefined",
    ],
    correctAnswers: ["false"],
    marks: 1,
    difficulty: "hard" as const,
    explanation:
      "Floating-point precision causes 0.1 + 0.2 to evaluate to 0.30000000000000004.",
    order: 7,
  },

  {
    examId: EXAM_ID,
    questionText:
      "Which array methods return a NEW array without mutating the original?",
    type: "multi" as const,
    options: [
      "map()",
      "filter()",
      "push()",
      "splice()",
      "slice()",
    ],
    correctAnswers: [
      "map()",
      "filter()",
      "slice()",
    ],
    marks: 2,
    difficulty: "medium" as const,
    explanation:
      "map(), filter(), and slice() return new arrays.",
    order: 8,
  },

  {
    examId: EXAM_ID,
    questionText:
      "What is a closure in JavaScript?",
    type: "single" as const,
    options: [
      "A function that has no return statement",
      "A function that remembers variables from its outer scope even after the outer function has finished executing",
      "A method used to close a browser window",
      "A way to end a loop early using break",
    ],
    correctAnswers: [
      "A function that remembers variables from its outer scope even after the outer function has finished executing",
    ],
    marks: 2,
    difficulty: "hard" as const,
    explanation:
      "A closure retains access to its lexical scope.",
    order: 9,
  },

  {
    examId: EXAM_ID,
    questionText:
      "Which of the following are features of Arrow Functions (=>) in JavaScript?",
    type: "multi" as const,
    options: [
      "They do not have their own 'this' binding",
      "They can be used as constructors with 'new'",
      "They have a shorter syntax than regular functions",
      "They do not have an 'arguments' object",
    ],
    correctAnswers: [
      "They do not have their own 'this' binding",
      "They have a shorter syntax than regular functions",
      "They do not have an 'arguments' object",
    ],
    marks: 2,
    difficulty: "medium" as const,
    explanation:
      "Arrow functions lexically bind this and cannot be used as constructors.",
    order: 10,
  },
];

const seedQuestions = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not defined in .env"
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI,
      {
        dbName: "ExamForge",
      }
    );

    console.log(
      "MongoDB connected"
    );

    const deleted =
      await Question.deleteMany({
        examId: EXAM_ID,
      });

    console.log(
      `Removed ${deleted.deletedCount} existing question(s)`
    );

    const inserted =
      await Question.insertMany(
        questions
      );

    console.log(
      `Inserted ${inserted.length} question(s)`
    );

    await mongoose.disconnect();

    console.log(
      "Seeding complete"
    );
  } catch (error) {
    console.error(
      "Seeding failed:",
      error instanceof Error
        ? error.message
        : error
    );

    process.exit(1);
  }
};

seedQuestions();
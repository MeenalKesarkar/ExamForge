const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Question = require("../models/Question");

dotenv.config();

// ─── Target Exam ──────────────────────────────────────────────────────────────
const EXAM_ID = new mongoose.Types.ObjectId("6aaaa44481224e43fc6e84b7");

// ─── Questions ────────────────────────────────────────────────────────────────
const questions = [
  // Q1 — original (preserves _id)
  {
    _id: new mongoose.Types.ObjectId("6aaaa59881224e43fc6e84c1"),
    examId: EXAM_ID,
    questionText: "Which keyword is used to declare a constant in JavaScript?",
    type: "single",
    options: ["var", "let", "const", "static"],
    correctAnswers: ["const"],
    marks: 1,
    difficulty: "easy",
    explanation:
      "'const' declares a block-scoped variable that cannot be reassigned. " +
      "'var' and 'let' are for mutable variables; 'static' is not a variable-declaration keyword in JS.",
    order: 1,
  },

  // Q2
  {
    examId: EXAM_ID,
    questionText:
      "Which of the following are valid ways to declare a variable in JavaScript?",
    type: "multi",
    options: [
      "var name = 1;",
      "let name = 1;",
      "const name = 1;",
      "int name = 1;",
    ],
    correctAnswers: ["var name = 1;", "let name = 1;", "const name = 1;"],
    marks: 2,
    difficulty: "easy",
    explanation:
      "'int' is not a valid keyword in JavaScript. " +
      "'var', 'let', and 'const' are all valid variable declaration keywords.",
    order: 2,
  },

  // Q3
  {
    examId: EXAM_ID,
    questionText: "What is the output of: console.log(typeof null);",
    type: "single",
    options: ["'null'", "'undefined'", "'object'", "'number'"],
    correctAnswers: ["'object'"],
    marks: 1,
    difficulty: "medium",
    explanation:
      "This is a well-known JavaScript quirk. typeof null returns 'object' " +
      "due to a legacy bug in the original JS engine that was never fixed for backward compatibility.",
    order: 3,
  },

  // Q4
  {
    examId: EXAM_ID,
    questionText:
      "Which array method adds one or more elements to the END of an array?",
    type: "single",
    options: ["push()", "pop()", "shift()", "unshift()"],
    correctAnswers: ["push()"],
    marks: 1,
    difficulty: "easy",
    explanation:
      "push() appends elements to the end and returns the new length. " +
      "pop() removes the last element, shift() removes the first, and unshift() adds to the beginning.",
    order: 4,
  },

  // Q5
  {
    examId: EXAM_ID,
    questionText: "Which of the following are JavaScript primitive data types?",
    type: "multi",
    options: ["String", "Boolean", "Float", "Symbol", "Integer"],
    correctAnswers: ["String", "Boolean", "Symbol"],
    marks: 2,
    difficulty: "medium",
    explanation:
      "JS primitives are: String, Number, BigInt, Boolean, Undefined, Symbol, and Null. " +
      "'Float' and 'Integer' are not distinct types in JavaScript — all numbers use the 'Number' type.",
    order: 5,
  },

  // Q6
  {
    examId: EXAM_ID,
    questionText: "What does the === operator check in JavaScript?",
    type: "single",
    options: [
      "Value only",
      "Type only",
      "Both value and type (strict equality)",
      "Reference equality",
    ],
    correctAnswers: ["Both value and type (strict equality)"],
    marks: 1,
    difficulty: "easy",
    explanation:
      "=== is the strict equality operator. It checks both value AND type without type coercion. " +
      "The == operator performs type coercion before comparison.",
    order: 6,
  },

  // Q7
  {
    examId: EXAM_ID,
    questionText: "What will console.log(0.1 + 0.2 === 0.3) output?",
    type: "single",
    options: ["true", "false", "NaN", "undefined"],
    correctAnswers: ["false"],
    marks: 1,
    difficulty: "hard",
    explanation:
      "Due to IEEE 754 floating-point precision, 0.1 + 0.2 evaluates to 0.30000000000000004 in JavaScript, " +
      "which is not strictly equal to 0.3. Use Math.abs(a - b) < Number.EPSILON for safe comparisons.",
    order: 7,
  },

  // Q8
  {
    examId: EXAM_ID,
    questionText:
      "Which array methods return a NEW array without mutating the original?",
    type: "multi",
    options: ["map()", "filter()", "push()", "splice()", "slice()"],
    correctAnswers: ["map()", "filter()", "slice()"],
    marks: 2,
    difficulty: "medium",
    explanation:
      "map(), filter(), and slice() all return a new array and leave the original unchanged. " +
      "push() and splice() modify the original array in place.",
    order: 8,
  },

  // Q9
  {
    examId: EXAM_ID,
    questionText: "What is a closure in JavaScript?",
    type: "single",
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
    difficulty: "hard",
    explanation:
      "A closure is formed when a function retains access to its lexical scope " +
      "even when invoked outside that scope. Closures power patterns like currying, memoization, and the module pattern.",
    order: 9,
  },

  // Q10
  {
    examId: EXAM_ID,
    questionText:
      "Which of the following are features of Arrow Functions (=>) in JavaScript?",
    type: "multi",
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
    difficulty: "medium",
    explanation:
      "Arrow functions lexically bind 'this', have concise syntax, and lack their own 'arguments' object. " +
      "They CANNOT be used as constructors — calling 'new' on an arrow function throws a TypeError.",
    order: 10,
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────
const seedQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "ExamForge" });
    console.log("✅  MongoDB connected");

    // Clear existing questions for this exam to prevent duplicates on re-runs
    const deleted = await Question.deleteMany({ examId: EXAM_ID });
    console.log(`🗑️   Removed ${deleted.deletedCount} existing question(s) for exam ${EXAM_ID}`);

    const inserted = await Question.insertMany(questions);
    console.log(`✅  Inserted ${inserted.length} question(s):\n`);

    inserted.forEach((q, i) => {
      const tag = `${q.type.toUpperCase()} | ${q.difficulty}`;
      console.log(`   [${String(i + 1).padStart(2, "0")}] (${tag}) ${q.questionText.slice(0, 55)}...`);
    });

    await mongoose.disconnect();
    console.log("\n🎉  Seeding complete. MongoDB disconnected.");
  } catch (error) {
    console.error("❌  Seeding failed:", error.message);
    process.exit(1);
  }
};

seedQuestions();

import "dotenv/config";
import mongoose from "mongoose";

import Exam from "../models/Exam";
import Question from "../models/Question";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing in .env");
}

// Your existing instructor: Priya Sharma
const INSTRUCTOR_ID =
  "6aaaa3db81224e43fc6e84ae";

interface ExamSeed {
  title: string;
  duration: number;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
  negativePenalty: number;
  instructions: string;
  questions: {
    questionText: string;
    type: "single" | "multi";
    options: string[];
    correctAnswers: string[];
    marks: number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    order: number;
  }[];
}

const exams: ExamSeed[] = [
  // ======================================================
  // 1. REACT.JS ESSENTIALS
  // ======================================================

  {
    title: "React.js Essentials",
    duration: 30,
    questionCount: 5,
    totalMarks: 5,
    passingMarks: 3,
    negativeMarking: true,
    negativePenalty: 0.25,
    instructions:
      "Answer all questions. Some questions may have multiple correct answers.",
    questions: [
      {
        questionText:
          "Which hook is commonly used to manage state in a React functional component?",
        type: "single",
        options: [
          "useState",
          "useRoute",
          "useComponent",
          "useData",
        ],
        correctAnswers: ["useState"],
        marks: 1,
        explanation:
          "useState allows functional components to maintain and update local state.",
        difficulty: "easy",
        order: 1,
      },
      {
        questionText:
          "Which of the following are valid React hooks?",
        type: "multi",
        options: [
          "useState",
          "useEffect",
          "useContext",
          "useReact",
        ],
        correctAnswers: [
          "useState",
          "useEffect",
          "useContext",
        ],
        marks: 1,
        explanation:
          "useState, useEffect and useContext are built-in React hooks.",
        difficulty: "easy",
        order: 2,
      },
      {
        questionText:
          "What is the purpose of React props?",
        type: "single",
        options: [
          "To pass data from parent to child",
          "To connect React to MongoDB",
          "To create CSS files",
          "To install packages",
        ],
        correctAnswers: [
          "To pass data from parent to child",
        ],
        marks: 1,
        explanation:
          "Props are used to pass data from a parent component to a child component.",
        difficulty: "easy",
        order: 3,
      },
      {
        questionText:
          "Which method is commonly used to render a list of elements in React?",
        type: "single",
        options: [
          "map()",
          "forEachAsync()",
          "renderList()",
          "loopReact()",
        ],
        correctAnswers: ["map()"],
        marks: 1,
        explanation:
          "JavaScript's map() method is commonly used to transform arrays into React elements.",
        difficulty: "easy",
        order: 4,
      },
      {
        questionText:
          "Which statements about useEffect are correct?",
        type: "multi",
        options: [
          "It can perform side effects",
          "It can run after rendering",
          "It can be used for API calls",
          "It is used only for CSS",
        ],
        correctAnswers: [
          "It can perform side effects",
          "It can run after rendering",
          "It can be used for API calls",
        ],
        marks: 1,
        explanation:
          "useEffect is commonly used for side effects such as API calls, subscriptions and synchronization.",
        difficulty: "medium",
        order: 5,
      },
    ],
  },

  // ======================================================
  // 2. NODE.JS & EXPRESS
  // ======================================================

  {
    title: "Node.js & Express",
    duration: 35,
    questionCount: 5,
    totalMarks: 5,
    passingMarks: 3,
    negativeMarking: true,
    negativePenalty: 0.25,
    instructions:
      "Test your understanding of Node.js, Express and backend development.",
    questions: [
      {
        questionText:
          "What is Node.js primarily used for?",
        type: "single",
        options: [
          "Running JavaScript outside the browser",
          "Creating only HTML pages",
          "Designing database tables",
          "Editing images",
        ],
        correctAnswers: [
          "Running JavaScript outside the browser",
        ],
        marks: 1,
        explanation:
          "Node.js is a JavaScript runtime that allows JavaScript to run outside the browser.",
        difficulty: "easy",
        order: 1,
      },
      {
        questionText:
          "Which package is commonly used to create an Express server?",
        type: "single",
        options: [
          "express",
          "react-server",
          "node-http-server",
          "mongodb-server",
        ],
        correctAnswers: ["express"],
        marks: 1,
        explanation:
          "Express is a popular Node.js framework for building web servers and APIs.",
        difficulty: "easy",
        order: 2,
      },
      {
        questionText:
          "Which HTTP methods are commonly used in REST APIs?",
        type: "multi",
        options: [
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "PRINT",
        ],
        correctAnswers: [
          "GET",
          "POST",
          "PUT",
          "DELETE",
        ],
        marks: 1,
        explanation:
          "GET, POST, PUT and DELETE are commonly used HTTP methods in REST APIs.",
        difficulty: "easy",
        order: 3,
      },
      {
        questionText:
          "What is middleware in Express?",
        type: "single",
        options: [
          "A function that runs during the request-response cycle",
          "A MongoDB collection",
          "A React component",
          "A CSS framework",
        ],
        correctAnswers: [
          "A function that runs during the request-response cycle",
        ],
        marks: 1,
        explanation:
          "Express middleware functions have access to the request, response and next function.",
        difficulty: "medium",
        order: 4,
      },
      {
        questionText:
          "Which objects are commonly available inside an Express route handler?",
        type: "multi",
        options: [
          "Request",
          "Response",
          "Next",
          "MongoConnectionOnly",
        ],
        correctAnswers: [
          "Request",
          "Response",
          "Next",
        ],
        marks: 1,
        explanation:
          "Express handlers commonly receive req, res and optionally next.",
        difficulty: "medium",
        order: 5,
      },
    ],
  },

  // ======================================================
  // 3. MONGODB & DATABASE
  // ======================================================

  {
    title: "MongoDB & Database",
    duration: 30,
    questionCount: 5,
    totalMarks: 5,
    passingMarks: 3,
    negativeMarking: false,
    negativePenalty: 0,
    instructions:
      "Answer questions related to MongoDB, collections and document databases.",
    questions: [
      {
        questionText:
          "MongoDB is which type of database?",
        type: "single",
        options: [
          "Document database",
          "Relational database",
          "Graph database",
          "Spreadsheet database",
        ],
        correctAnswers: [
          "Document database",
        ],
        marks: 1,
        explanation:
          "MongoDB is a NoSQL document-oriented database.",
        difficulty: "easy",
        order: 1,
      },
      {
        questionText:
          "Which format is commonly associated with MongoDB documents?",
        type: "single",
        options: [
          "BSON",
          "HTML",
          "CSS",
          "CSV only",
        ],
        correctAnswers: ["BSON"],
        marks: 1,
        explanation:
          "MongoDB stores documents internally using BSON.",
        difficulty: "easy",
        order: 2,
      },
      {
        questionText:
          "Which are MongoDB database concepts?",
        type: "multi",
        options: [
          "Database",
          "Collection",
          "Document",
          "Table Row",
        ],
        correctAnswers: [
          "Database",
          "Collection",
          "Document",
        ],
        marks: 1,
        explanation:
          "MongoDB uses databases, collections and documents rather than relational tables and rows.",
        difficulty: "easy",
        order: 3,
      },
      {
        questionText:
          "Which MongoDB operation is used to retrieve documents?",
        type: "single",
        options: [
          "find()",
          "selectAllRows()",
          "getRows()",
          "retrieveSQL()",
        ],
        correctAnswers: ["find()"],
        marks: 1,
        explanation:
          "MongoDB provides find() for querying documents.",
        difficulty: "easy",
        order: 4,
      },
      {
        questionText:
          "What is an index used for in MongoDB?",
        type: "single",
        options: [
          "Improving query performance",
          "Encrypting every document",
          "Creating React components",
          "Starting the Node server",
        ],
        correctAnswers: [
          "Improving query performance",
        ],
        marks: 1,
        explanation:
          "Indexes can improve the performance of queries by reducing the amount of data MongoDB needs to scan.",
        difficulty: "medium",
        order: 5,
      },
    ],
  },

  // ======================================================
  // 4. TYPESCRIPT FUNDAMENTALS
  // ======================================================

  {
    title: "TypeScript Fundamentals",
    duration: 30,
    questionCount: 5,
    totalMarks: 5,
    passingMarks: 3,
    negativeMarking: true,
    negativePenalty: 0.25,
    instructions:
      "Test your understanding of TypeScript types, interfaces and modern development.",
    questions: [
      {
        questionText:
          "What is TypeScript?",
        type: "single",
        options: [
          "A typed superset of JavaScript",
          "A database",
          "A CSS framework",
          "A web browser",
        ],
        correctAnswers: [
          "A typed superset of JavaScript",
        ],
        marks: 1,
        explanation:
          "TypeScript adds static typing and other features to JavaScript.",
        difficulty: "easy",
        order: 1,
      },
      {
        questionText:
          "Which keyword can define an interface in TypeScript?",
        type: "single",
        options: [
          "interface",
          "struct",
          "schema",
          "model",
        ],
        correctAnswers: ["interface"],
        marks: 1,
        explanation:
          "The interface keyword defines object type contracts in TypeScript.",
        difficulty: "easy",
        order: 2,
      },
      {
        questionText:
          "Which are valid TypeScript types?",
        type: "multi",
        options: [
          "string",
          "number",
          "boolean",
          "unknown",
          "stylesheet",
        ],
        correctAnswers: [
          "string",
          "number",
          "boolean",
          "unknown",
        ],
        marks: 1,
        explanation:
          "string, number, boolean and unknown are valid TypeScript types.",
        difficulty: "easy",
        order: 3,
      },
      {
        questionText:
          "What does the optional property syntax `name?: string` mean?",
        type: "single",
        options: [
          "The property is optional",
          "The property must always exist",
          "The property can only be a number",
          "The property is private",
        ],
        correctAnswers: [
          "The property is optional",
        ],
        marks: 1,
        explanation:
          "The ? indicates that an object property may be omitted.",
        difficulty: "easy",
        order: 4,
      },
      {
        questionText:
          "Which features are commonly used in TypeScript?",
        type: "multi",
        options: [
          "Interfaces",
          "Generics",
          "Type aliases",
          "Type annotations",
          "Mongo collections",
        ],
        correctAnswers: [
          "Interfaces",
          "Generics",
          "Type aliases",
          "Type annotations",
        ],
        marks: 1,
        explanation:
          "Interfaces, generics, type aliases and type annotations are core TypeScript features.",
        difficulty: "medium",
        order: 5,
      },
    ],
  },

  // ======================================================
  // 5. HTML & CSS
  // ======================================================

  {
    title: "HTML & CSS Web Development",
    duration: 25,
    questionCount: 5,
    totalMarks: 5,
    passingMarks: 3,
    negativeMarking: false,
    negativePenalty: 0,
    instructions:
      "Test your knowledge of HTML structure, CSS and responsive web design.",
    questions: [
      {
        questionText:
          "What does HTML stand for?",
        type: "single",
        options: [
          "HyperText Markup Language",
          "HighText Machine Language",
          "HyperTool Multi Language",
          "Home Tool Markup Language",
        ],
        correctAnswers: [
          "HyperText Markup Language",
        ],
        marks: 1,
        explanation:
          "HTML stands for HyperText Markup Language.",
        difficulty: "easy",
        order: 1,
      },
      {
        questionText:
          "Which HTML element is used for the main heading?",
        type: "single",
        options: [
          "<h1>",
          "<heading>",
          "<head1>",
          "<title1>",
        ],
        correctAnswers: ["<h1>"],
        marks: 1,
        explanation:
          "The h1 element represents the highest-level heading.",
        difficulty: "easy",
        order: 2,
      },
      {
        questionText:
          "Which CSS properties can affect spacing?",
        type: "multi",
        options: [
          "margin",
          "padding",
          "gap",
          "spacingOnly",
        ],
        correctAnswers: [
          "margin",
          "padding",
          "gap",
        ],
        marks: 1,
        explanation:
          "margin, padding and gap can all control different forms of spacing.",
        difficulty: "easy",
        order: 3,
      },
      {
        questionText:
          "Which CSS layout systems are commonly used for responsive layouts?",
        type: "multi",
        options: [
          "Flexbox",
          "CSS Grid",
          "Table-only layout",
          "Neither",
        ],
        correctAnswers: [
          "Flexbox",
          "CSS Grid",
        ],
        marks: 1,
        explanation:
          "Flexbox and CSS Grid are modern CSS layout systems.",
        difficulty: "easy",
        order: 4,
      },
      {
        questionText:
          "Which CSS unit is relative to the root font size?",
        type: "single",
        options: [
          "rem",
          "px",
          "cm",
          "pt",
        ],
        correctAnswers: ["rem"],
        marks: 1,
        explanation:
          "The rem unit is relative to the root element's font size.",
        difficulty: "medium",
        order: 5,
      },
    ],
  },

  // ======================================================
  // 6. MERN STACK DEVELOPMENT
  // ======================================================

  {
    title: "MERN Stack Development",
    duration: 45,
    questionCount: 5,
    totalMarks: 5,
    passingMarks: 3,
    negativeMarking: true,
    negativePenalty: 0.25,
    instructions:
      "Test your understanding of MongoDB, Express, React and Node.js.",
    questions: [
      {
        questionText:
          "What does MERN stand for?",
        type: "single",
        options: [
          "MongoDB, Express, React, Node.js",
          "MySQL, Express, React, Node.js",
          "MongoDB, Express, Redux, Next.js",
          "MongoDB, Electron, React, Node.js",
        ],
        correctAnswers: [
          "MongoDB, Express, React, Node.js",
        ],
        marks: 1,
        explanation:
          "MERN stands for MongoDB, Express, React and Node.js.",
        difficulty: "easy",
        order: 1,
      },
      {
        questionText:
          "Which MERN technologies are commonly used on the backend?",
        type: "multi",
        options: [
          "Node.js",
          "Express",
          "React",
          "MongoDB",
        ],
        correctAnswers: [
          "Node.js",
          "Express",
          "MongoDB",
        ],
        marks: 1,
        explanation:
          "Node.js and Express provide the backend runtime/framework, while MongoDB provides data storage.",
        difficulty: "easy",
        order: 2,
      },
      {
        questionText:
          "Which technology is primarily responsible for the frontend UI in MERN?",
        type: "single",
        options: [
          "React",
          "MongoDB",
          "Express",
          "Node.js",
        ],
        correctAnswers: ["React"],
        marks: 1,
        explanation:
          "React is used to build the frontend user interface.",
        difficulty: "easy",
        order: 3,
      },
      {
        questionText:
          "Which technologies can be involved in a MERN REST API application?",
        type: "multi",
        options: [
          "Express",
          "Node.js",
          "MongoDB",
          "React",
        ],
        correctAnswers: [
          "Express",
          "Node.js",
          "MongoDB",
        ],
        marks: 1,
        explanation:
          "Express and Node.js can power the API while MongoDB stores application data.",
        difficulty: "medium",
        order: 4,
      },
      {
        questionText:
          "What is a common way for React to communicate with a MERN backend?",
        type: "single",
        options: [
          "HTTP API requests",
          "Directly reading MongoDB",
          "Editing server files",
          "Reading Node.js memory",
        ],
        correctAnswers: [
          "HTTP API requests",
        ],
        marks: 1,
        explanation:
          "React commonly communicates with the backend through HTTP requests to REST APIs.",
        difficulty: "medium",
        order: 5,
      },
    ],
  },
];

// ======================================================
// SEED FUNCTION
// ======================================================

const seedExams = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    let examsCreated = 0;
    let questionsCreated = 0;

    for (const examData of exams) {
      // --------------------------------------------------
      // Check whether exam already exists
      // --------------------------------------------------

      const existingExam =
        await Exam.findOne({
          title: examData.title,
        });

      if (existingExam) {
        console.log(
          `Skipping existing exam: ${examData.title}`
        );

        continue;
      }

      // --------------------------------------------------
      // Create exam
      // --------------------------------------------------

      const exam = await Exam.create({
        title: examData.title,

        duration: examData.duration,

        questionCount:
          examData.questionCount,

        totalMarks:
          examData.totalMarks,

        passingMarks:
          examData.passingMarks,

        negativeMarking:
          examData.negativeMarking,

        negativePenalty:
          examData.negativePenalty,

        instructions:
          [examData.instructions],

        published: true,

        allowedAttempts: 2,

        shuffleQuestions: false,

        shuffleOptions: false,

        createdBy:
          new mongoose.Types.ObjectId(
            INSTRUCTOR_ID
          ),
      });

      examsCreated++;

      // --------------------------------------------------
      // Create questions
      // --------------------------------------------------

      const questions =
        examData.questions.map(
          (question) => ({
            examId: exam._id,

            questionText:
              question.questionText,

            type: question.type,

            options: question.options,

            correctAnswers:
              question.correctAnswers,

            marks: question.marks,

            explanation:
              question.explanation,

            difficulty:
              question.difficulty,

            order: question.order,
          })
        );

      await Question.insertMany(
        questions
      );

      questionsCreated +=
        questions.length;

      console.log(
        `Created: ${examData.title}`
      );
    }

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      `Exams created: ${examsCreated}`
    );
    console.log(
      `Questions created: ${questionsCreated}`
    );
    console.log(
      "========================================"
    );
  } catch (error) {
    console.error(
      "Error seeding exams:",
      error
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedExams();
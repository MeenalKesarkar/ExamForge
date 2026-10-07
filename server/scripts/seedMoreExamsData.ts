import type { ExamSeed } from "./seedMoreExamTypes";

export const examSeeds: ExamSeed[] = [
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
];

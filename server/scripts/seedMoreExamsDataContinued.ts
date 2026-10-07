import type { ExamSeed } from "./seedMoreExamTypes";

export const examSeedsContinued: ExamSeed[] = [  // 4. TYPESCRIPT FUNDAMENTALS
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

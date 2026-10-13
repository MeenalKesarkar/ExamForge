import test from "node:test";
import assert from "node:assert/strict";
import { parsePdfQuestions } from "../pdfQuestionParser";

test("parses inline single-answer labels and Why text as metadata", () => {
  const result = parsePdfQuestions([
    "1. How does a parent pass data to a child? SINGLE ANSWER Why: Props are inputs passed from a parent to a child.",
    "A. Props",
    "B. State setter only",
    "C. CSS variables",
    "D. URL fragments",
    "Correct answer: A",
  ].join("\n"));

  assert.equal(result.issues.length, 0);
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].questionText, "How does a parent pass data to a child?");
  assert.equal(result.questions[0].type, "single");
  assert.equal(result.questions[0].explanation, "Props are inputs passed from a parent to a child.");
  assert.deepEqual(result.questions[0].correctAnswers, ["Props"]);
});

test("parses inline multi-select labels without adding the label to the question", () => {
  const result = parsePdfQuestions([
    "1. Which are valid React component styles? MULTI-SELECT",
    "A. Function components",
    "B. Class components",
    "C. CSS files alone",
    "D. Database tables",
    "Correct answer: A, B",
  ].join("\n"));

  assert.equal(result.issues.length, 0);
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].questionText, "Which are valid React component styles?");
  assert.equal(result.questions[0].type, "multi");
  assert.deepEqual(result.questions[0].correctAnswers, ["Function components", "Class components"]);
});

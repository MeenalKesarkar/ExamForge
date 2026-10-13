import test from "node:test";
import assert from "node:assert/strict";
import { getQuestionDuplicateKey } from "../routes/questions/pdf";

test("a repeat PDF question matches older copies that included type and Why labels", () => {
  const clean = getQuestionDuplicateKey(
    "How does a parent normally pass data to a child component?",
    ["Props", "State setter only", "CSS variables", "URL fragments"],
  );
  const olderImportedCopy = getQuestionDuplicateKey(
    "How does a parent normally pass data to a child component? SINGLE ANSWER Why: Props are inputs passed from a parent to a child.",
    ["URL fragments", "CSS variables", "State setter only", "Props"],
  );

  assert.equal(olderImportedCopy, clean);
});

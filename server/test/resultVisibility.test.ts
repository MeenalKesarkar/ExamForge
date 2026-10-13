import test from "node:test";
import assert from "node:assert/strict";
import { areResultsAvailable, getResultsUnavailableMessage } from "../routes/attempts/helpers";

const beforeDeadline = new Date("2026-10-11T12:00:00.000Z");
const afterDeadline = new Date("2026-10-13T12:00:00.000Z");
const examDeadline = new Date("2026-10-12T12:00:00.000Z");

test("hidden results remain unavailable before and after the exam deadline", () => {
  const exam = { resultsHidden: true, endDate: examDeadline };

  assert.equal(areResultsAvailable(exam, beforeDeadline), false);
  assert.equal(areResultsAvailable(exam, afterDeadline), false);
  assert.match(getResultsUnavailableMessage(exam, beforeDeadline) || "", /hidden/i);
  assert.match(getResultsUnavailableMessage(exam, afterDeadline) || "", /hidden/i);
});

test("visible results unlock only after the configured exam deadline", () => {
  const exam = { resultsHidden: false, endDate: examDeadline };

  assert.equal(areResultsAvailable(exam, beforeDeadline), false);
  assert.match(getResultsUnavailableMessage(exam, beforeDeadline) || "", /deadline/i);
  assert.equal(areResultsAvailable(exam, afterDeadline), true);
  assert.equal(getResultsUnavailableMessage(exam, afterDeadline), null);
});

test("an exam without a results deadline does not release results", () => {
  const exam = { resultsHidden: false, endDate: null };

  assert.equal(areResultsAvailable(exam, afterDeadline), false);
  assert.match(getResultsUnavailableMessage(exam, afterDeadline) || "", /no release deadline/i);
});

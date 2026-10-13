import test from "node:test";
import assert from "node:assert/strict";
import type { IQuestion } from "../models/Question";
import { selectUniqueExamQuestions } from "../routes/exams/helpers";

function question(id: string): IQuestion {
  return { _id: { toString: () => id } } as unknown as IQuestion;
}

function setKey(ids: string[]): string {
  return ids.sort().join(",");
}

test("students receive distinct random questions, and a reused set is avoided", () => {
  const pool = [question("a"), question("b"), question("c")];
  const used = new Set([setKey(["a", "b"]), setKey(["a", "c"])]);

  const chosen = selectUniqueExamQuestions(pool, 2, used);

  assert.ok(chosen);
  assert.equal(chosen.length, 2);
  assert.equal(new Set(chosen.map((item) => item._id.toString())).size, 2);
  assert.equal(setKey(chosen.map((item) => item._id.toString())), "b,c");
});

test("question selection refuses to reuse a set when every combination is taken", () => {
  const pool = [question("a"), question("b"), question("c")];
  const used = new Set([
    setKey(["a", "b"]),
    setKey(["a", "c"]),
    setKey(["b", "c"]),
  ]);

  assert.equal(selectUniqueExamQuestions(pool, 2, used), null);
});

test("a bank with exactly the requested number of questions remains available to every student", () => {
  const pool = [question("a"), question("b"), question("c")];
  const used = new Set([setKey(["a", "b", "c"])]);

  const chosen = selectUniqueExamQuestions(pool, 3, used);

  assert.ok(chosen);
  assert.equal(chosen.length, 3);
  assert.deepEqual(chosen.map((item) => item._id.toString()).sort(), ["a", "b", "c"]);
});

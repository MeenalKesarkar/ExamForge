import test from "node:test";
import assert from "node:assert/strict";
import type { IAttempt } from "../models/Attempt";
import Attempt from "../models/Attempt";
import { calculateScore } from "../routes/attempts/helpers";
import { archiveCompletedOutdatedAttempt, isAttemptOutdated } from "../routes/exams/versioning";

test("an outdated completed attempt is archived while its record is kept", async () => {
  const attempt = {
    status: "SUBMITTED",
    examVersion: 1,
    archived: false,
    archivedAt: undefined as Date | undefined,
    archiveReason: undefined as string | undefined,
    save: async () => undefined,
  };

  await archiveCompletedOutdatedAttempt(attempt, 2);

  assert.equal(attempt.archived, true);
  assert.ok(attempt.archivedAt instanceof Date);
  assert.match(attempt.archiveReason || "", /version 1/i);
  assert.equal(isAttemptOutdated(1, 2), true);
  assert.equal(isAttemptOutdated(2, 2), false);
});

test("an active attempt remains on its original version until it finishes", async () => {
  const attempt = {
    status: "IN_PROGRESS",
    examVersion: 1,
    archived: false,
    save: async () => undefined,
  };

  await archiveCompletedOutdatedAttempt(attempt, 2);
  assert.equal(attempt.archived, false);
});

test("grading uses the saved question and scoring copy after the live exam changes", async () => {
  const attempt = {
    questionIds: [],
    questionSnapshots: [{
      _id: { toString: () => "question-1" },
      questionText: "Saved question",
      type: "single",
      options: ["old answer", "other"],
      correctAnswers: ["old answer"],
      marks: 2,
    }],
    examSnapshot: {
      version: 1,
      totalMarks: 2,
      passingMarks: 2,
      negativeMarking: false,
      negativePenalty: 0,
    },
    answers: { "question-1": ["old answer"] },
  } as unknown as IAttempt;

  const result = await calculateScore(attempt, {
    totalMarks: 100,
    passingMarks: 80,
    negativeMarking: true,
    negativePenalty: 10,
  });

  assert.equal(result.score, 2);
  assert.equal(result.totalMarks, 2);
  assert.equal(result.passed, true);
});

test("attempt question snapshots retain the original question ID and answer key", () => {
  const questionId = "64b000000000000000000001";
  const attempt = new Attempt({
    studentId: "64b000000000000000000002",
    examId: "64b000000000000000000003",
    startTime: new Date(),
    endTime: new Date(Date.now() + 60_000),
    questionIds: [questionId],
    questionSnapshots: [{
      _id: questionId,
      questionText: "Saved question",
      type: "single",
      options: ["A", "B"],
      correctAnswers: ["A"],
      marks: 1,
    }],
  });

  assert.equal(attempt.questionSnapshots[0]._id.toString(), questionId);
  assert.deepEqual(attempt.questionSnapshots[0].correctAnswers, ["A"]);
});

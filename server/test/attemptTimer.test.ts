import test from "node:test";
import assert from "node:assert/strict";
import type { IAttempt } from "../models/Attempt";
import { advanceAttemptTimer, pauseAttemptTimer, resumeAttemptTimer } from "../attemptTimer";

function makeAttempt(startTime: Date, endTime: Date, remainingSeconds: number, timerPaused = false): IAttempt {
  return {
    startTime,
    endTime,
    remainingSeconds,
    timerPaused,
    lastHeartbeatAt: startTime,
  } as unknown as IAttempt;
}

test("timer counts down from the server-stored end time", () => {
  const start = new Date("2026-01-01T12:00:00.000Z");
  const attempt = makeAttempt(start, new Date(start.getTime() + 90_000), 90);

  const result = advanceAttemptTimer(attempt, { duration: 10 }, new Date(start.getTime() + 20_000));

  assert.equal(result.remainingSeconds, 70);
  assert.equal(result.expired, false);
  assert.equal(attempt.timerPaused, false);
});

test("pause preserves remaining time and resume restores it without granting extra time", () => {
  const start = new Date("2026-01-01T12:00:00.000Z");
  const attempt = makeAttempt(start, new Date(start.getTime() + 90_000), 90);
  const paused = pauseAttemptTimer(attempt, { duration: 10 }, new Date(start.getTime() + 20_000));

  assert.equal(paused.remainingSeconds, 70);
  assert.equal(attempt.timerPaused, true);

  const longAfterPause = new Date(start.getTime() + 5 * 60_000);
  assert.equal(advanceAttemptTimer(attempt, { duration: 10 }, longAfterPause).remainingSeconds, 70);

  const resumed = resumeAttemptTimer(attempt, { duration: 10 }, longAfterPause);
  assert.equal(resumed.remainingSeconds, 70);
  assert.equal(attempt.timerPaused, false);
  assert.equal(attempt.endTime.getTime(), longAfterPause.getTime() + 70_000);

  const repeatedResume = resumeAttemptTimer(attempt, { duration: 10 }, new Date(longAfterPause.getTime() + 10_000));
  assert.equal(repeatedResume.remainingSeconds, 60);
});

test("the absolute exam deadline keeps running during a pause and caps resumed time", () => {
  const start = new Date("2026-01-01T12:00:00.000Z");
  const endDate = new Date(start.getTime() + 100_000);
  const attempt = makeAttempt(start, new Date(start.getTime() + 90_000), 90);
  pauseAttemptTimer(attempt, { duration: 10, endDate }, new Date(start.getTime() + 10_000));

  const resumedAt = new Date(start.getTime() + 80_000);
  const resumed = resumeAttemptTimer(attempt, { duration: 10, endDate }, resumedAt);
  assert.equal(resumed.remainingSeconds, 20);
  assert.equal(attempt.endTime.getTime(), endDate.getTime());

  const afterDeadline = advanceAttemptTimer(attempt, { duration: 10, endDate }, endDate);
  assert.equal(afterDeadline.expired, true);
  assert.equal(afterDeadline.remainingSeconds, 0);
});

test("a paused attempt expires at the absolute exam deadline", () => {
  const start = new Date("2026-01-01T12:00:00.000Z");
  const endDate = new Date(start.getTime() + 60_000);
  const attempt = makeAttempt(start, new Date(start.getTime() + 50_000), 40, true);

  const result = advanceAttemptTimer(attempt, { duration: 10, endDate }, endDate);
  assert.equal(result.expired, true);
  assert.equal(result.remainingSeconds, 0);
});

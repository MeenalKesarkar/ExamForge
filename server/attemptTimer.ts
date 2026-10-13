import { IAttempt } from "./models/Attempt";

export function advanceAttemptTimer(
  attempt: IAttempt,
  exam: { duration: number; endDate?: Date | null },
  now = new Date(),
): { remainingSeconds: number; paused: boolean; expired: boolean } {
  const nowMs = now.getTime();
  const absoluteDeadline = exam.endDate
    ? new Date(exam.endDate).getTime()
    : Number.POSITIVE_INFINITY;

  // The exam availability deadline is absolute and continues to apply while
  // paused. A pause preserves duration time, but cannot extend the exam past
  // its configured endDate.
  if (nowMs >= absoluteDeadline) {
    attempt.remainingSeconds = 0;
    attempt.lastHeartbeatAt = null;
    return { remainingSeconds: 0, paused: Boolean(attempt.timerPaused), expired: true };
  }

  if (attempt.timerPaused) {
    const remaining = Math.max(0, Math.floor(Number(attempt.remainingSeconds ?? 0)));
    attempt.remainingSeconds = remaining;
    return { remainingSeconds: remaining, paused: true, expired: remaining <= 0 };
  }

  const fallbackDurationEnd = new Date(attempt.startTime).getTime() + Math.max(0, Number(exam.duration) * 60_000);
  const storedEndTime = new Date(attempt.endTime).getTime();
  const durationEnd = Number.isFinite(storedEndTime) ? storedEndTime : fallbackDurationEnd;
  const deadline = Math.min(durationEnd, absoluteDeadline);
  const remaining = Math.max(0, Math.floor((deadline - nowMs) / 1000));

  attempt.remainingSeconds = remaining;
  attempt.endTime = new Date(deadline);
  attempt.lastHeartbeatAt = remaining > 0 ? now : null;

  return { remainingSeconds: remaining, paused: false, expired: remaining <= 0 };
}

export function pauseAttemptTimer(
  attempt: IAttempt,
  exam: { duration: number; endDate?: Date | null },
  now = new Date(),
): { remainingSeconds: number; paused: boolean; expired: boolean } {
  const timer = advanceAttemptTimer(attempt, exam, now);
  if (timer.expired) return timer;
  attempt.timerPaused = true;
  attempt.lastHeartbeatAt = null;
  return { ...timer, paused: true };
}

export function resumeAttemptTimer(
  attempt: IAttempt,
  exam: { duration: number; endDate?: Date | null },
  now = new Date(),
): { remainingSeconds: number; paused: boolean; expired: boolean } {
  const timer = advanceAttemptTimer(attempt, exam, now);
  if (timer.expired || !attempt.timerPaused) return { ...timer, paused: false };

  const durationDeadline = now.getTime() + timer.remainingSeconds * 1000;
  const availabilityDeadline = exam.endDate ? new Date(exam.endDate).getTime() : Number.POSITIVE_INFINITY;
  const deadline = Math.min(durationDeadline, availabilityDeadline);
  const remainingSeconds = Math.max(0, Math.floor((deadline - now.getTime()) / 1000));

  attempt.endTime = new Date(deadline);
  attempt.remainingSeconds = remainingSeconds;
  attempt.timerPaused = false;
  attempt.lastHeartbeatAt = remainingSeconds > 0 ? now : null;

  return { remainingSeconds, paused: false, expired: remainingSeconds <= 0 };
}

import { IAttempt } from "./models/Attempt";

const HEARTBEAT_GRACE_SECONDS = 15;
const MAX_UNCONFIRMED_SECONDS = 5;

export function advanceAttemptTimer(
  attempt: IAttempt,
  exam: { duration: number; endDate?: Date | null },
  now = new Date(),
): { remainingSeconds: number; paused: boolean; expired: boolean } {
  const durationSeconds = Math.max(0, Number(exam.duration) * 60);
  let remaining = typeof attempt.remainingSeconds === "number"
    ? attempt.remainingSeconds
    : Math.max(0, Math.floor((new Date(attempt.endTime).getTime() - now.getTime()) / 1000));

  let paused = Boolean(attempt.timerPaused);
  const lastBeat = attempt.lastHeartbeatAt ? new Date(attempt.lastHeartbeatAt) : null;

  if (!paused && lastBeat) {
    const elapsed = Math.max(0, Math.floor((now.getTime() - lastBeat.getTime()) / 1000));
    if (elapsed > HEARTBEAT_GRACE_SECONDS) {
      remaining -= Math.min(elapsed, MAX_UNCONFIRMED_SECONDS);
      paused = true;
      attempt.lastHeartbeatAt = null;
    } else {
      remaining -= elapsed;
      attempt.lastHeartbeatAt = now;
    }
  } else if (!paused) {
    attempt.lastHeartbeatAt = now;
  }

  remaining = Math.max(0, Math.min(durationSeconds, remaining));
  const deadlinePassed = Boolean(exam.endDate && now.getTime() >= new Date(exam.endDate).getTime());
  const expired = remaining <= 0 || deadlinePassed;

  attempt.remainingSeconds = remaining;
  attempt.timerPaused = paused;
  if (!paused && !expired) attempt.endTime = new Date(now.getTime() + remaining * 1000);
  if (expired) {
    attempt.remainingSeconds = 0;
    attempt.timerPaused = true;
    attempt.lastHeartbeatAt = null;
  }

  return { remainingSeconds: attempt.remainingSeconds, paused: attempt.timerPaused, expired };
}

export function startAttemptTimer(attempt: IAttempt, now = new Date()): void {
  attempt.timerPaused = false;
  attempt.lastHeartbeatAt = now;
  attempt.endTime = new Date(now.getTime() + Math.max(0, attempt.remainingSeconds || 0) * 1000);
}

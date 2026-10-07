import { IAttempt } from "./models/Attempt";

export function advanceAttemptTimer(
  attempt: IAttempt,
  exam: { duration: number; endDate?: Date | null },
  now = new Date(),
): { remainingSeconds: number; paused: boolean; expired: boolean } {
  const durationEnd = new Date(attempt.startTime).getTime() + Math.max(0, Number(exam.duration) * 60_000);
  const deadline = exam.endDate ? Math.min(durationEnd, new Date(exam.endDate).getTime()) : durationEnd;
  const remaining = Math.max(0, Math.floor((deadline - now.getTime()) / 1000));
  const expired = remaining <= 0;

  attempt.remainingSeconds = remaining;
  attempt.timerPaused = false;
  attempt.endTime = new Date(deadline);
  attempt.lastHeartbeatAt = now;
  if (expired) {
    attempt.remainingSeconds = 0;
    attempt.lastHeartbeatAt = null;
  }

  return { remainingSeconds: attempt.remainingSeconds, paused: false, expired };
}

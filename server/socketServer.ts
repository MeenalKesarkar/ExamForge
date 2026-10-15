import type { Server as HttpServer } from "node:http";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import Attempt from "./models/Attempt";
import Exam from "./models/Exam";
import User from "./models/User";
import { closeExpiredAttempt, areResultsAvailable } from "./routes/attempts/helpers";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_SECRET,
  MAX_SESSION_LIFETIME_MS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_SECRET,
  SESSION_LIFETIME_MS,
} from "./routes/auth/helpers";

interface SocketToken extends JwtPayload {
  userId?: string;
  role?: "student" | "instructor" | "admin";
  sessionExpiresAt?: number;
  sessionVersion?: number;
}

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    role?: SocketToken["role"];
    timerInterval?: NodeJS.Timeout;
    resultTimeout?: NodeJS.Timeout;
    resultAttemptId?: string;
  };
}

const MAX_TIMER_DELAY = 2_147_000_000;
const TIMER_SYNC_INTERVAL_MS = 30_000;

export const studentExamRoom = (studentId: string, examId: string) =>
  `student:${studentId}:exam:${examId}`;

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return undefined;
}

function getSocketToken(socket: AuthenticatedSocket): SocketToken {
  const cookie = socket.handshake.headers.cookie;
  const accessToken = readCookie(cookie, ACCESS_TOKEN_COOKIE);
  const refreshToken = readCookie(cookie, REFRESH_TOKEN_COOKIE);

  if (accessToken && ACCESS_TOKEN_SECRET) {
    try {
      return jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as SocketToken;
    } catch {
      // The access token may have expired while its session refresh cookie is valid.
    }
  }

  if (refreshToken && REFRESH_TOKEN_SECRET) {
    return jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as SocketToken;
  }

  throw new Error("Authentication required");
}

export function attachSocketServer(httpServer: HttpServer, frontendUrl: string): Server {
  const io = new Server(httpServer, {
    cors: { origin: frontendUrl, credentials: true },
  });

  io.use(async (rawSocket, next) => {
    const socket = rawSocket as AuthenticatedSocket;
    try {
      const payload = getSocketToken(socket);
      const now = Math.floor(Date.now() / 1000);
      const maxExpiry = (payload.iat ?? now) + MAX_SESSION_LIFETIME_MS / 1000;
      const sessionExpiry = Math.min(
        payload.sessionExpiresAt ?? (payload.iat ?? now) + SESSION_LIFETIME_MS / 1000,
        maxExpiry,
        payload.exp ?? 0,
      );
      if (!payload.userId || !payload.role || sessionExpiry <= now) {
        return next(new Error("Session expired"));
      }

      const user = await User.findById(payload.userId)
        .select("_id role accountStatus isActive sessionVersion")
        .lean();
      if (
        !user ||
        !user.isActive ||
        (user.accountStatus ?? "approved") !== "approved" ||
        user.role !== payload.role ||
        (user.sessionVersion ?? 0) !== (payload.sessionVersion ?? 0)
      ) {
        return next(new Error("Session is no longer valid"));
      }

      socket.data.userId = user._id.toString();
      socket.data.role = user.role;
      return next();
    } catch {
      return next(new Error("Authentication required"));
    }
  });

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;

    socket.on("attempt:join", async (payload: { attemptId?: unknown }) => {
      if (socket.data.role !== "student" || typeof payload?.attemptId !== "string") return;
      const attempt = await Attempt.findById(payload.attemptId).catch(() => null);
      if (!attempt || attempt.studentId.toString() !== socket.data.userId) return;
      const room = studentExamRoom(socket.data.userId!, attempt.examId.toString());
      await socket.join(room);

      if (attempt.status !== "IN_PROGRESS" || socket.data.timerInterval) return;
      let syncing = false;
      socket.data.timerInterval = setInterval(async () => {
        if (syncing || !socket.connected) return;
        syncing = true;
        try {
          const current = await Attempt.findById(attempt._id);
          const exam = await Exam.findById(attempt.examId);
          if (!current || !exam || current.status !== "IN_PROGRESS") {
            if (socket.data.timerInterval) clearInterval(socket.data.timerInterval);
            socket.data.timerInterval = undefined;
            if (current) socket.emit("attempt:timer", {
              status: current.status,
              remainingSeconds: current.remainingSeconds ?? 0,
              timerPaused: Boolean(current.timerPaused),
              serverNow: new Date().toISOString(),
            });
            return;
          }

          await closeExpiredAttempt(current, exam);
          socket.emit("attempt:timer", {
            status: current.status,
            remainingSeconds: current.remainingSeconds ?? 0,
            timerPaused: Boolean(current.timerPaused),
            serverNow: new Date().toISOString(),
          });
          if (current.status !== "IN_PROGRESS" && socket.data.timerInterval) {
            clearInterval(socket.data.timerInterval);
            socket.data.timerInterval = undefined;
          }
        } catch (error) {
          console.error("Socket exam timer sync error:", error);
        } finally {
          syncing = false;
        }
      }, TIMER_SYNC_INTERVAL_MS);
    });

    socket.on("attempt:leaveTimer", () => {
      if (socket.data.timerInterval) clearInterval(socket.data.timerInterval);
      socket.data.timerInterval = undefined;
    });

    socket.on("attempt:watchResults", async (payload: { attemptId?: unknown }) => {
      if (socket.data.role !== "student" || typeof payload?.attemptId !== "string") return;
      const attempt = await Attempt.findById(payload.attemptId).catch(() => null);
      if (!attempt || attempt.studentId.toString() !== socket.data.userId) return;
      const room = studentExamRoom(socket.data.userId!, attempt.examId.toString());
      await socket.join(room);
      await socket.join(`exam:${attempt.examId.toString()}:results`);
      socket.data.resultAttemptId = attempt._id.toString();

      const checkAvailability = async (): Promise<void> => {
        if (!socket.connected || !socket.data.resultAttemptId) return;
        const currentAttempt = await Attempt.findById(socket.data.resultAttemptId);
        const exam = currentAttempt ? await Exam.findById(currentAttempt.examId) : null;
        if (!currentAttempt || !exam) return;
        if (areResultsAvailable(exam)) {
          socket.emit("attempt:resultsChanged", { attemptId: currentAttempt._id.toString() });
          return;
        }

        const releaseAt = exam.endDate ? new Date(exam.endDate).getTime() : NaN;
        if (Number.isFinite(releaseAt) && releaseAt > Date.now()) {
          const delay = Math.min(releaseAt - Date.now(), MAX_TIMER_DELAY);
          socket.data.resultTimeout = setTimeout(() => {
            void checkAvailability().catch((error) => console.error("Socket result release check error:", error));
          }, delay);
        }
      };

      if (socket.data.resultTimeout) clearTimeout(socket.data.resultTimeout);
      void checkAvailability().catch((error) => console.error("Socket result check error:", error));
    });

    socket.on("disconnect", () => {
      if (socket.data.timerInterval) clearInterval(socket.data.timerInterval);
      if (socket.data.resultTimeout) clearTimeout(socket.data.resultTimeout);
      socket.data.timerInterval = undefined;
      socket.data.resultTimeout = undefined;
      socket.data.resultAttemptId = undefined;
    });
  });

  return io;
}

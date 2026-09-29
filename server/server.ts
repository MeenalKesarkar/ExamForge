// ======================================================
// EXAMFORGE BACKEND - SERVER
// ======================================================

import dns from "node:dns";

// MongoDB Atlas SRV DNS workaround
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

import "dotenv/config";

import express, {
  Request,
  Response,
  NextFunction,
} from "express";

import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import examRoutes from "./routes/examRoutes";
import attemptRoutes from "./routes/attemptRoutes";

const app = express();

// ======================================================
// CONFIG
// ======================================================

const PORT = Number(
  process.env.PORT || 5000
);

const MONGO_URI =
  process.env.MONGO_URI;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

// ======================================================
// ENV CHECK
// ======================================================

if (!MONGO_URI) {
  console.error(
    "❌ MONGO_URI is missing from .env"
  );

  process.exit(1);
}

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
    ],
  })
);

// ======================================================
// BODY PARSERS
// ======================================================

app.use(
  express.json({
    limit: "5mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb",
  })
);

// ======================================================
// COOKIES
// ======================================================

app.use(cookieParser());

// ======================================================
// LOGGER
// ======================================================

app.use(
  (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
    );

    next();
  }
);

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/",
  (_req: Request, res: Response) => {
    return res.status(200).json({
      message:
        "ExamForge API is running",
      status: "OK",
      timestamp:
        new Date().toISOString(),
    });
  }
);

app.get(
  "/api",
  (_req: Request, res: Response) => {
    return res.status(200).json({
      message:
        "ExamForge API is running",
      status: "OK",
    });
  }
);

// ======================================================
// ROUTES
// ======================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/profile",
  profileRoutes
);

app.use(
  "/api/exams",
  examRoutes
);

app.use(
  "/api/attempts",
  attemptRoutes
);

// ======================================================
// API 404
// ======================================================

app.use(
  "/api",
  (
    req: Request,
    res: Response
  ) => {
    return res.status(404).json({
      message:
        "API endpoint not found",
      method: req.method,
      path: req.originalUrl,
    });
  }
);

// ======================================================
// GLOBAL ERROR
// ======================================================

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    if (
      error instanceof Error
    ) {
      return res.status(500).json({
        message:
          error.message ||
          "Internal server error",
      });
    }

    return res.status(500).json({
      message:
        "Internal server error",
    });
  }
);

// ======================================================
// DATABASE
// ======================================================

const connectDatabase =
  async (): Promise<void> => {
    try {
      console.log(
        "Connecting to MongoDB..."
      );

      await mongoose.connect(
        MONGO_URI as string,
        {
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
          socketTimeoutMS: 45000,
          family: 4,
        }
      );

      console.log(
        "✅ MongoDB connected successfully"
      );

      console.log(
        `Database: ${mongoose.connection.name}`
      );

      console.log(
        `MongoDB host: ${mongoose.connection.host}`
      );

      // Very useful check
      if (
        mongoose.connection.name !==
        "ExamForge"
      ) {
        console.warn(
          `⚠️ WARNING: Connected to database "${mongoose.connection.name}" instead of "ExamForge".`
        );
      }
    } catch (error) {
      console.error(
        "❌ MongoDB connection failed:",
        error
      );

      process.exit(1);
    }
  };

// ======================================================
// START
// ======================================================

const startServer =
  async (): Promise<void> => {
    await connectDatabase();

    app.listen(
      PORT,
      () => {
        console.log("");
        console.log(
          "======================================"
        );
        console.log(
          "🚀 EXAMFORGE BACKEND"
        );
        console.log(
          "======================================"
        );
        console.log(
          `Server: http://localhost:${PORT}`
        );
        console.log(
          `Frontend: ${FRONTEND_URL}`
        );
        console.log(
          `API: http://localhost:${PORT}/api`
        );
        console.log(
          `Database: ${mongoose.connection.name}`
        );
        console.log(
          "======================================"
        );
        console.log("");
      }
    );
  };

// ======================================================
// SHUTDOWN
// ======================================================

const gracefulShutdown =
  async (
    signal: string
  ): Promise<void> => {
    console.log(
      `\n${signal} received.`
    );

    try {
      await mongoose.connection.close();

      console.log(
        "MongoDB connection closed."
      );

      process.exit(0);
    } catch (error) {
      console.error(
        "Shutdown error:",
        error
      );

      process.exit(1);
    }
  };

process.on(
  "SIGINT",
  () => {
    void gracefulShutdown("SIGINT");
  }
);

process.on(
  "SIGTERM",
  () => {
    void gracefulShutdown("SIGTERM");
  }
);

// ======================================================
// PROCESS ERRORS
// ======================================================

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "Unhandled Promise Rejection:",
      reason
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught Exception:",
      error
    );
  }
);

// ======================================================
// RUN
// ======================================================

startServer().catch(
  (error) => {
    console.error(
      "❌ Fatal startup error:",
      error
    );

    process.exit(1);
  }
);
// ======================================================
// EXAMFORGE BACKEND - SERVER
// ======================================================

import dns from "node:dns";

// ======================================================
// MONGODB ATLAS SRV DNS
// ======================================================

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

// ======================================================
// ENVIRONMENT
// ======================================================

import "dotenv/config";

// ======================================================
// EXPRESS
// ======================================================

import express, {
  Request,
  Response,
  NextFunction,
} from "express";

// ======================================================
// MIDDLEWARE
// ======================================================

import cors from "cors";
import cookieParser from "cookie-parser";

// ======================================================
// DATABASE
// ======================================================

import mongoose from "mongoose";

// ======================================================
// ROUTES
// ======================================================

import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import examRoutes from "./routes/examRoutes";
import attemptRoutes from "./routes/attemptRoutes";
import questionRoutes from "./routes/questionRoutes";
import adminRoutes from "./routes/adminRoutes";

// ======================================================
// APP
// ======================================================

const app = express();

// ======================================================
// CONFIGURATION
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
// ENVIRONMENT CHECK
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
// COOKIE PARSER
// ======================================================

app.use(
  cookieParser()
);

// ======================================================
// REQUEST LOGGER
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
// ROOT HEALTH CHECK
// ======================================================

app.get(
  "/",
  (
    _req: Request,
    res: Response
  ) => {
    return res.status(200).json({
      message:
        "ExamForge API is running",

      status: "OK",

      timestamp:
        new Date().toISOString(),
    });
  }
);

// ======================================================
// API HEALTH CHECK
// ======================================================

app.get(
  "/api",
  (
    _req: Request,
    res: Response
  ) => {
    return res.status(200).json({
      message:
        "ExamForge API is running",

      status: "OK",
    });
  }
);

// ======================================================
// API ROUTES
// ======================================================

// ------------------------------------------------------
// Authentication
// ------------------------------------------------------

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

// ------------------------------------------------------
// Student / Instructor profiles
// ------------------------------------------------------

app.use(
  "/api/profile",
  profileRoutes
);

// ------------------------------------------------------
// Exams
// ------------------------------------------------------

app.use(
  "/api/exams",
  examRoutes
);

// ------------------------------------------------------
// Attempts
// ------------------------------------------------------

app.use(
  "/api/attempts",
  attemptRoutes
);

// ------------------------------------------------------
// Question Bank
// ------------------------------------------------------

app.use(
  "/api/questions",
  questionRoutes
);

// ======================================================
// API 404 HANDLER
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

      method:
        req.method,

      path:
        req.originalUrl,
    });
  }
);

// ======================================================
// GLOBAL ERROR HANDLER
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
// MONGODB CONNECTION
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
          serverSelectionTimeoutMS:
            15000,

          connectTimeoutMS:
            15000,

          socketTimeoutMS:
            45000,

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

      // ------------------------------------------------
      // Verify expected database
      // ------------------------------------------------

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
        "❌ MongoDB connection failed:"
      );

      console.error(
        error
      );

      // ------------------------------------------------
      // Helpful DNS error information
      // ------------------------------------------------

      if (
        error instanceof Error
      ) {
        const message =
          error.message;

        if (
          message.includes(
            "querySrv"
          ) ||
          message.includes(
            "ECONNREFUSED"
          ) ||
          message.includes(
            "ENOTFOUND"
          )
        ) {
          console.error("");
          console.error(
            "MongoDB Atlas DNS resolution failed."
          );

          console.error(
            "The application is using Google DNS:"
          );

          console.error(
            "8.8.8.8 / 8.8.4.4"
          );

          console.error("");
        }
      }

      process.exit(1);
    }
  };

// ======================================================
// START SERVER
// ======================================================

const startServer =
  async (): Promise<void> => {
    // --------------------------------------------------
    // Connect to MongoDB first
    // --------------------------------------------------

    await connectDatabase();

    // --------------------------------------------------
    // Start Express
    // --------------------------------------------------

    app.listen(
      PORT,
      () => {
        console.log("");

        console.log(
          "=========================================="
        );

        console.log(
          "🚀 EXAMFORGE BACKEND STARTED"
        );

        console.log(
          "=========================================="
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

        console.log("");

        console.log(
          "Available APIs:"
        );

        console.log(
          `Auth:      http://localhost:${PORT}/api/auth`
        );

        console.log(
          `Profile:   http://localhost:${PORT}/api/profile`
        );

        console.log(
          `Exams:     http://localhost:${PORT}/api/exams`
        );

        console.log(
          `Attempts:  http://localhost:${PORT}/api/attempts`
        );

        console.log(
          `Questions: http://localhost:${PORT}/api/questions`
        );

        console.log("");

        console.log(
          "=========================================="
        );

        console.log("");
      }
    );
  };

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

const gracefulShutdown =
  async (
    signal: string
  ): Promise<void> => {
    console.log(
      `\n${signal} received.`
    );

    console.log(
      "Closing MongoDB connection..."
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

// ======================================================
// PROCESS SIGNALS
// ======================================================

process.on(
  "SIGINT",
  () => {
    void gracefulShutdown(
      "SIGINT"
    );
  }
);

process.on(
  "SIGTERM",
  () => {
    void gracefulShutdown(
      "SIGTERM"
    );
  }
);

// ======================================================
// UNHANDLED PROMISE REJECTION
// ======================================================

process.on(
  "unhandledRejection",
  (
    reason
  ) => {
    console.error(
      "Unhandled Promise Rejection:",
      reason
    );
  }
);

// ======================================================
// UNCAUGHT EXCEPTION
// ======================================================

process.on(
  "uncaughtException",
  (
    error
  ) => {
    console.error(
      "Uncaught Exception:",
      error
    );
  }
);

// ======================================================
// RUN SERVER
// ======================================================

startServer().catch(
  (
    error
  ) => {
    console.error(
      "❌ Fatal startup error:",
      error
    );

    process.exit(1);
  }
);
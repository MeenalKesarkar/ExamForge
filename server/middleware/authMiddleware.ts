// ======================================================
// EXAMFORGE - AUTHENTICATION MIDDLEWARE
// ======================================================

import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt, {
  JwtPayload,
} from "jsonwebtoken";

import User from "../models/User";

// ======================================================
// ACCESS TOKEN COOKIE
// ======================================================

const ACCESS_TOKEN_COOKIE =
  "examforge_access_token";

// ======================================================
// AUTHENTICATED REQUEST
// ======================================================

export interface AuthenticatedRequest
  extends Request {
  user?: {
    userId: string;

    role:
      | "student"
      | "instructor";
  };
}

// ======================================================
// JWT PAYLOAD
// ======================================================

interface TokenPayload
  extends JwtPayload {
  userId: string;

  role:
    | "student"
    | "instructor";
}

// ======================================================
// REQUIRE AUTHENTICATION
// ======================================================
//
// This middleware:
// 1. Reads the HttpOnly access-token cookie
// 2. Verifies the JWT
// 3. Checks the user in MongoDB
// 4. Checks whether the account is active
// 5. Checks the JWT role
// 6. Adds user information to req.user
//
// ======================================================

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // --------------------------------------------------
    // Get access token
    // --------------------------------------------------

    const token =
      req.cookies?.[
        ACCESS_TOKEN_COOKIE
      ];

    if (!token) {
      res.status(401).json({
        message:
          "Authentication required",
      });

      return;
    }

    // --------------------------------------------------
    // Get JWT secret
    // --------------------------------------------------

    const accessTokenSecret =
      process.env
        .ACCESS_TOKEN_SECRET;

    if (!accessTokenSecret) {
      console.error(
        "❌ ACCESS_TOKEN_SECRET is missing from .env"
      );

      res.status(500).json({
        message:
          "Authentication configuration is missing",
      });

      return;
    }

    // --------------------------------------------------
    // Verify JWT
    // --------------------------------------------------

    let decoded:
      TokenPayload;

    try {
      decoded =
        jwt.verify(
          token,
          accessTokenSecret
        ) as TokenPayload;
    } catch (error) {
      console.error(
        "Access token verification failed:",
        error
      );

      res.status(401).json({
        message:
          "Access token is invalid or expired",
      });

      return;
    }

    // --------------------------------------------------
    // Validate JWT payload
    // --------------------------------------------------

    if (
      !decoded.userId ||
      !decoded.role
    ) {
      res.status(401).json({
        message:
          "Invalid authentication token",
      });

      return;
    }

    // --------------------------------------------------
    // Validate role
    // --------------------------------------------------

    if (
      decoded.role !==
        "student" &&
      decoded.role !==
        "instructor"
    ) {
      res.status(401).json({
        message:
          "Invalid user role",
      });

      return;
    }

    // --------------------------------------------------
    // Find user in MongoDB
    // --------------------------------------------------

    const user =
      await User.findById(
        decoded.userId
      ).select(
        "_id role isActive"
      );

    if (!user) {
      res.status(401).json({
        message:
          "User not found",
      });

      return;
    }

    // --------------------------------------------------
    // Check active account
    // --------------------------------------------------

    if (!user.isActive) {
      res.status(403).json({
        message:
          "Your account has been disabled",
      });

      return;
    }

    // --------------------------------------------------
    // Verify JWT role matches DB role
    // --------------------------------------------------

    if (
      user.role !==
      decoded.role
    ) {
      console.error(
        "Role mismatch:",
        {
          jwtRole:
            decoded.role,
          databaseRole:
            user.role,
          userId:
            decoded.userId,
        }
      );

      res.status(401).json({
        message:
          "Authentication role mismatch",
      });

      return;
    }

    // --------------------------------------------------
    // Attach authenticated user
    // --------------------------------------------------

    req.user = {
      userId:
        decoded.userId,

      role:
        decoded.role,
    };

    // --------------------------------------------------
    // Continue
    // --------------------------------------------------

    next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error
    );

    res.status(500).json({
      message:
        "Authentication error",
    });

    return;
  }
};

// ======================================================
// REQUIRE ROLE
// ======================================================
//
// Usage:
//
// requireAuth,
// requireRole("student")
//
// OR:
//
// requireAuth,
// requireRole("instructor")
//
// ======================================================

export const requireRole =
  (
    ...allowedRoles: Array<
      "student" | "instructor"
    >
  ) =>
  (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // --------------------------------------------------
    // Authentication must happen first
    // --------------------------------------------------

    if (!req.user) {
      res.status(401).json({
        message:
          "Authentication required",
      });

      return;
    }

    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      res.status(403).json({
        message:
          "You do not have permission to access this resource",
      });

      return;
    }

    // --------------------------------------------------
    // Role accepted
    // --------------------------------------------------

    next();
  };
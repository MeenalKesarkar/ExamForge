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

const REFRESH_TOKEN_COOKIE =
  "examforge_refresh_token";

const SESSION_LIFETIME_SECONDS =
  24 * 60 * 60;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production"
    ? ("none" as const)
    : ("lax" as const),
  path: "/",
};

// ======================================================
// AUTHENTICATED REQUEST
// ======================================================

export interface AuthenticatedRequest
  extends Request {
  user?: {
    userId: string;

    role:
      | "student"
      | "instructor"
      | "admin";
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
    | "instructor"
    | "admin";

  sessionExpiresAt?: number;
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

    let decoded: TokenPayload;
    let refreshedSessionExpiresAt: number | null = null;

    try {
      decoded =
        jwt.verify(
          token as string,
          accessTokenSecret
        ) as TokenPayload;
    } catch {
      const refreshToken =
        req.cookies?.[REFRESH_TOKEN_COOKIE];
      const refreshTokenSecret =
        process.env.REFRESH_TOKEN_SECRET ||
        process.env.ACCESS_TOKEN_SECRET;

      if (!refreshToken || !refreshTokenSecret) {
        res.status(401).json({
          message: "Session expired",
        });
        return;
      }

      let refreshPayload: TokenPayload;
      try {
        refreshPayload = jwt.verify(
          refreshToken,
          refreshTokenSecret
        ) as TokenPayload;
      } catch {
        res.status(401).json({
          message: "Session expired",
        });
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const absoluteExpiry = Math.min(
        refreshPayload.sessionExpiresAt ??
          (refreshPayload.iat ?? now) + SESSION_LIFETIME_SECONDS,
        (refreshPayload.iat ?? now) + SESSION_LIFETIME_SECONDS,
        refreshPayload.exp ?? 0
      );

      if (
        !refreshPayload.userId ||
        !refreshPayload.role ||
        absoluteExpiry <= now
      ) {
        res.status(401).json({
          message: "Session expired",
        });
        return;
      }

      const refreshRoleIsValid =
        refreshPayload.role === "student" ||
        refreshPayload.role === "instructor" ||
        refreshPayload.role === "admin";

      if (!refreshRoleIsValid) {
        res.status(401).json({
          message: "Invalid refresh session",
        });
        return;
      }

      const accessTokenSecret =
        process.env.ACCESS_TOKEN_SECRET;
      if (!accessTokenSecret) {
        res.status(500).json({
          message: "Authentication configuration is missing",
        });
        return;
      }

      const remainingSeconds = absoluteExpiry - now;
      const newAccessToken = jwt.sign(
        {
          userId: refreshPayload.userId,
          role: refreshPayload.role,
          sessionExpiresAt: absoluteExpiry,
        },
        accessTokenSecret,
        { expiresIn: Math.min(15 * 60, remainingSeconds) }
      );

      res.cookie(
        ACCESS_TOKEN_COOKIE,
        newAccessToken,
        {
          ...cookieOptions,
          maxAge: Math.min(15 * 60, remainingSeconds) * 1000,
        }
      );

      decoded = refreshPayload;
      refreshedSessionExpiresAt = absoluteExpiry;
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

    const currentTime = Math.floor(Date.now() / 1000);
    if (
      decoded.sessionExpiresAt &&
      decoded.sessionExpiresAt <= currentTime
    ) {
      res.status(401).json({
        message: "Session expired",
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
        "instructor" &&
      decoded.role !==
        "admin"
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
        "_id role accountStatus isActive"
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

    if (
      (user.accountStatus ?? "approved") !== "approved"
    ) {
      res.status(403).json({
        message: "Your account is not approved",
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

    if (refreshedSessionExpiresAt) {
      res.setHeader(
        "X-Session-Expires-At",
        String(refreshedSessionExpiresAt * 1000)
      );
    }

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
      "student" | "instructor" | "admin"
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

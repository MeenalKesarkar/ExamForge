import { Router, Response } from "express";

import User from "../models/User";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";

const router = Router();

/* =========================================================
   Helpers
========================================================= */

const normalizeString = (
  value: unknown
): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
};

const sanitizeUser = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,

  degree: user.degree,
  yearOfStudy: user.yearOfStudy,
  semester: user.semester,
  studentId: user.studentId,

  phone: user.phone,
  city: user.city,
  bio: user.bio,
  profilePicture: user.profilePicture || null,
});

/* =========================================================
   GET CURRENT PROFILE
   GET /api/profile/me
========================================================= */

router.get(
  "/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const user = await User.findById(
        req.user.userId
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message:
            "Your account has been disabled",
        });
      }

      return res.status(200).json({
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error(
        "GET /api/profile/me error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load your profile",
      });
    }
  }
);

/* =========================================================
   UPDATE CURRENT PROFILE
   PUT /api/profile/me
========================================================= */

router.put(
  "/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const user = await User.findById(
        req.user.userId
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message:
            "Your account has been disabled",
        });
      }

      /*
       * Name
       */
      if (req.body.name !== undefined) {
        const name = normalizeString(
          req.body.name
        );

        if (!name) {
          return res.status(400).json({
            message: "Name cannot be empty",
          });
        }

        if (name.length < 2) {
          return res.status(400).json({
            message:
              "Name must contain at least 2 characters",
          });
        }

        if (name.length > 100) {
          return res.status(400).json({
            message:
              "Name cannot exceed 100 characters",
          });
        }

        user.name = name;
      }

      /*
       * Phone
       */
      if (req.body.phone !== undefined) {
        const phone =
          normalizeString(
            req.body.phone
          );

        if (
          phone &&
          phone.length > 20
        ) {
          return res.status(400).json({
            message:
              "Phone number is too long",
          });
        }

        user.phone = phone;
      }

      /*
       * City
       */
      if (req.body.city !== undefined) {
        const city =
          normalizeString(
            req.body.city
          );

        if (
          city &&
          city.length > 100
        ) {
          return res.status(400).json({
            message:
              "City name is too long",
          });
        }

        user.city = city;
      }

      /*
       * Bio
       */
      if (req.body.bio !== undefined) {
        const bio =
          normalizeString(
            req.body.bio
          );

        if (
          bio &&
          bio.length > 500
        ) {
          return res.status(400).json({
            message:
              "Bio cannot exceed 500 characters",
          });
        }

        user.bio = bio;
      }

      /*
       * Profile picture
       *
       * For now this accepts a URL/string.
       * Actual image upload can be added later.
       */
      if (
        req.body.profilePicture !==
        undefined
      ) {
        const profilePicture =
          normalizeString(
            req.body.profilePicture
          );

        if (
          profilePicture &&
          profilePicture.length > 2000
        ) {
          return res.status(400).json({
            message:
              "Profile picture URL is too long",
          });
        }

        user.profilePicture =
          profilePicture || null;
      }

      /*
       * Academic fields are intentionally controlled
       * more strictly.
       *
       * Students should not be able to change their
       * student ID, degree, year or semester through
       * the normal profile update endpoint.
       *
       * These can be managed by the instructor/admin.
       */

      /*
       * Email is also intentionally NOT changed here.
       *
       * Email changes should use a separate OTP
       * verification flow.
       */
      if (
        req.body.email !== undefined &&
        req.body.email !== user.email
      ) {
        return res.status(400).json({
          message:
            "Email changes require OTP verification",
        });
      }

      await user.save();

      return res.status(200).json({
        message:
          "Profile updated successfully",
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error(
        "PUT /api/profile/me error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update your profile",
      });
    }
  }
);

export default router;
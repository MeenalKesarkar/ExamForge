import express, {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt, {
  JwtPayload,
} from "jsonwebtoken";

import User from "../models/User";

const router = express.Router();

// ======================================================
// TYPES
// ======================================================

interface AuthTokenPayload
  extends JwtPayload {
  userId: string;
  role:
    | "student"
    | "instructor";
}

// ======================================================
// AUTHENTICATION
// ======================================================

const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.examforge_access_token;

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const secret =
      process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      console.error(
        "ACCESS_TOKEN_SECRET is missing from .env"
      );

      return res.status(500).json({
        message:
          "Authentication configuration is missing",
      });
    }

    const decoded =
      jwt.verify(
        token,
        secret
      ) as AuthTokenPayload;

    if (!decoded.userId) {
      return res.status(401).json({
        message:
          "Invalid authentication token",
      });
    }

    (
      req as Request & {
        user?: AuthTokenPayload;
      }
    ).user = decoded;

    next();
  } catch (error) {
    console.error(
      "Profile authentication error:",
      error
    );

    return res.status(401).json({
      message:
        "Invalid or expired authentication token",
    });
  }
};

// ======================================================
// GET MY PROFILE
// ======================================================
//
// GET /api/profile/me
//
// ======================================================

router.get(
  "/me",
  authenticate,
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const authReq =
        req as Request & {
          user?: AuthTokenPayload;
        };

      const userId =
        authReq.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      const user =
        await User.findById(
          userId
        ).select(
          "-passwordHash"
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      return res.status(200).json({
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),

          name: user.name,
          email: user.email,
          role: user.role,

          degree:
            user.degree || "BCA",

          yearOfStudy:
            user.yearOfStudy,

          semester:
            user.semester,

          studentId:
            user.studentId || "",

          phone:
            user.phone || "",

          city:
            user.city || "",

          bio:
            user.bio || "",

          profilePicture:
            user.profilePicture || "",

          isActive:
            user.isActive,
        },
      });
    } catch (error) {
      console.error(
        "Get profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load profile",
      });
    }
  }
);

// ======================================================
// UPDATE MY PROFILE
// ======================================================
//
// PUT /api/profile/me
//
// ======================================================

router.put(
  "/me",
  authenticate,
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const authReq =
        req as Request & {
          user?: AuthTokenPayload;
        };

      const userId =
        authReq.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const {
        name,
        phone,
        city,
        bio,
        yearOfStudy,
        semester,
        studentId,
        profilePicture,
        email,
      } = req.body;

      // ==================================================
      // EMAIL
      // ==================================================
      //
      // Email is intentionally NOT changed here.
      // It will be changed through OTP verification.
      //

      if (
        typeof email === "string" &&
        email
          .trim()
          .toLowerCase() !==
          user.email.toLowerCase()
      ) {
        return res.status(400).json({
          message:
            "Email changes require OTP verification.",
        });
      }

      // ==================================================
      // NAME
      // ==================================================

      if (
        typeof name === "string"
      ) {
        const cleanedName =
          name.trim();

        if (!cleanedName) {
          return res.status(400).json({
            message:
              "Name cannot be empty.",
          });
        }

        if (
          cleanedName.length > 100
        ) {
          return res.status(400).json({
            message:
              "Name cannot exceed 100 characters.",
          });
        }

        user.name =
          cleanedName;
      }

      // ==================================================
      // PHONE
      // ==================================================

      if (
        typeof phone === "string"
      ) {
        user.phone =
          phone.trim();
      }

      // ==================================================
      // CITY
      // ==================================================

      if (
        typeof city === "string"
      ) {
        user.city =
          city.trim();
      }

      // ==================================================
      // BIO
      // ==================================================

      if (
        typeof bio === "string"
      ) {
        const cleanedBio =
          bio.trim();

        if (
          cleanedBio.length > 500
        ) {
          return res.status(400).json({
            message:
              "About me cannot exceed 500 characters.",
          });
        }

        user.bio =
          cleanedBio;
      }

      // ==================================================
      // YEAR
      // ==================================================

      if (
        yearOfStudy !== undefined &&
        yearOfStudy !== null &&
        yearOfStudy !== ""
      ) {
        const year =
          Number(yearOfStudy);

        if (
          !Number.isInteger(year) ||
          year < 1 ||
          year > 3
        ) {
          return res.status(400).json({
            message:
              "Please select a valid BCA year.",
          });
        }

        user.yearOfStudy =
          year;
      }

      // ==================================================
      // SEMESTER
      // ==================================================

      if (
        semester !== undefined &&
        semester !== null &&
        semester !== ""
      ) {
        const selectedSemester =
          Number(semester);

        if (
          !Number.isInteger(
            selectedSemester
          ) ||
          selectedSemester < 1 ||
          selectedSemester > 6
        ) {
          return res.status(400).json({
            message:
              "Please select a valid semester.",
          });
        }

        user.semester =
          selectedSemester;
      }

      // ==================================================
      // STUDENT ID
      // ==================================================

      if (
        typeof studentId ===
        "string"
      ) {
        const cleanedStudentId =
          studentId.trim();

        if (
          cleanedStudentId &&
          user.role === "student"
        ) {
          const existingStudent =
            await User.findOne({
              studentId:
                cleanedStudentId,

              _id: {
                $ne: user._id,
              },
            });

          if (existingStudent) {
            return res.status(409).json({
              message:
                "This student ID is already in use.",
            });
          }

          user.studentId =
            cleanedStudentId;
        }
      }

      // ==================================================
      // PROFILE PICTURE
      // ==================================================

      if (
        typeof profilePicture ===
        "string"
      ) {
        // Allow removing the picture
        if (
          profilePicture === ""
        ) {
          user.profilePicture =
            "";
        } else {
          // Make sure it is an image data URL
          if (
            !profilePicture.startsWith(
              "data:image/"
            )
          ) {
            return res.status(400).json({
              message:
                "Invalid profile picture format.",
            });
          }

          // Prevent very large images
          if (
            profilePicture.length >
            3_000_000
          ) {
            return res.status(400).json({
              message:
                "Profile picture is too large. Please choose an image below 2 MB.",
            });
          }

          user.profilePicture =
            profilePicture;
        }
      }

      // ==================================================
      // SAVE
      // ==================================================

      await user.save();

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        message:
          "Profile updated successfully.",

        user: {
          id: user._id.toString(),
          _id: user._id.toString(),

          name: user.name,
          email: user.email,
          role: user.role,

          degree:
            user.degree || "BCA",

          yearOfStudy:
            user.yearOfStudy,

          semester:
            user.semester,

          studentId:
            user.studentId || "",

          phone:
            user.phone || "",

          city:
            user.city || "",

          bio:
            user.bio || "",

          profilePicture:
            user.profilePicture || "",

          isActive:
            user.isActive,
        },
      });
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update profile",
      });
    }
  }
);

export default router;